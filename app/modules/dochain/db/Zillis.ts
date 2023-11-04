import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import VictorDB, { Collection as ICollection, Client } from './VictorDB';

import { victor_conf } from '../config';

const {
  ZILLIZ_ENDPOINT = '',
  ZILLIZ_USER = '',
  ZILLIZ_PASS = '',
  EMBEDDING_VENDOR,
  COLLECTION,
} = victor_conf;
let address = ZILLIZ_ENDPOINT;
let token = `${ZILLIZ_USER}:${ZILLIZ_PASS}`;

if (token.length < 10) {
  console.log('zilliz token is empty');
}

export const config = (option: any) => {
  address = option.address || address;
  token = option.token || token;
};

export class Collection implements ICollection {
  name: any;
  embeddingFunction: any;
  client: MilvusClient;
  collectionName: any;
  constructor({ name, embeddingFunction }: any, client: MilvusClient) {
    this.name = name;
    this.client = client;
    this.embeddingFunction = embeddingFunction;
  }
  async delete(options: { ids: string[]; partition_name?: string }) {
    this.client.delete({
      collection_name: this.name,
      ...options,
    });
  }
  async add({ ids, embeddings, metadatas, documents }: any) {
    const data = ids.map((id: string, i: number) => {
      return {
        id: id,
        metadata: metadatas[i],
        content: documents[i],
        vector: embeddings[i],
      };
    });

    return await this.client.insert({
      collection_name: this.name,
      data: data,
    });
  }
  async query({ queryEmbeddings, nResults, where, include }: any) {
    const searchParams = {
      collection_name: this.name,
      vectors: queryEmbeddings,
      params: where,
      output_fields: include,
      limit: nResults,
      top_k: nResults, // replace with the desired number of results
    };
    const rst = await this.client.search(searchParams);
    return rst;
  }
}

const default_dimension = EMBEDDING_VENDOR === 'wenxin' ? 1024 : 1536;

class Zillis extends VictorDB {
  public client: MilvusClient;
  constructor(name: string) {
    super(name);
    this.client = new MilvusClient({ address, token });
    this.collectionName = name;
    // 按业务需要选择要返回字段，如果字段不存在会报错
    // this.outputFileds = ["content", "metadata"];
  }
  async createCollection(name: string = '', dimension = default_dimension) {
    const collection_name = name || this.collectionName;
    const collectionParams = {
      collection_name,
      dimension,
    };
    this.collectionName = collection_name;
    await this.client.createCollection(collectionParams);
  }
  async drop(collection_name: string) {
    return this.client.dropCollection({ collection_name });
  }
  async remove(condition: any = {}) {
    const collection = await this.getCollection();
    await collection.delete({ ids: condition.ids });
  }
  async getCollection() {
    const name = this.collectionName;
    const embeddingFunction = this.getEmbedding();
    const collection = new Collection({ name, embeddingFunction }, this.client);
    return collection;
  }
  listCollections() {
    return this.client.listCollections();
  }
}

export default Zillis;
