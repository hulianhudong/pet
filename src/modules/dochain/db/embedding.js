"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function getAccessToken(apiKey, secretKey) {
    const response = await axios_1.default.get('https://aip.baidubce.com/oauth/2.0/token', {
        params: {
            grant_type: 'client_credentials',
            client_id: apiKey,
            client_secret: secretKey,
        },
    });
    return response.data.access_token;
}
const models = ['embedding-v1', 'bge_large_zh', 'bge-large-en'];
async function getEmbeddings(accessToken, input, model = 'embedding-v1') {
    const response = await axios_1.default.post(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings/${model}?access_token=${accessToken}`, {
        input,
    });
    return response.data;
}
// Example usage
const apiKey = process.env.BAIDU_API_KEY || '';
const secretKey = process.env.BAIDU_SECRETE_KEY || '';
let accessToken = '';
const embeddingText = async ({ texts }) => {
    if (!accessToken || Math.random() > 0.7) {
        accessToken = await getAccessToken(apiKey, secretKey);
    }
    const { data } = await getEmbeddings(accessToken, texts);
    return data;
};
exports.default = embeddingText;
