import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
})
export class AiModule {}
