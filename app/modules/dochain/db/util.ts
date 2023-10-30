import crypto from 'crypto';

import axios from 'axios';
let API_KEY = process.env.DASHSCOPE_API_KEY;

export const config = (apiKey = API_KEY) => {
  API_KEY = apiKey;
};

export function getHashId(data: string) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

export const payload = async (
  url: string,
  data: {
    model: any;
    input: { texts: any } | { messages: any } | { messages: any; history: any };
    parameters: { text_type: string } | {} | {};
  },
  apiKey = API_KEY
) => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  return axios
    .post(url, JSON.stringify(data), {
      headers: headers,
    })
    .then((r) => r.data);
};

export interface embeddingResult {
  output: {
    embeddings: { embedding: any }[];
  };
}

export async function textEmbedding(data: any) {
  const { model, texts } = data;
  const url =
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';
  const requestData = {
    model: model || 'text-embedding-v1',
    input: {
      texts,
    },
    parameters: {
      text_type: 'query',
    },
  };

  const result: embeddingResult = (await payload(url, requestData)) as any;
  const {
    output: { embeddings: queryEmbeddings },
  } = result;
  return queryEmbeddings;
}

export const GENERATION_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export const chat = async (data: any) => {
  const { messages, history = [] } = data;
  const requestData = {
    model: 'qwen-plus',
    input: {
      messages,
      history,
    },
    parameters: {},
  };
  return payload(GENERATION_URL, requestData);
};

export const translate = async (content: string) => {
  const messages = [
    {
      role: 'user',
      content: '翻译：' + `\n${content}`,
    },
  ];
  const result = await chat({
    messages,
  });
  return result.output.text;
};

export function groupArray<T>(arr: T[], groupSize: number): T[][] {
  const groups: T[][] = [];
  let currentGroup: T[] = [];

  for (let i = 0; i < arr.length; i++) {
    currentGroup.push(arr[i]);

    if (currentGroup.length === groupSize) {
      groups.push(currentGroup);
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}
