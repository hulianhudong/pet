import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { Reader } from './document';

export class PageReader extends Reader {
  async load(sourceUrl: string) {
    // const sourceUrl = "https://mp.weixin.qq.com/s/L1xHLd-gKDsmi0lnSmm6pQ";
    const loader = new CheerioWebBaseLoader(sourceUrl, {
      selector: '.rich_media_content p',
    });
    const filter = (content: string) => {
      const rows = content
        .split('\n')
        .filter((r: string) => r.trim().length > 3);
      return rows.join('\n');
    };

    this.source = sourceUrl;
    await loader.load().then(async (pages) => {
      const docs = pages.map((p) => filter(p.pageContent));
      this.addDocs(docs);
    });
  }
}
