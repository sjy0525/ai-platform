import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as cheerio from 'cheerio';
import { Article } from '../../entities/article.entity';
import { VectorService } from '../vector/vector.service';

const CONTENT_SELECTORS: Record<string, string> = {
  'juejin.cn':    '.article-content, .markdown-body',
  'csdn.net':     '#article_content, .article-content',
  'cnblogs.com':  '#cnblogs_post_body',
  'oschina.net':  '.article-detail, .content',
  'segmentfault': '.article-content, .article__content',
  'infoq.cn':     '.article-preview, .article-detail',
};
const DEFAULT_SELECTOR = 'article, [class*="article"], [class*="content"], [class*="post"], main';
const REMOVE_TAGS = ['script', 'style', 'iframe', 'noscript', 'aside', 'nav', 'footer', '[class*="ad"]', '[class*="recommend"]', '[class*="comment"]'];

const HOT_API_BASE = 'https://api.pearktrue.cn/api/dailyhot/';
const HOT_PLATFORMS = ['稀土掘金', 'CSDN', '博客园', '开源中国'] as const;
const ARTICLES_PER_TAG = 10;
const HOT_TECH_TAGS = ['前端', '后端', 'AI编程', 'Android', '架构', '面试'] as const;
const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  { tag: '前端', keywords: ['react', 'vue', '前端', 'javascript', 'typescript', 'css', 'html'] },
  { tag: '后端', keywords: ['后端', 'java', 'spring', 'golang', 'go ', 'node', 'nestjs', 'mysql', 'redis'] },
  { tag: 'AI编程', keywords: ['ai', 'llm', '大模型', 'agent', 'prompt', 'cursor', 'copilot', 'aigc'] },
  { tag: 'Android', keywords: ['android', 'kotlin', 'jetpack'] },
  { tag: '架构', keywords: ['架构', '微服务', '高并发', '系统设计'] },
  { tag: '面试', keywords: ['面试', '八股', '校招', '社招'] },
];
const NON_TECH_KEYWORDS = [
  '情感',
  '恋爱',
  '婚姻',
  '育儿',
  '娱乐',
  '明星',
  '搞笑',
  '影视',
  '旅游',
  '美食',
  '股票',
  '基金',
  '房产',
  '养生',
  '减肥',
];
const TAG_ALIAS_TO_STACK: Record<string, (typeof HOT_TECH_TAGS)[number]> = {
  javascript: '前端',
  typescript: '前端',
  react: '前端',
  vue: '前端',
  java: '后端',
  golang: '后端',
  go: '后端',
  mysql: '后端',
  redis: '后端',
  ai编程: 'AI编程',
  aigc: 'AI编程',
  cursor: 'AI编程',
  copilot: 'AI编程',
  android: 'Android',
  架构: '架构',
  面试: '面试',
  前端: '前端',
  后端: '后端',
};
const STRICT_QUERY_KEYWORDS: Record<string, string[]> = {
  javascript: ['javascript', ' js ', 'js ', ' js', 'node.js', 'typescript'],
  面试: ['面试', '面经', '八股', '校招', '社招', '算法题'],
  面经: ['面试', '面经', '八股', '校招', '社招', '算法题'],
  架构: ['架构', '微服务', '高并发', '系统设计', '分布式', 'ddd', '设计模式'],
};

