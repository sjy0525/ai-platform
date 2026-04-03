import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { TechColumn } from '../../entities/column.entity';
import { ArticleService } from '../article/article.service';
import { Article } from '../../entities/article.entity';

const SEED_COLUMNS = [
  { name: '前端进阶', keyword: '前端', description: '聚合最新前端技术文章，涵盖 React、Vue、CSS 等' },
  { name: 'JavaScript 深度', keyword: 'javascript', description: 'JavaScript / TypeScript 深度技术内容' },
  { name: 'React 生态', keyword: 'react', description: 'React 框架、生态工具与最佳实践' },
  { name: 'Vue 生态', keyword: 'vue', description: 'Vue 框架、组合式 API 与周边生态' },
  { name: '后端架构', keyword: '后端', description: '后端开发、服务架构与数据库设计' },
  { name: 'Java 技术', keyword: 'java', description: 'Java 开发、Spring 生态与企业级实践' },
  { name: 'Go 语言', keyword: 'golang', description: 'Go 语言开发与高性能服务实践' },
  { name: 'AI 编程前沿', keyword: 'AI编程', description: '大模型、Agent、Prompt 工程与 AI 工具' },
  { name: 'Android 开发', keyword: 'Android', description: 'Android 开发、Jetpack 与 Kotlin 实践' },
  { name: '系统架构设计', keyword: '架构', description: '微服务、高并发、分布式系统设计' },
  { name: '面试精华', keyword: '面试', description: '技术面试题解析、八股文与求职经验' },
];

@Injectable()
export class ColumnService implements OnModuleInit {
  constructor(
    @InjectRepository(TechColumn)
    private columnRepository: Repository<TechColumn>,
    private articleService: ArticleService,
  ) {}

  async onModuleInit() {
    await this.seedColumns();
  }

  private async seedColumns() {
    const count = await this.columnRepository.count();
    if (count > 0) return;
    for (const col of SEED_COLUMNS) {
      await this.columnRepository.save(this.columnRepository.create(col));
    }
  }

  async search(keyword: string): Promise<TechColumn[]> {
    return this.columnRepository.find({
      where: [
        { name: Like(`%${keyword}%`) },
        { keyword: Like(`%${keyword}%`) },
        { description: Like(`%${keyword}%`) },
      ],
    });
  }

  async findById(id: string): Promise<TechColumn | null> {
    return this.columnRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<TechColumn[]> {
    if (ids.length === 0) return [];
    const all = await this.columnRepository.find();
    return all.filter((c) => ids.includes(c.id));
  }

  async getArticles(columnId: string): Promise<Article[]> {
    const column = await this.findById(columnId);
    if (!column) return [];
    return this.articleService.getArticlesByKeyword(column.keyword, 10);
  }
}
