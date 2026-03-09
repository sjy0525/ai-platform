import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ArticleService } from '../article/article.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private articleService: ArticleService,
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
    return {
      id: result.id,
      username: result.username,
      nickname: result.nickname,
      avatar: result.avatar,
      subscribedKeywords: result.subscribedKeywords || [],
      collectedArticleIds,
      collectedArticles,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('keywords')
  async updateKeywords(
    @CurrentUser() user: { id: string },
    @Body('keywords') keywords: string[],
  ) {
    await this.userService.updateKeywords(user.id, keywords || []);
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
    const u = await this.userService.findById(user.id);
    return { collectedArticleIds: u?.collectedArticleIds || [] };
  }
}
