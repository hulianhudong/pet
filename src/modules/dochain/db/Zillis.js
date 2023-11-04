"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = exports.config = void 0;
const milvus2_sdk_node_1 = require("@zilliz/milvus2-sdk-node");
const VictorDB_1 = __importDefault(require("./VictorDB"));
const config_1 = require("../config");
const { ZILLIZ_ENDPOINT = '', ZILLIZ_USER = '', ZILLIZ_PASS = '', EMBEDDING_VENDOR, COLLECTION, } = config_1.victor_conf;
let address = ZILLIZ_ENDPOINT;
let token = `${ZILLIZ_USER}:${ZILLIZ_PASS}`;
if (token.length < 10) {
    console.log('zilliz token is empty');
}
const config = (option) => {
    address = option.address || address;
    token = option.token || token;
};
exports.config = config;
class Collection {
    constructor({ name, embeddingFunction }, client) {
        this.name = name;
        this.client = client;
        this.embeddingFunction = embeddingFunction;
    }
    async delete(options) {
        this.client.delete({
            collection_name: this.name,
            ...options,
        });
    }
    async add({ ids, embeddings, metadatas, documents }) {
        const data = ids.map((id, i) => {
            return {
                id: id,
                metadata: metadatas[i],
                content: documents[i],
                vector: embeddings[i],
            };
        });
        return await this.client.insert({
            collection_name: this.name,
            data: data,
        });
    }
    async query({ queryEmbeddings, nResults, where, include }) {
        const searchParams = {
            collection_name: this.name,
            vectors: queryEmbeddings,
            params: where,
            output_fields: include,
            limit: nResults,
            top_k: nResults, // replace with the desired number of results
        };
        const rst = await this.client.search(searchParams);
        return rst;
    }
}
exports.Collection = Collection;
const default_dimension = EMBEDDING_VENDOR === 'wenxin' ? 1024 : 1536;
class Zillis extends VictorDB_1.default {
    constructor(name) {
        super(name);
        this.client = new milvus2_sdk_node_1.MilvusClient({ address, token });
        this.collectionName = name;
        // 按业务需要选择要返回字段，如果字段不存在会报错
        // this.outputFileds = ["content", "metadata"];
    }
    async createCollection(name = '', dimension = default_dimension) {
        const collection_name = name || this.collectionName;
        const collectionParams = {
            collection_name,
            dimension,
        };
        this.collectionName = collection_name;
        await this.client.createCollection(collectionParams);
    }
    async drop(collection_name) {
        return this.client.dropCollection({ collection_name });
    }
    async remove(condition = {}) {
        const collection = await this.getCollection();
        await collection.delete({ ids: condition.ids });
    }
    async getCollection() {
        const name = this.collectionName;
        const embeddingFunction = this.getEmbedding();
        const collection = new Collection({ name, embeddingFunction }, this.client);
        return collection;
    }
    listCollections() {
        return this.client.listCollections();
    }
}
exports.default = Zillis;