export interface HotArticleItem {
  id: string;
  title: string;
  author: string;
  hot: number;
  url: string;
  mobileUrl: string;
  source: string;
  tag: string;
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    private vectorService: VectorService,
  ) {}

  /** 从第三方 API 获取热榜文章 */
  async fetchHotFromThirdParty(
    platform: string = '稀土掘金',
    tag?: string,
  ): Promise<HotArticleItem[]> {
    const url = tag
      ? `${HOT_API_BASE}?title=${encodeURIComponent(platform)}&type=${encodeURIComponent(tag)}`
      : `${HOT_API_BASE}?title=${encodeURIComponent(platform)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code !== 200 || !json.data) return [];
    const items = (json.data as HotArticleItem[]).slice(0, ARTICLES_PER_TAG);
    return items.map((item: { id: string; title: string; author: string; hot: number; url: string; mobileUrl: string }) => ({
      ...item,
      source: platform,
      tag: tag || this.inferTagFromTitle(item.title),
    }));
  }

  /** 定时任务：获取热榜并存入 Milvus */
  async syncHotToVector(): Promise<void> {
    const rawArticles: HotArticleItem[] = [];
    for (const platform of HOT_PLATFORMS) {
      try {
        // 先抓平台综合热榜，再按技术栈提示词扩抓，提高技术内容覆盖率
        rawArticles.push(...(await this.fetchHotFromThirdParty(platform)));
        for (const techTag of HOT_TECH_TAGS) {
          rawArticles.push(...(await this.fetchHotFromThirdParty(platform, techTag)));
        }
      } catch (e) {
        console.warn(`获取 ${platform} 热榜失败:`, (e as Error).message);
      }
    }
    const allArticles = this.cleanAndSelectByTag(rawArticles);
    if (allArticles.length === 0) return;

    await this.articleRepository.delete({
      tag: In([...HOT_TECH_TAGS]),
    });

    // 存入 MySQL
    for (const a of allArticles) {
      await this.articleRepository.upsert(
        {
          id: a.id,
          title: a.title,
          author: a.author,
          hot: a.hot,
          url: a.url,
          mobileUrl: a.mobileUrl || a.url,
          source: a.source,
          tag: a.tag,
        },
        ['id'],
      );
    }

    // 存入 Milvus 向量库
    const forVector = allArticles.map((a) => ({
      id: a.id,
      title: a.title,
      content: `${a.title} ${a.author}`,
    }));
    await this.vectorService.insertArticles(forVector);
  }

  /** 获取热榜文章列表（供前端展示） */
  async getHotList(platform?: string, tag?: string): Promise<Article[]> {
    const qb = this.articleRepository.createQueryBuilder('a').orderBy('a.hot', 'DESC').take(50);
    if (platform) qb.andWhere('a.source = :platform', { platform });
    if (tag) qb.andWhere('a.tag = :tag', { tag });
    return qb.getMany();
  }

  /** P2 工作流：根据关键词获取订阅文章（最多3篇） */
  async getArticlesByKeyword(keyword: string, topK = 3): Promise<Article[]> {
    const normalizedKeyword = keyword.trim();
    const requestedTag = this.resolveRequestedTag(normalizedKeyword);
    const strictKeywords = this.getStrictQueryKeywords(normalizedKeyword);

    // 0. 如果输入是标签词，先在该技术栈内返回最相关文章，避免串标签
    if (requestedTag) {
      const taggedArticles = await this.articleRepository.find({
        where: { tag: requestedTag },
        order: { hot: 'DESC' },
        take: 100,
      });
      const strictMatched = taggedArticles.filter((article) => {
        if (strictKeywords.length > 0) {
          return this.titleContainsAny(article.title, strictKeywords);
        }
        return this.isTagRelevantTitle(article.title, requestedTag, normalizedKeyword);
      });
      if (strictMatched.length >= topK) {
        return strictMatched.slice(0, topK);
      }
      if (taggedArticles.length >= topK) {
        return taggedArticles.slice(0, topK);
      }
    }

    // 1. 先查向量数据库
    const ids = await this.vectorService.searchByKeyword(normalizedKeyword, topK * 3);
    if (ids.length > 0) {
      const articles = await this.articleRepository.find({
        where: { id: In(ids) },
      });
      let ordered = this.orderByIds(articles, ids);
      if (requestedTag) {
        ordered = ordered.filter((article) => article.tag === requestedTag);
      }
      if (ordered.length >= topK) {
        return ordered.slice(0, topK);
      }
    }

    // 2. 向量库没有或不足，从第三方 API 获取
    const fromApi: HotArticleItem[] = [];
    for (const platform of HOT_PLATFORMS) {
      fromApi.push(...(await this.fetchHotFromThirdParty(platform)));
    }
    const filtered = fromApi.filter((a) => {
      if (strictKeywords.length > 0) {
        return this.titleContainsAny(a.title, strictKeywords);
      }
      return (
        a.title.includes(normalizedKeyword) ||
        (a.author && a.author.includes(normalizedKeyword))
      );
    });
    const filteredByTag = requestedTag
      ? filtered.filter((a) => this.inferTagFromTitle(a.title) === requestedTag)
      : filtered;
    if (filteredByTag.length === 0) {
      if (requestedTag || strictKeywords.length > 0) {
        return [];
      }
      return fromApi.slice(0, topK).map((a) => this.toArticleEntity(a));
    }
    const toSave = filteredByTag.slice(0, topK);
    for (const a of toSave) {
      await this.articleRepository.upsert(
        {
          id: a.id,
          title: a.title,
          author: a.author,
          hot: a.hot,
          url: a.url,
          mobileUrl: a.mobileUrl || a.url,
          source: a.source,
          tag: a.tag,
        },
        ['id'],
      );
    }
    await this.vectorService.insertArticles(
      toSave.map((a) => ({ id: a.id, title: a.title, content: `${a.title} ${a.author}` })),
    );
    return toSave.map((a) => this.toArticleEntity(a));
  }

  private toArticleEntity(a: HotArticleItem): Article {
    const e = new Article();
    e.id = a.id;
    e.title = a.title;
    e.author = a.author;
    e.hot = a.hot;
    e.url = a.url;
    e.mobileUrl = a.mobileUrl || a.url;
    e.source = a.source;
    e.tag = a.tag;
    return e;
  }

  private orderByIds(articles: Article[], ids: string[]): Article[] {
    const map = new Map(articles.map((a) => [a.id, a]));
    return ids.map((id) => map.get(id)).filter(Boolean) as Article[];
  }

  async findByIds(ids: string[]): Promise<Article[]> {
    if (ids.length === 0) return [];
    return this.articleRepository.find({ where: { id: In(ids) } });
  }

  async fetchContent(articleId: string): Promise<{ html: string; success: boolean }> {
    const article = await this.articleRepository.findOne({ where: { id: articleId } });
    if (!article) return { html: '', success: false };

    const targetUrl = article.mobileUrl || article.url;
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': new URL(targetUrl).origin,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return { html: '', success: false };
      const rawHtml = await res.text();
      const $ = cheerio.load(rawHtml);

      // 移除干扰元素
      REMOVE_TAGS.forEach((sel) => $(sel).remove());

      // 按域名选对应选择器
      const hostname = new URL(targetUrl).hostname;
      const siteKey = Object.keys(CONTENT_SELECTORS).find((k) => hostname.includes(k));
      const selector = siteKey ? CONTENT_SELECTORS[siteKey] : DEFAULT_SELECTOR;

      let contentEl = $(selector).first();
      if (!contentEl.length) {
        // 兜底：取 body 内文字最多的 div
        let best = { len: 0, el: null as cheerio.Cheerio<cheerio.Element> | null };
        $('div, section, article').each((_, el) => {
          const text = $(el).text().trim().length;
          if (text > best.len) { best = { len: text, el: $(el) }; }
        });
        contentEl = best.el ?? $('body');
      }

      // 修正相对路径图片
      const origin = new URL(targetUrl).origin;
      contentEl.find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && src.startsWith('/')) $(img).attr('src', origin + src);
        else if (src) $(img).attr('src', src);
        $(img).removeAttr('data-src');
      });

      // 移除所有 a 标签的 onclick 和 href（防止跳出）
      contentEl.find('a').each((_, a) => {
        $(a).removeAttr('onclick').attr('target', '_blank').attr('rel', 'noreferrer');
      });

      return { html: contentEl.html() ?? '', success: true };
    } catch {
      return { html: '', success: false };
    }
  }

  private cleanAndSelectByTag(rawArticles: HotArticleItem[]): HotArticleItem[] {
    const deduped = new Map<string, HotArticleItem>();
    for (const raw of rawArticles) {
      const title = (raw.title || '').trim();
      if (!title) continue;
      if (!this.isLikelyTechnicalArticle(title)) continue;

      const tag = this.inferTagFromTitle(title);
      if (!HOT_TECH_TAGS.includes(tag as (typeof HOT_TECH_TAGS)[number])) continue;

      const dedupeKey = `${raw.source}::${(raw.url || title).trim()}`;
      const normalized: HotArticleItem = {
        ...raw,
        id: `${raw.source}::${tag}::${raw.id}`,
        title,
        author: (raw.author || '匿名作者').trim(),
        mobileUrl: raw.mobileUrl || raw.url,
        tag,
      };
      const current = deduped.get(dedupeKey);
      if (!current || (normalized.hot || 0) > (current.hot || 0)) {
        deduped.set(dedupeKey, normalized);
      }
    }

    const cleaned = Array.from(deduped.values());
    const selected: HotArticleItem[] = [];
    for (const techTag of HOT_TECH_TAGS) {
      selected.push(
        ...cleaned
          .filter((article) => article.tag === techTag)
          .sort((a, b) => (b.hot || 0) - (a.hot || 0))
          .slice(0, ARTICLES_PER_TAG),
      );
    }
    return selected;
  }

  private isLikelyTechnicalArticle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    const hitNonTech = NON_TECH_KEYWORDS.some((keyword) =>
      lowerTitle.includes(keyword.toLowerCase()),
    );
    if (hitNonTech) return false;

    const hitTech = TAG_RULES.some((rule) =>
      rule.keywords.some((keyword) => lowerTitle.includes(keyword.toLowerCase())),
    );
    return hitTech;
  }

  private inferTagFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    let bestTag: string = '综合';
    let bestScore = 0;
    for (const rule of TAG_RULES) {
      const score = rule.keywords.reduce((acc, keyword) => {
        return acc + (lowerTitle.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        bestTag = rule.tag;
      }
    }
    return bestTag;
  }

  private resolveRequestedTag(keyword: string): (typeof HOT_TECH_TAGS)[number] | null {
    const k = keyword.trim().toLowerCase();
    return TAG_ALIAS_TO_STACK[k] || null;
  }

  private isTagRelevantTitle(title: string, tag: string, keyword: string): boolean {
    const lowerTitle = (title || '').toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    if (lowerTitle.includes(lowerKeyword)) return true;
    const rule = TAG_RULES.find((item) => item.tag === tag);
    if (!rule) return false;
    return rule.keywords.some((item) => lowerTitle.includes(item.toLowerCase()));
  }

  private getStrictQueryKeywords(keyword: string): string[] {
    const k = keyword.trim().toLowerCase();
    return STRICT_QUERY_KEYWORDS[k] || [];
  }

  private titleContainsAny(title: string, keywords: string[]): boolean {
    const lowerTitle = ` ${(title || '').toLowerCase()} `;
    return keywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
  }
}
