import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
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
  private readonly logger = new Logger(AdminService.name);

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

    await this.captureEventSafely({
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

  async getUserAnalytics() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    const rangeStart = this.getDayStartOffset(6);
    const recentEvents = await this.analyticsRepository.find({
      where: { createdAt: MoreThanOrEqual(rangeStart) },
      order: { createdAt: 'DESC' },
      take: 5000,
    });

    const webEvents = recentEvents.filter((event) =>
      ['web', 'web_app', 'web_client'].includes(event.source),
    );
    const pageViews = webEvents.filter((event) => event.event === 'page_view');
    const pageLeaves = webEvents.filter((event) => event.event === 'page_leave');
    const recentUsers = users.filter((user) => user.createdAt >= rangeStart);
    const uniqueVisitors = new Set(pageViews.map((event) => event.distinctId)).size;
    const avgStaySeconds = this.averageDurationSeconds(pageLeaves);

    return {
      summary: {
        totalUsers: users.length,
        newUsers7d: recentUsers.length,
        oldUsers: Math.max(users.length - recentUsers.length, 0),
        pageViews7d: pageViews.length,
        uniqueVisitors7d: uniqueVisitors,
        avgStaySeconds7d: avgStaySeconds,
        avgPvPerUv7d: uniqueVisitors ? Number((pageViews.length / uniqueVisitors).toFixed(1)) : 0,
      },
      trafficTrend: this.buildDailyTrafficTrend(pageViews, pageLeaves),
      growthTrend: this.buildDailyGrowthTrend(users),
      topPages: this.buildTopPages(pageViews),
      conversionFunnel: this.buildConversionFunnel(webEvents),
      userSnapshots: users.slice(0, 10).map((user) => ({
        id: user.id,
        displayName: this.maskText(user.nickname || user.username),
        handle: this.maskText(user.username),
        keywordCount: user.subscribedKeywords?.length || 0,
        collectedArticleCount: user.collectedArticleIds?.length || 0,
        subscribedColumnCount: user.subscribedColumnIds?.length || 0,
        segment: user.createdAt >= rangeStart ? '新用户' : '老用户',
        createdAt: user.createdAt,
      })),
    };
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
    await this.captureEventSafely({
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
    await this.captureEventSafely({
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
    await this.captureEventSafely({
      event: 'admin_delete_column',
      properties: { columnId: id, name: column.name },
    });
    return { success: true };
  }

  async syncHotArticles() {
    await this.articleService.syncHotToVector();
    await this.captureEventSafely({
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

  private async captureEventSafely(dto: SaveEventDto) {
    try {
      await this.captureEvent(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping admin analytics event "${dto.event}": ${message}`);
    }
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
      username: this.maskText(user.username),
      nickname: this.maskText(user.nickname || user.username),
      avatar: '',
      subscribedKeywords: user.subscribedKeywords || [],
      collectedArticleCount: user.collectedArticleIds?.length || 0,
      subscribedColumnCount: user.subscribedColumnIds?.length || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private buildDailyTrafficTrend(
    pageViews: AnalyticsEvent[],
    pageLeaves: AnalyticsEvent[],
  ) {
    return this.buildRecentDays().map((day) => {
      const views = pageViews.filter((event) => this.isSameDay(event.createdAt, day.date));
      const leaves = pageLeaves.filter((event) => this.isSameDay(event.createdAt, day.date));
      const uv = new Set(views.map((event) => event.distinctId)).size;
      const avgStaySeconds = this.averageDurationSeconds(leaves);
      return {
        date: day.label,
        pv: views.length,
        uv,
        avgStaySeconds,
      };
    });
  }

  private buildDailyGrowthTrend(users: User[]) {
    return this.buildRecentDays().map((day) => {
      const newUsers = users.filter((user) => this.isSameDay(user.createdAt, day.date));
      return {
        date: day.label,
        newUsers: newUsers.length,
      };
    });
  }

  private buildTopPages(pageViews: AnalyticsEvent[]) {
    const counts = new Map<string, number>();
    for (const event of pageViews) {
      const path = this.readStringProperty(event.properties, 'path') || '未知页面';
      counts.set(path, (counts.get(path) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  private buildConversionFunnel(events: AnalyticsEvent[]) {
    const groups = [
      { name: '访问', event: 'page_view' },
      { name: '注册', event: 'user_register' },
      { name: '登录', event: 'user_login' },
      { name: '收藏', event: 'user_collect_article' },
      { name: '订阅专栏', event: 'user_subscribe_column' },
    ];

    const stepUsers = groups.map((group) => {
      const userIds = new Set(
        events
          .filter((event) => event.event === group.event)
          .map((event) => event.distinctId),
      );

      return {
        name: group.name,
        users: userIds.size,
      };
    });

    const firstStepUsers = stepUsers[0]?.users || 0;

    return stepUsers.map((step, index) => {
      const previousUsers = index === 0 ? step.users : stepUsers[index - 1]?.users || 0;

      return {
        name: step.name,
        value: step.users,
        rateFromPrevious:
          index === 0
            ? 100
            : this.calculatePercent(step.users, previousUsers),
        rateFromEntry: this.calculatePercent(step.users, firstStepUsers),
      };
    });
  }

  private averageDurationSeconds(events: AnalyticsEvent[]) {
    const durations = events
      .map((event) => this.readNumberProperty(event.properties, 'durationMs'))
      .filter((value): value is number => typeof value === 'number' && value >= 0);

    if (durations.length === 0) {
      return 0;
    }

    const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return Math.round(average / 1000);
  }

  private buildRecentDays() {
    return Array.from({ length: 7 }, (_, index) => {
      const date = this.getDayStartOffset(6 - index);
      return {
        date,
        label: `${date.getMonth() + 1}-${date.getDate()}`,
      };
    });
  }

  private getDayStartOffset(offset: number) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    return date;
  }

  private isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  private readNumberProperty(properties: Record<string, unknown> | null, key: string) {
    const value = properties?.[key];
    return typeof value === 'number' ? value : null;
  }

  private readStringProperty(properties: Record<string, unknown> | null, key: string) {
    const value = properties?.[key];
    return typeof value === 'string' && value.trim() ? value : '';
  }

  private maskText(value?: string) {
    const normalized = value?.trim();
    if (!normalized) {
      return '匿名用户';
    }
    if (normalized.length <= 2) {
      return `${normalized.charAt(0)}*`;
    }
    return `${normalized.slice(0, 1)}${'*'.repeat(Math.max(normalized.length - 2, 1))}${normalized.slice(-1)}`;
  }

  private calculatePercent(value: number, base: number) {
    if (!base) {
      return 0;
    }

    return Number(((value / base) * 100).toFixed(1));
  }
}
