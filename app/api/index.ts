import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { textEmbedding } from '../modules/dochain/db/util';

import Zilliz from '../modules/dochain/db/Zillis';

export const queryDB = async (base: string = 'pet', querys: string[]) => {
  const db = new Zilliz(base);
  db.outputFileds = ['content', 'metadata'];
  const result = await db.queryByEmbeddings(querys[0]);
  return result;
};

export const queryRelated = async (texts: string[]) => {
  const {
    ZILLIZ_ENDPOINT = '',
    ZILLIZ_USER = '',
    ZILLIZ_PASS = '',
  } = process.env;

  const ssl = false;

  console.log(ZILLIZ_ENDPOINT, ZILLIZ_PASS);

  const client = new MilvusClient({
    address: ZILLIZ_ENDPOINT,
    ssl,
    username: ZILLIZ_USER,
    password: ZILLIZ_PASS,
  });

  const embeddings = await textEmbedding({ texts });
  const result = await client.search({
    collection_name: 'pet',
    vector: embeddings.map((m: any) => m.embedding),
    output_fields: ['content', 'metadata'],
    limit: 3,
  });
  console.log(result);
  if (result.status.code === 0) {
    return result.results;
  }
  return [];
};

// API 请求处理方法
export const APIHandler = async (ctx: any) => {
  const { content = '' } = JSON.parse(ctx.body);
  const result = await queryDB(content);
  ctx.body = JSON.stringify({ result });
};
