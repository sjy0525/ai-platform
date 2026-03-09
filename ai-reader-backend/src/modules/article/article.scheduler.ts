import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ArticleService } from './article.service';

@Injectable()
export class ArticleScheduler {
  constructor(private articleService: ArticleService) {}

  /** 每日凌晨 6 点同步热榜到 Milvus */
  @Cron('0 6 * * *', { name: 'syncHotArticles' })
  async handleSyncHot() {
    await this.articleService.syncHotToVector();
  }
}
