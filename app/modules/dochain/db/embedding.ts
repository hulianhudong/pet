import axios from 'axios';

interface AccessTokenResponse {
  access_token: string;
}

interface EmbeddingRequest {
  input: string[];
}

interface EmbeddingResult {
  object: string;
  embedding: number[];
}

interface EmbeddingResponse {
  data: EmbeddingResult[];
}

async function getAccessToken(
  apiKey: string,
  secretKey: string
): Promise<string> {
  const response = await axios.get<AccessTokenResponse>(
    'https://aip.baidubce.com/oauth/2.0/token',
    {
      params: {
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: secretKey,
      },
    }
  );

  return response.data.access_token;
}

const models = ['embedding-v1', 'bge_large_zh', 'bge-large-en'];

async function getEmbeddings(
  accessToken: string,
  input: string[],
  model: string = 'embedding-v1'
): Promise<EmbeddingResponse> {
  const response = await axios.post<EmbeddingResponse>(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings/${model}?access_token=${accessToken}`,
    {
      input,
    }
  );

  return response.data;
}

// Example usage
const apiKey = process.env.BAIDU_API_KEY || '';
const secretKey = process.env.BAIDU_SECRETE_KEY || '';
let accessToken = '';
const embeddingText = async ({ texts }: { texts: string[] }) => {
  if (!accessToken || Math.random() > 0.7) {
    accessToken = await getAccessToken(apiKey, secretKey);
  }
  const { data } = await getEmbeddings(accessToken, texts);
  return data;
};

export default embeddingText;
