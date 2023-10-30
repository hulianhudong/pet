"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const kv_1 = require("@vercel/kv");
const crypto_1 = __importDefault(require("crypto"));
const ernie_1 = __importDefault(require("../../lib/ernie"));
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
function getHashId(data) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}
const config = {};
const petai = new ernie_1.default(config);
async function Chat(json) {
    const { messages, userId = '1211' } = json;
    const question = messages[messages.length - 1].content.substring(0, 100);
    const title = messages[0].content.substring(0, 100);
    const hashId = getHashId(question);
    let completion = '';
    if (question) {
        completion = await kv_1.kv.get(hashId);
    }
    if (!completion) {
        const result = await petai.createChatCompletion({
            user_id: userId,
            messages,
        });
        completion = getResultFromStream(result);
        await kv_1.kv.set(hashId, completion);
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
        kv_1.kv.zadd(`user:chat:${userId}`, {
            score: createdAt,
            member: `chat:${id}`,
        });
        await kv_1.kv.hset(`chat:${id}`, payload);
    }
    // 在vercel环境容易超时就不存储了
    await onCompletion();
    return completion;
}
exports.Chat = Chat;
function getResultFromStream(streamData) {
    const lines = streamData.trim().split('\n');
    const results = [];
    lines.forEach((line) => {
        if (line.length < 1) {
            return;
        }
        const data = JSON.parse(line.replace('data:', ''));
        const result = data.result?.trim();
        if (result.length > 0) {
            results.push(result);
        }
    });
    return results.join(' ');
}
