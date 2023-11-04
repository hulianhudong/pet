import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { textEmbedding } from '../../modules/dochain/db/util';

import Zilliz from '../../modules/dochain/db/Zillis';

import { victor_conf } from '../../modules/dochain/config';

const { COLLECTION } = victor_conf;
const db = new Zilliz(COLLECTION);
export const queryDB = async (content: string) => {
  db.outputFileds = ['content', 'metadata'];
  const result = await db.queryByEmbeddings(content);
  return result;
};

export const queryRelated = async (
  texts: string[],
  base: string = COLLECTION
) => {
  const {
    ZILLIZ_ENDPOINT = '',
    ZILLIZ_USER = '',
    ZILLIZ_PASS = '',
  } = process.env;

  const ssl = false;
  const client = new MilvusClient({
    address: ZILLIZ_ENDPOINT,
    ssl,
    username: ZILLIZ_USER,
    password: ZILLIZ_PASS,
  });

  const embeddings = await textEmbedding({ texts });
  const result = await client.search({
    collection_name: base,
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
