"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const embedding_1 = __importDefault(require("./embedding"));
const util_1 = require("./util");
class MockClient {
    constructor({ path }) {
        this.path = path;
    }
    listCollections() {
        throw new Error('Method not implemented.');
    }
    createCollection(arg0) {
        throw new Error('Method not implemented.');
    }
}
class VictorDB {
    constructor(collectionName) {
        this.resultCount = 5;
        this.collectionName = collectionName;
        this.client = new MockClient({ path: 'http://hulianhudong.cn' });
    }
    async createCollection(name = '') {
        this.collectionName = name || this.collectionName;
        this.collection = await this.client.createCollection({
            name: name || this.collectionName,
            embeddingFunction: this.getEmbedding(),
        });
    }
    getEmbedding() {
        return { generate: (queries) => this.embedding(queries) };
    }
    async listCollection() {
        return this.client.listCollections();
    }
    async embedding(queries) {
        if (config_1.victor_conf.EMBEDDING_VENDOR === 'wenxin') {
            const queryEmbeddings = await (0, embedding_1.default)({ texts: queries });
            return (queryEmbeddings || []).map((em) => em.embedding);
        }
        const queryEmbeddings = await (0, util_1.textEmbedding)({ texts: queries });
        return queryEmbeddings.map((em) => em.embedding);
    }
    async getCollection() {
        return this.collection;
    }
    async addDocs(docs, metas = {}) {
        const embeddings = await this.embedding(docs);
        console.log(metas);
        const metadatas = Array.isArray(metas)
            ? metas
            : docs.map((val) => {
                const id = (0, util_1.getHashId)(val);
                return { key: `docs_${id}`, value: val, ...metas };
            });
        const collection = await this.getCollection();
        await collection?.add({
            ids: metadatas.map((c) => c.key),
            embeddings: embeddings,
            metadatas: metadatas,
            documents: docs,
        });
    }
    // 通过文档对象导入，方便loader保留元信息
    async addDocuments(docs, addition = {}) {
        const groups = (0, util_1.groupArray)(docs, 20);
        const batch = groups.map(async (docs) => {
            const documents = [];
            const metas = [];
            docs.forEach((doc) => {
                const { pageContent, metadata } = doc;
                documents.push(pageContent);
                const key = (0, util_1.getHashId)(pageContent);
                metas.push({ key, ...metadata, ...addition });
            });
            await this.addDocs(documents, metas);
        });
        return Promise.all(batch);
    }
    formatResult(data) {
        // todo 不用类型数据库独立使用
        const { results, documents = results } = data;
        // todo 格式化云信息
        const content = documents
            .map((doc) => {
            return Array.isArray(doc) ? doc.join('\n') : doc.content;
        })
            .join('\n\n');
        return { content };
    }
    async summary(query, condition = {}) {
        const data = await this.queryByEmbeddings(query, condition);
        const { content } = this.formatResult(data);
        const messages = [
            {
                role: 'user',
                content: '你是知识萃取专家，善于结构化内容整理和思维表达，请根据以下内容进行总结和回答我的问题' +
                    `\n内容:\n${content}`,
            },
            {
                role: 'assistant',
                content: '我会根据文档的内容回答你的问题，请问你的问题是什么',
            },
            {
                role: 'user',
                content: query,
            },
        ];
        const result = await (0, util_1.chat)({
            messages,
        });
        result.context = content;
        return result;
    }
    async translate(content) {
        return (0, util_1.translate)(content);
    }
    async remove(condition = {}) {
        const collection = await this.getCollection();
        await collection?.delete({ where: condition });
    }
    async queryByEmbeddings(query, condition = {}) {
        const collection = await this.getCollection();
        const rs = await this.embedding([query]);
        return collection?.query({
            queryEmbeddings: rs,
            include: this.outputFileds,
            nResults: this.resultCount,
            where: condition,
        });
    }
    async queryByText(query) {
        const collection = await this.getCollection();
        return collection?.query({
            queryTexts: [query],
            nResults: this.resultCount,
            queryEmbeddings: [],
        });
    }
    async query(query, condition = {}) {
        const options = {
            queryTexts: [''],
            nResults: this.resultCount,
            where: condition,
            ...query,
        };
        const collection = await this.getCollection();
        return collection?.query(options);
    }
}
exports.default = VictorDB;
