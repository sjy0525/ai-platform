import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository, Like } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Article } from '../../entities/article.entity';
import { TechColumn } from '../../entities/column.entity';
import { AnalyticsEvent } from '../../entities/analytics-event.entity';
import { ArticleService } from '../article/article.service';

interface AdminLoginDto {
  username: string;
  password: string;
}

interface SaveEventDto {
  event: string;
  distinctId?: string;
  source?: string;
  properties?: Record<string, unknown>;
}

interface SaveColumnDto {
  name: string;
  keyword: string;
  description?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(TechColumn)
    private readonly columnRepository: Repository<TechColumn>,
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly articleService: ArticleService,
  ) {}

  async login(dto: AdminLoginDto) {
    const adminUsername =
      this.configService.get<string>('ADMIN_USERNAME') || 'admin';
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') || 'admin123456';

    if (dto.username !== adminUsername || dto.password !== adminPassword) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    const token = this.jwtService.sign({
      sub: 'admin-console',
      username: adminUsername,
      role: 'admin',
    });

    await this.captureEvent({
      event: 'admin_login',
      distinctId: adminUsername,
      properties: { loginAt: new Date().toISOString() },
    });

    return {
      access_token: token,
      admin: {
        username: adminUsername,
        role: 'admin',
      },
    };
  }

  async getOverview() {
    const [users, articles, columns, events] = await Promise.all([
      this.userRepository.find({ order: { createdAt: 'DESC' } }),
      this.articleRepository.find({ order: { createdAt: 'DESC' } }),
      this.columnRepository.find({ order: { createdAt: 'DESC' } }),
      this.analyticsRepository.find({ order: { createdAt: 'DESC' }, take: 8 }),
    ]);

    const totalCollections = users.reduce(
      (sum, user) => sum + (user.collectedArticleIds?.length || 0),
      0,
    );
    const totalColumnSubscriptions = users.reduce(
      (sum, user) => sum + (user.subscribedColumnIds?.length || 0),
      0,
    );

    const tagDistribution = this.groupCount(articles, 'tag');
    const sourceDistribution = this.groupCount(articles, 'source');

    return {
      summary: {
        userCount: users.length,
        articleCount: articles.length,
        columnCount: columns.length,
        eventCount: await this.analyticsRepository.count(),
        totalCollections,
        totalColumnSubscriptions,
      },
      tagDistribution,
      sourceDistribution,
      recentUsers: users.slice(0, 6).map((user) => this.toUserListItem(user)),
      recentArticles: articles.slice(0, 8),
      recentEvents: events,
    };
  }

  async listUsers() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.toUserListItem(user));
  }

  async listArticles(query?: string, tag?: string, source?: string) {
    const where: Array<Record<string, unknown>> = [];
    const normalizedQuery = query?.trim();

    if (normalizedQuery) {
      where.push({ title: Like(`%${normalizedQuery}%`) });
      where.push({ author: Like(`%${normalizedQuery}%`) });
    }

    const articles = await this.articleRepository.find({
      where: where.length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
      take: 200,
    });

    return articles.filter((article) => {
      if (tag && article.tag !== tag) return false;
      if (source && article.source !== source) return false;
      return true;
    });
  }

  async listColumns() {
    return this.columnRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createColumn(dto: SaveColumnDto) {
    const entity = this.columnRepository.create({
      name: dto.name.trim(),
      keyword: dto.keyword.trim(),
      description: dto.description?.trim() || '',
    });
    const saved = await this.columnRepository.save(entity);
    await this.captureEvent({
      event: 'admin_create_column',
      properties: { columnId: saved.id, name: saved.name, keyword: saved.keyword },
    });
    return saved;
  }

  async updateColumn(id: string, dto: SaveColumnDto) {
    const column = await this.columnRepository.findOne({ where: { id } });
    if (!column) {
      throw new NotFoundException('专栏不存在');
    }
    column.name = dto.name.trim();
    column.keyword = dto.keyword.trim();
    column.description = dto.description?.trim() || '';
    const saved = await this.columnRepository.save(column);
    await this.captureEvent({
      event: 'admin_update_column',
      properties: { columnId: saved.id, name: saved.name, keyword: saved.keyword },
    });
    return saved;
  }

  async deleteColumn(id: string) {
    const column = await this.columnRepository.findOne({ where: { id } });
    if (!column) {
      throw new NotFoundException('专栏不存在');
    }
    await this.columnRepository.delete(id);
    await this.captureEvent({
      event: 'admin_delete_column',
      properties: { columnId: id, name: column.name },
    });
    return { success: true };
  }

  async syncHotArticles() {
    await this.articleService.syncHotToVector();
    await this.captureEvent({
      event: 'admin_sync_hot_articles',
      properties: { syncedAt: new Date().toISOString() },
    });
    return { success: true, message: '热榜同步成功' };
  }

  async captureEvent(dto: SaveEventDto) {
    if (!dto.event?.trim()) {
      return null;
    }

    const event = this.analyticsRepository.create({
      event: dto.event.trim(),
      distinctId: dto.distinctId?.trim() || 'anonymous',
      source: dto.source?.trim() || 'admin',
      properties: dto.properties || null,
    });

    return this.analyticsRepository.save(event);
  }

  async listEvents(limit = 50) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 200);
    return this.analyticsRepository.find({
      order: { createdAt: 'DESC' },
      take: normalizedLimit,
    });
  }

  private groupCount<T>(items: T[], field: keyof T) {
    const counts = new Map<string, number>();
    for (const item of items) {
      const rawValue = item[field];
      const key =
        typeof rawValue === 'string' && rawValue.trim() ? rawValue : '未分类';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  private toUserListItem(user: User) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      subscribedKeywords: user.subscribedKeywords || [],
      collectedArticleCount: user.collectedArticleIds?.length || 0,
      subscribedColumnCount: user.subscribedColumnIds?.length || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
