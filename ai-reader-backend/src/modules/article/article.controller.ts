import { Controller, Get, Post, Body, Query, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('articles')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  /** 热榜：获取最火的技术文章（支持按平台、标签筛选） */
  @Get('hot')
  async getHotList(
    @Query('platform') platform?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
  ) {
    return this.articleService.getHotList(platform, tag, sort);
  }

  /** 订阅文章：用户输入关键词，返回最符合的3篇文章（P2 工作流） */
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async getSubscribeArticles(@Body('keyword') keyword: string) {
    if (!keyword || typeof keyword !== 'string') {
      return { articles: [], message: '请提供有效的订阅关键词' };
    }
    const articles = await this.articleService.getArticlesByKeyword(
      keyword.trim(),
      3,
    );
    return { articles };
  }

  /** 手动触发热榜同步（也可由定时任务执行） */
  @Get('hot/sync')
  async syncHot() {
    await this.articleService.syncHotToVector();
    return { success: true, message: '热榜同步完成' };
  }

  /** 根据 ID 获取文章元数据 */
  @Get(':id')
  async getArticleById(@Param('id') id: string) {
    const article = await this.articleService.findById(id);
    if (!article) throw new NotFoundException('文章不存在');
    return article;
  }

  /** 抓取文章正文内容 */
  @Get(':id/content')
  async getArticleContent(@Param('id') id: string) {
    const article = await this.articleService.findById(id);
    if (!article) throw new NotFoundException('文章不存在');
    try {
      const content = await this.articleService.fetchArticleContent(article.url);
      return { content };
    } catch {
      return { content: '' };
    }
  }
}
