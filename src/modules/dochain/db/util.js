"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupArray = exports.translate = exports.chat = exports.GENERATION_URL = exports.textEmbedding = exports.payload = exports.getHashId = exports.config = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
let API_KEY = process.env.DASHSCOPE_API_KEY;
const config = (apiKey = API_KEY) => {
    API_KEY = apiKey;
};
exports.config = config;
function getHashId(data) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}
exports.getHashId = getHashId;
const payload = async (url, data, apiKey = API_KEY) => {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };
    return axios_1.default
        .post(url, JSON.stringify(data), {
        headers: headers,
    })
        .then((r) => r.data);
};
exports.payload = payload;
async function textEmbedding(data) {
    const { model, texts } = data;
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';
    const requestData = {
        model: model || 'text-embedding-v1',
        input: {
            texts,
        },
        parameters: {
            text_type: 'query',
        },
    };
    const result = (await (0, exports.payload)(url, requestData));
    const { output: { embeddings: queryEmbeddings }, } = result;
    return queryEmbeddings;
}
exports.textEmbedding = textEmbedding;
exports.GENERATION_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const chat = async (data) => {
    const { messages, history = [] } = data;
    const requestData = {
        model: 'qwen-plus',
        input: {
            messages,
            history,
        },
        parameters: {},
    };
    return (0, exports.payload)(exports.GENERATION_URL, requestData);
};
exports.chat = chat;
const translate = async (content) => {
    const messages = [
        {
            role: 'user',
            content: '翻译：' + `\n${content}`,
        },
    ];
    const result = await (0, exports.chat)({
        messages,
    });
    return result.output.text;
};
exports.translate = translate;
function groupArray(arr, groupSize) {
    const groups = [];
    let currentGroup = [];
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
exports.groupArray = groupArray;
