import { victor_conf } from '../config';
import embeddingText from './embedding';
import { chat, getHashId, groupArray, textEmbedding, translate } from './util';

export interface Client {
  listCollections(): unknown;
  createCollection: Function;
}

export interface Collection {
  query(arg0: {
    queryEmbeddings: number[][];
    queryTexts?: string[];
    include?: string[] | undefined;
    nResults?: number;
    where?: any;
  }): unknown;
  delete(arg0: any): unknown;
  add(arg0: {
    ids: any[];
    embeddings: number[][];
    metadatas: any[];
    documents: string[];
  }): unknown;
}

class MockClient implements Client {
  path: string;
  constructor({ path }: { path: string }) {
    this.path = path;
  }
  listCollections(): unknown {
    throw new Error('Method not implemented.');
  }
  createCollection(arg0: {
    name: string;
    embeddingFunction: { generate: (queries: string[]) => Promise<number[][]> };
  }): Collection | PromiseLike<Collection> {
    throw new Error('Method not implemented.');
  }
}

class VictorDB {
  public client: Client;
  public collection?: Collection;
  public outputFileds?: string[];
  public collectionName: string;
  public resultCount: number = 5;
  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.client = new MockClient({ path: 'http://hulianhudong.cn' });
  }
  async createCollection(name: string = '') {
    this.collectionName = name || this.collectionName;
    this.collection = await this.client.createCollection({
      name: name || this.collectionName,
      embeddingFunction: this.getEmbedding(),
    });
  }
  getEmbedding() {
    return { generate: (queries: string[]) => this.embedding(queries) };
  }
  async listCollection() {
    return this.client.listCollections();
  }
  async embedding(queries: string[]) {
    if (victor_conf.EMBEDDING_VENDOR === 'wenxin') {
      const queryEmbeddings = await embeddingText({ texts: queries });
      return (queryEmbeddings || []).map((em) => em.embedding);
    }

    const queryEmbeddings = await textEmbedding({ texts: queries });
    return queryEmbeddings.map((em) => em.embedding);
  }
  async getCollection() {
    return this.collection;
  }
  async addDocs(docs: string[], metas: any = {}) {
    const embeddings = await this.embedding(docs);
    console.log(metas);
    const metadatas = Array.isArray(metas)
      ? metas
      : docs.map((val) => {
          const id = getHashId(val);
          return { key: `docs_${id}`, value: val, ...metas };
        });
    const collection = await this.getCollection();
    await collection?.add({
      ids: metadatas.map((c: any) => c.key),
      embeddings: embeddings,
      metadatas: metadatas,
      documents: docs,
    });
  }
  // 通过文档对象导入，方便loader保留元信息
  async addDocuments(docs: any[], addition = {}) {
    const groups = groupArray(docs, 20);
    const batch = groups.map(async (docs) => {
      const documents: string[] = [];
      const metas: any[] = [];
      docs.forEach((doc) => {
        const { pageContent, metadata } = doc;
        documents.push(pageContent);
        const key = getHashId(pageContent);
        metas.push({ key, ...metadata, ...addition });
      });
      await this.addDocs(documents, metas);
    });
    return Promise.all(batch);
  }
  formatResult(data: any) {
    // todo 不用类型数据库独立使用
    const { results, documents = results } = data;
    // todo 格式化云信息
    const content = documents
      .map((doc: any) => {
        return Array.isArray(doc) ? doc.join('\n') : doc.content;
      })
      .join('\n\n');
    return { content };
  }
  async summary(query: string, condition: any = {}) {
    const data = await this.queryByEmbeddings(query, condition);
    const { content } = this.formatResult(data);
    const messages = [
      {
        role: 'user',
        content:
          '你是知识萃取专家，善于结构化内容整理和思维表达，请根据以下内容进行总结和回答我的问题' +
          `\n内容:\n${content}`,
      },
      {
        role: 'assistant',
        content: '我会根据文档的内容回答你的问题，请问你的问题是什么',
      },
      {
        role: 'user',
        content: query,
      },
    ];
    const result = await chat({
      messages,
    });
    result.context = content;
    return result;
  }
  async translate(content: string) {
    return translate(content);
  }
  async remove(condition: any = {}) {
    const collection = await this.getCollection();
    await collection?.delete({ where: condition });
  }
  async queryByEmbeddings(query: string, condition: any = {}) {
    const collection = await this.getCollection();
    const rs = await this.embedding([query]);
    return collection?.query({
      queryEmbeddings: rs,
      include: this.outputFileds,
      nResults: this.resultCount,
      where: condition,
    });
  }
  async queryByText(query: string) {
    const collection = await this.getCollection();
    return collection?.query({
      queryTexts: [query],
      nResults: this.resultCount,
      queryEmbeddings: [],
    });
  }
  async query(query: any, condition: any = {}) {
    const options = {
      queryTexts: [''],
      nResults: this.resultCount,
      where: condition,
      ...query,
    };
    const collection = await this.getCollection();
    return collection?.query(options);
  }
}

export default VictorDB;
