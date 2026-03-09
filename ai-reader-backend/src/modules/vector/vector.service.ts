import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { EmbeddingService } from '../embedding/embedding.service';

const COLLECTION_NAME = 'ai_reader_articles';
const VECTOR_DIM = 1536;

@Injectable()
export class VectorService implements OnModuleInit {
  private client: MilvusClient | null = null;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
  ) {}

  async onModuleInit() {
    const address = this.configService.get<string>('MILVUS_ADDRESS') || 'localhost:19530';
    try {
      this.client = new MilvusClient({ address });
      await this.client.connectPromise;
      await this.ensureCollection();
    } catch (e) {
      console.warn('Milvus 连接失败，向量搜索将不可用:', (e as Error).message);
      this.client = null;
    }
  }

  private async ensureCollection() {
    if (!this.client) return;
    try {
      const collections = await this.client.showCollections();
      const data = collections.data as unknown;
      const names = Array.isArray(data) ? data.map((c: { name?: string }) => c?.name ?? c).filter(Boolean) : [];
      const exists = names.includes(COLLECTION_NAME);
      if (!exists) {
        await this.client.createCollection({
          collection_name: COLLECTION_NAME,
          fields: [
            { name: 'id', data_type: DataType.VarChar, is_primary_key: true, max_length: 64 },
            { name: 'title', data_type: DataType.VarChar, max_length: 512 },
            { name: 'content', data_type: DataType.VarChar, max_length: 4096 },
            { name: 'embedding', data_type: DataType.FloatVector, dim: VECTOR_DIM },
          ],
        });
        await this.client.createIndex({
          collection_name: COLLECTION_NAME,
          field_name: 'embedding',
          index_type: 'IVF_FLAT',
          metric_type: 'IP',
          params: { nlist: 128 },
        });
      }
    } catch (e) {
      console.warn('Milvus 创建 collection 失败:', (e as Error).message);
    }
  }

  async insertArticles(
    articles: Array<{ id: string; title: string; content: string }>,
  ): Promise<void> {
    if (!this.client || articles.length === 0) return;
    if (!this.embeddingService.isAvailable()) return;
    try {
      const texts = articles.map((a) => `${a.title} ${a.content}`.slice(0, 2000));
      const vectors = await this.embeddingService.embedDocuments(texts);
      if (vectors.length === 0) return;
      const data = articles.map((a, i) => ({
        id: a.id,
        title: a.title.slice(0, 512),
        content: a.content.slice(0, 4096),
        embedding: vectors[i],
      }));
      await this.client.insert({
        collection_name: COLLECTION_NAME,
        data,
      });
      await this.client.flush({ collection_names: [COLLECTION_NAME] });
    } catch (e) {
      console.warn('Milvus 插入失败:', (e as Error).message);
    }
  }

  async searchByKeyword(keyword: string, topK = 3): Promise<string[]> {
    if (!this.client || !this.embeddingService.isAvailable()) return [];
    try {
      await this.client.loadCollectionSync({ collection_name: COLLECTION_NAME });
      const vector = await this.embeddingService.embedQuery(keyword);
      if (vector.length === 0) return [];
      const result = await this.client.search({
        collection_name: COLLECTION_NAME,
        data: [vector],
        limit: topK,
        output_fields: ['id'],
      });
      const ids: string[] = [];
      const results = result.results || [];
      if (results.length > 0 && results[0].ids) {
        const idList = results[0].ids as (string | number)[];
        ids.push(...idList.map((id) => String(id)));
      }
      return ids.slice(0, topK);
    } catch (e) {
      console.warn('Milvus 搜索失败:', (e as Error).message);
      return [];
    }
  }
}
