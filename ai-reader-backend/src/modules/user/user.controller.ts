import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ArticleService } from '../article/article.service';
import { ColumnService } from '../column/column.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private articleService: ArticleService,
    private columnService: ColumnService,
    private analyticsService: AnalyticsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: { id: string }) {
    const fullUser = await this.userService.findById(user.id);
    if (!fullUser) return null;
    const { password: _, ...result } = fullUser;
    const collectedArticleIds = result.collectedArticleIds || [];
    const collectedArticles = collectedArticleIds.length > 0
      ? await this.articleService.findByIds(collectedArticleIds)
      : [];
    const subscribedColumnIds = result.subscribedColumnIds || [];
    const subscribedColumns = await this.columnService.findByIds(subscribedColumnIds);
    return {
      id: result.id,
      username: result.username,
      nickname: result.nickname,
      avatar: result.avatar,
      subscribedKeywords: result.subscribedKeywords || [],
      collectedArticleIds,
      collectedArticles,
      subscribedColumnIds,
      subscribedColumns,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('keywords')
  async updateKeywords(
    @CurrentUser() user: { id: string },
    @Body('keywords') keywords: string[],
  ) {
    await this.userService.updateKeywords(user.id, keywords || []);
    await this.analyticsService.captureEventSafely({
      event: 'user_update_keywords',
      distinctId: user.id,
      source: 'web_app',
      properties: { keywordsCount: keywords?.length || 0 },
    });
    const u = await this.userService.findById(user.id);
    return { subscribedKeywords: u?.subscribedKeywords || [] };
  }

  @UseGuards(JwtAuthGuard)
  @Post('collect/:articleId')
  async addCollect(
    @CurrentUser() user: { id: string },
    @Param('articleId') articleId: string,
  ) {
    await this.userService.addCollectedArticle(user.id, articleId);
    await this.analyticsService.captureEventSafely({
      event: 'user_collect_article',
      distinctId: user.id,
      source: 'web_app',
      properties: { articleId },
    });
    const u = await this.userService.findById(user.id);
    return { collectedArticleIds: u?.collectedArticleIds || [] };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('collect/:articleId')
  async removeCollect(
    @CurrentUser() user: { id: string },
    @Param('articleId') articleId: string,
  ) {
    await this.userService.removeCollectedArticle(user.id, articleId);
    await this.analyticsService.captureEventSafely({
      event: 'user_uncollect_article',
      distinctId: user.id,
      source: 'web_app',
      properties: { articleId },
    });
    const u = await this.userService.findById(user.id);
    return { collectedArticleIds: u?.collectedArticleIds || [] };
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe-column/:columnId')
  async subscribeColumn(
    @CurrentUser() user: { id: string },
    @Param('columnId') columnId: string,
  ) {
    await this.userService.addSubscribedColumn(user.id, columnId);
    await this.analyticsService.captureEventSafely({
      event: 'user_subscribe_column',
      distinctId: user.id,
      source: 'web_app',
      properties: { columnId },
    });
    const u = await this.userService.findById(user.id);
    return { subscribedColumnIds: u?.subscribedColumnIds || [] };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscribe-column/:columnId')
  async unsubscribeColumn(
    @CurrentUser() user: { id: string },
    @Param('columnId') columnId: string,
  ) {
    await this.userService.removeSubscribedColumn(user.id, columnId);
    await this.analyticsService.captureEventSafely({
      event: 'user_unsubscribe_column',
      distinctId: user.id,
      source: 'web_app',
      properties: { columnId },
    });
    const u = await this.userService.findById(user.id);
    return { subscribedColumnIds: u?.subscribedColumnIds || [] };
  }
}
