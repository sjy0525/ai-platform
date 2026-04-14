import { Controller, Post, Body, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as cheerio from 'cheerio';
import { ArticleService } from '../article/article.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatDto {
  articleId: string;
  messages: ChatMessage[];
}

@Controller('ai')
export class AiController {
  constructor(
    private configService: ConfigService,
    private articleService: ArticleService,
  ) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Res() res: Response) {
    const { articleId, messages } = dto;

    // 构建 system prompt
    let systemContent = '你是一个专业的文章阅读助手，请用中文回答用户的问题。';

    const article = await this.articleService.findById(articleId);
    if (article) {
      let plainText = '';
      try {
        const html = await this.articleService.fetchArticleContent(article.url);
        const $ = cheerio.load(html);
        plainText = $.text().replace(/\s+/g, ' ').trim().slice(0, 6000);
      } catch {}

      systemContent =
        `你是一个专业的文章阅读助手，请用中文回答用户关于以下文章的问题。\n\n` +
        `文章标题：${article.title}\n` +
        `作者：${article.author || '匿名'}\n` +
        `分类：${article.tag}\n\n` +
        `文章内容：\n${plainText || '（内容暂无法获取，请根据标题辅助回答）'}\n\n` +
        `请基于以上文章内容回答用户的问题。如果问题超出文章范围，请如实说明。`;
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const baseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com');
    const model = this.configService.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');

    try {
      const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemContent }, ...messages],
          stream: true,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!upstream.ok || !upstream.body) {
        const errBody = await upstream.text().catch(() => '');
        console.error('[AI] DeepSeek 响应异常', upstream.status, errBody);
        res.write(`data: ${JSON.stringify({ error: `AI 服务异常 (${upstream.status}): ${errBody}` })}\n\n`);
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('[AI] fetch 异常', e);
      res.write(`data: ${JSON.stringify({ error: `请求失败: ${e instanceof Error ? e.message : String(e)}` })}\n\n`);
    }

    res.end();
  }
}
