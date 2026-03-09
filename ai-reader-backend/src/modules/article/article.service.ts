import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Article } from '../../entities/article.entity';
import { VectorService } from '../vector/vector.service';

const HOT_API_BASE = 'https://api.pearktrue.cn/api/dailyhot/';
const HOT_PLATFORMS = ['稀土掘金', '知乎', 'CSDN'] as const;
const ARTICLES_PER_TAG = 10;

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
      tag: tag || '综合',
    }));
  }

  /** 定时任务：获取热榜并存入 Milvus */
  async syncHotToVector(): Promise<void> {
    const allArticles: HotArticleItem[] = [];
    for (const platform of HOT_PLATFORMS) {
      try {
        const items = await this.fetchHotFromThirdParty(platform);
        allArticles.push(...items);
      } catch (e) {
        console.warn(`获取 ${platform} 热榜失败:`, (e as Error).message);
      }
    }
    if (allArticles.length === 0) return;

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
    // 1. 先查向量数据库
    const ids = await this.vectorService.searchByKeyword(keyword, topK);
    if (ids.length > 0) {
      const articles = await this.articleRepository.find({
        where: { id: In(ids) },
      });
      if (articles.length >= topK) {
        return this.orderByIds(articles, ids).slice(0, topK);
      }
    }

    // 2. 向量库没有或不足，从第三方 API 获取
    const fromApi = await this.fetchHotFromThirdParty('稀土掘金');
    const filtered = fromApi.filter(
      (a) => a.title.includes(keyword) || (a.author && a.author.includes(keyword)),
    );
    if (filtered.length === 0) {
      return fromApi.slice(0, topK).map((a) => this.toArticleEntity(a));
    }
    const toSave = filtered.slice(0, topK);
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
}
