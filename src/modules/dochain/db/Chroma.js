"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chromadb_1 = require("chromadb");
const VictorDB_1 = __importDefault(require("./VictorDB"));
class Chroma extends VictorDB_1.default {
    constructor(name) {
        super(name);
        this.client = new chromadb_1.ChromaClient({
            path: 'http://hulianhudong.cn',
        });
    }
    async getCollection() {
        if (this.collection) {
            return this.collection;
        }
        const client = this.client;
        this.collection = (await client.getCollection({
            name: this.collectionName,
            embeddingFunction: this.getEmbedding(),
        }));
        if (!this.collection) {
            await this.createCollection(this.collectionName);
        }
        return this.collection;
    }
    formatResult(data) {
        const { documents } = data;
        // todo 格式化云信息
        const content = documents
            .map((doc) => {
            return Array.isArray(doc) ? doc.join('\n') : doc.content;
        })
            .join('\n\n');
        return { content };
    }
}
exports.default = Chroma;
