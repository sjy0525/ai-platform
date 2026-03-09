import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService {
  private embeddings: OpenAIEmbeddings | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey.startsWith('sk-')) {
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: apiKey,
        modelName: 'text-embedding-3-small',
      });
    }
  }

  isAvailable(): boolean {
    return this.embeddings !== null;
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!this.embeddings) return [];
    return this.embeddings.embedQuery(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.embeddings) return [];
    return this.embeddings.embedDocuments(texts);
  }

  getDimension(): number {
    return 1536;
  }
}
