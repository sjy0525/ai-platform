import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.adminService.login(body);
  }

  @UseGuards(AdminGuard)
  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @UseGuards(AdminGuard)
  @Get('users')
  getUsers() {
    return this.adminService.listUsers();
  }

  @UseGuards(AdminGuard)
  @Get('user-analytics')
  getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @UseGuards(AdminGuard)
  @Get('articles')
  getArticles(
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('source') source?: string,
  ) {
    return this.adminService.listArticles(q, tag, source);
  }

  @UseGuards(AdminGuard)
  @Post('articles/hot-sync')
  syncHotArticles() {
    return this.adminService.syncHotArticles();
  }

  @UseGuards(AdminGuard)
  @Get('columns')
  getColumns() {
    return this.adminService.listColumns();
  }

  @UseGuards(AdminGuard)
  @Post('columns')
  createColumn(
    @Body() body: { name: string; keyword: string; description?: string },
  ) {
    return this.adminService.createColumn(body);
  }

  @UseGuards(AdminGuard)
  @Put('columns/:id')
  updateColumn(
    @Param('id') id: string,
    @Body() body: { name: string; keyword: string; description?: string },
  ) {
    return this.adminService.updateColumn(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('columns/:id')
  deleteColumn(@Param('id') id: string) {
    return this.adminService.deleteColumn(id);
  }

  @UseGuards(AdminGuard)
  @Post('analytics/capture')
  captureEvent(
    @Body()
    body: {
      event: string;
      distinctId?: string;
      source?: string;
      properties?: Record<string, unknown>;
    },
  ) {
    return this.adminService.captureEvent(body);
  }

  @UseGuards(AdminGuard)
  @Get('analytics/events')
  getEvents(@Query('limit') limit?: string) {
    return this.adminService.listEvents(Number(limit || 50));
  }
}
