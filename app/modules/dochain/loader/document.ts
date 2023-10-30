import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import VictorDB from '../db/VictorDB';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import path from 'path';

export class Reader {
  victor: VictorDB;
  source: string = '';
  constructor(victor: VictorDB | string) {
    this.victor = typeof victor === 'string' ? new VictorDB(victor) : victor;
  }
  async create() {
    await this.victor.createCollection();
  }
  async load(path: string) {
    this.source = path;
    const loader = new TextLoader(path);
    const docs = await loader.load().then((docs) => {
      const pages = docs.map((d) => d.pageContent.replace(/\n+/g, '').trim());
      return pages;
    });
    await this.addDocs(docs);
  }
  async splitText(text: string) {
    const splitter = new CharacterTextSplitter({
      separator: '。',
      chunkSize: 200,
      chunkOverlap: 3,
    });
    const output = await splitter.createDocuments([text]);
    return output;
  }
  async addDocs(docs: string[]) {
    return docs.map(async (doc) => {
      const truncks = await this.splitText(doc);
      this.victor.addDocuments(truncks, {
        type: 'page',
        source: this.source,
        create_time: Date.now(),
      });
    });
  }
  async question(question: string, option = {}) {
    const { usage, output, context } = await this.victor.summary(
      question,
      option
    );
    console.log(usage);
    console.log('context', context);
    return output?.text || '';
  }
}

export class TextReader extends Reader {}

export class JSONReader extends Reader {
  async load(file: string) {
    const absPath = path.resolve(file);
    const data = require(absPath);
    const docs = data.map(({ question, answer, content }: any) => {
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

export class PDFReader extends Reader {
  constructor(name: string) {
    super(name);
  }
  async load(path: string) {
    const loader = new PDFLoader(path);
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
