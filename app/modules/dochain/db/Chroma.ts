import { ChromaClient } from 'chromadb';
import VictorDB, { Client, Collection } from './VictorDB';

class Chroma extends VictorDB {
  public client: Client;
  constructor(name: string) {
    super(name);
    this.client = new ChromaClient({
      path: 'http://hulianhudong.cn',
    }) as Client;
  }
  async getCollection() {
    if (this.collection) {
      return this.collection;
    }
    const client = this.client as ChromaClient;
    this.collection = (await client.getCollection({
      name: this.collectionName,
      embeddingFunction: this.getEmbedding(),
    })) as Collection;
    if (!this.collection) {
      await this.createCollection(this.collectionName);
    }
    return this.collection;
  }
  formatResult(data: any) {
    const { documents } = data;
    // todo 格式化云信息
    const content = documents
      .map((doc: any) => {
        return Array.isArray(doc) ? doc.join('\n') : doc.content;
      })
      .join('\n\n');
    return { content };
  }
}

export default Chroma;
