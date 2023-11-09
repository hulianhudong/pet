"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChat = void 0;
const { BAIDU_API_KEY = '', BAIDU_SECRETE_KEY = '' } = process.env;
// 使用示例
const defaultConfig = {
    AK: BAIDU_API_KEY,
    SK: BAIDU_SECRETE_KEY,
    accessTokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    chatCompletionUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
};
class ChatService {
    constructor(config) {
        this.config = Object.assign(defaultConfig, config);
    }
    async getAccessToken() {
        const { AK, SK, accessTokenUrl } = this.config;
        const url = `${accessTokenUrl}?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`;
        console.log(url);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((res) => res.json());
            console.log(response);
            return response.access_token;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async streamCompletion({}) { }
    async createChatCompletion({ messages, user_id, }) {
        try {
            const accessToken = await this.getAccessToken();
            console.log(accessToken);
            const payload = JSON.stringify({
                user_id,
                stream: true,
                messages,
            });
            const url = `${this.config.chatCompletionUrl}?access_token=${accessToken}`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: payload,
            };
            return await fetch(url, options).then((r) => r.text());
        }
        catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }
}
async function GetChat() {
    const chatService = new ChatService(defaultConfig);
    const messages = [
        {
            role: 'user',
            content: '家里的猫咪半夜躁动怎么办？',
        },
    ];
    const user_id = '123456';
    const resp = await chatService.createChatCompletion({ messages, user_id });
    return resp.data;
}
exports.GetChat = GetChat;
exports.default = ChatService;
