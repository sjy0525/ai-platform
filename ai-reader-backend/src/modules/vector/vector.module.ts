import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}
