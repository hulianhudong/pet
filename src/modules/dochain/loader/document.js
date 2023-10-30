"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFReader = exports.JSONReader = exports.TextReader = exports.Reader = void 0;
const pdf_1 = require("langchain/document_loaders/fs/pdf");
const VictorDB_1 = __importDefault(require("../db/VictorDB"));
const text_1 = require("langchain/document_loaders/fs/text");
const text_splitter_1 = require("langchain/text_splitter");
const path_1 = __importDefault(require("path"));
class Reader {
    constructor(victor) {
        this.source = '';
        this.victor = typeof victor === 'string' ? new VictorDB_1.default(victor) : victor;
    }
    async create() {
        await this.victor.createCollection();
    }
    async load(path) {
        this.source = path;
        const loader = new text_1.TextLoader(path);
        const docs = await loader.load().then((docs) => {
            const pages = docs.map((d) => d.pageContent.replace(/\n+/g, '').trim());
            return pages;
        });
        await this.addDocs(docs);
    }
    async splitText(text) {
        const splitter = new text_splitter_1.CharacterTextSplitter({
            separator: '。',
            chunkSize: 200,
            chunkOverlap: 3,
        });
        const output = await splitter.createDocuments([text]);
        return output;
    }
    async addDocs(docs) {
        return docs.map(async (doc) => {
            const truncks = await this.splitText(doc);
            this.victor.addDocuments(truncks, {
                type: 'page',
                source: this.source,
                create_time: Date.now(),
            });
        });
    }
    async question(question, option = {}) {
        const { usage, output, context } = await this.victor.summary(question, option);
        console.log(usage);
        console.log('context', context);
        return output?.text || '';
    }
}
exports.Reader = Reader;
class TextReader extends Reader {
}
exports.TextReader = TextReader;
class JSONReader extends Reader {
    async load(file) {
        const absPath = path_1.default.resolve(file);
        const data = require(absPath);
        const docs = data.map(({ question, answer, content }) => {
            const c = answer?.join(', ');
            return {
                pageContent: question,
                metadata: {
                    question,
                    content: content || c,
                    answer: c,
                },
            };
        });
        await this.victor.addDocuments(docs, {
            type: 'json',
            source: absPath,
            create_time: Date.now(),
        });
    }
}
exports.JSONReader = JSONReader;
class PDFReader extends Reader {
    constructor(name) {
        super(name);
    }
    async load(path) {
        const loader = new pdf_1.PDFLoader(path);
        const docs = await loader.load().then((docs) => {
            const pages = docs.map((d) => d.pageContent.replace(/\n+/g, '').trim());
            return pages;
        });
        await this.victor.addDocs(docs, {
            type: 'pdf',
            source: path,
            create_time: Date.now(),
        });
    }
}
exports.PDFReader = PDFReader;
