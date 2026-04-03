import { Controller, Get, Param, Query } from '@nestjs/common';
import { ColumnService } from './column.service';

@Controller('columns')
export class ColumnController {
  constructor(private columnService: ColumnService) {}

  /** 根据关键词搜索匹配的专栏 */
  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || !q.trim()) return [];
    return this.columnService.search(q.trim());
  }

  /** 获取专栏下的最新文章（实时拉取） */
  @Get(':id/articles')
  async getArticles(@Param('id') id: string) {
    return this.columnService.getArticles(id);
  }
}
