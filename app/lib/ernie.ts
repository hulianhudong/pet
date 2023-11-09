interface Config {
  AK: string;
  SK: string;
  accessTokenUrl: string;
  chatCompletionUrl: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  body: string;
}

const { BAIDU_API_KEY = '', BAIDU_SECRETE_KEY = '' } = process.env;

// 使用示例
const defaultConfig: Config = {
  AK: BAIDU_API_KEY,
  SK: BAIDU_SECRETE_KEY,
  accessTokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  chatCompletionUrl:
    'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
};

class ChatService {
  private config: Config;

  constructor(config: any) {
    this.config = Object.assign(defaultConfig, config);
  }

  private async getAccessToken(): Promise<string> {
    const { AK, SK, accessTokenUrl } = this.config;
    const url = `${accessTokenUrl}?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`;
    console.log(url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res: { json: () => any }) => res.json());
      console.log(response);
      return response.access_token;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async streamCompletion({}) {}

  public async createChatCompletion({
    messages,
    user_id,
  }: {
    messages: Message[];
    user_id: string;
  }): Promise<any> {
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
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }
}

export async function GetChat() {
  const chatService = new ChatService(defaultConfig);
  const messages: Message[] = [
    {
      role: 'user',
      content: '家里的猫咪半夜躁动怎么办？',
    },
  ];
  const user_id = '123456';

  const resp = await chatService.createChatCompletion({ messages, user_id });
  return resp.data;
}

export default ChatService;
