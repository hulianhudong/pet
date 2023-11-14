import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { textEmbedding } from '../../modules/dochain/db/util';

import Zilliz from '../../modules/dochain/db/Zillis';

import { victor_conf } from '../../modules/dochain/config';
import { Context } from 'koa';

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

export const questionPet =  async (ctx: any) => {
  const { question = '猫' } = Object.assign({}, ctx.query, ctx.request.body);
  const { results } = await (0, exports.queryDB)(question);
  const knowledge = results.map((m:any) => {
      return m.metadata.content
  }).join('\n');
  const prompt = `你是一名专业的，有耐心的宠物医生，请参考以下关于宠物护理相关的知识，用专业的医生身份回答用户提出的问题。

参考知识:
  ${knowledge}

用户问题：${question}
  `;
  // API返回字段"prompt"有特殊含义：开发者可以通过调试它来调试输出效果
  ctx.body = { question: question, prompt }
}
