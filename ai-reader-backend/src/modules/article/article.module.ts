import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../../entities/article.entity';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { ArticleScheduler } from './article.scheduler';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article]),
    VectorModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleScheduler],
  exports: [ArticleService],
})
export class ArticleModule {}
