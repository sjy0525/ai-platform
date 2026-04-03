import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechColumn } from '../../entities/column.entity';
import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechColumn]),
    ArticleModule,
  ],
  controllers: [ColumnController],
  providers: [ColumnService],
  exports: [ColumnService],
})
export class ColumnModule {}
