"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageReader = void 0;
const cheerio_1 = require("langchain/document_loaders/web/cheerio");
const document_1 = require("./document");
class PageReader extends document_1.Reader {
    async load(sourceUrl) {
        // const sourceUrl = "https://mp.weixin.qq.com/s/L1xHLd-gKDsmi0lnSmm6pQ";
        const loader = new cheerio_1.CheerioWebBaseLoader(sourceUrl, {
            selector: '.rich_media_content p',
        });
        const filter = (content) => {
            const rows = content
                .split('\n')
                .filter((r) => r.trim().length > 3);
            return rows.join('\n');
        };
        this.source = sourceUrl;
        await loader.load().then(async (pages) => {
            const docs = pages.map((p) => filter(p.pageContent));
            this.addDocs(docs);
        });
    }
}
exports.PageReader = PageReader;
