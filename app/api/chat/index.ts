import { kv } from '@vercel/kv';
import crypto from 'crypto';
import ChatService from '../../lib/ernie';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getHashId(data: string) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

const config = {};
const petai = new ChatService(config);

export async function Chat(json: { id?: any; messages?: any; userId?: any }) {
  const { messages, userId = '1211' } = json;
  const question = messages[messages.length - 1].content.substring(0, 100);
  const title = messages[0].content.substring(0, 100);
  const hashId = getHashId(question);
  let completion: any = '';

  if (question) {
    completion = await kv.get(hashId);
  }

  if (!completion) {
    const result = await petai.createChatCompletion({
      user_id: userId,
      messages,
    });
    completion = getResultFromStream(result);
    await kv.set(hashId, completion);
  }
  async function onCompletion() {
    const id = json.id ?? uuid();
    const createdAt = Date.now();
    const path = `/chat/${id}`;
    const payload = {
      id,
      title,
      userId,
      createdAt,
      path,
      messages: [
        ...messages,
        {
          content: completion,
          role: 'assistant',
        },
      ],
    };

    kv.zadd(`user:chat:${userId}`, {
      score: createdAt,
      member: `chat:${id}`,
    });
    await kv.hset(`chat:${id}`, payload);
  }
  // 在vercel环境容易超时就不存储了
  await onCompletion();
  return completion;
}

interface StreamData {
  result: string;
}

function getResultFromStream(streamData: string): string {
  const lines = streamData.trim().split('\n');
  const results: string[] = [];

  lines.forEach((line) => {
    if (line.length < 1) {
      return;
    }
    const data: StreamData = JSON.parse(line.replace('data:', ''));
    const result = data.result?.trim();
    if (result.length > 0) {
      results.push(result);
    }
  });
  return results.join(' ');
}
