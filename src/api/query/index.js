"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIHandler = exports.queryRelated = exports.queryDB = void 0;
const milvus2_sdk_node_1 = require("@zilliz/milvus2-sdk-node");
const util_1 = require("../../modules/dochain/db/util");
const Zillis_1 = __importDefault(require("../../modules/dochain/db/Zillis"));
const config_1 = require("../../modules/dochain/config");
const { COLLECTION } = config_1.victor_conf;
const db = new Zillis_1.default(COLLECTION);
const queryDB = async (content) => {
    db.outputFileds = ['content', 'metadata'];
    const result = await db.queryByEmbeddings(content);
    return result;
};
exports.queryDB = queryDB;
const queryRelated = async (texts, base = COLLECTION) => {
    const { ZILLIZ_ENDPOINT = '', ZILLIZ_USER = '', ZILLIZ_PASS = '', } = process.env;
    const ssl = false;
    const client = new milvus2_sdk_node_1.MilvusClient({
        address: ZILLIZ_ENDPOINT,
        ssl,
        username: ZILLIZ_USER,
        password: ZILLIZ_PASS,
    });
    const embeddings = await (0, util_1.textEmbedding)({ texts });
    const result = await client.search({
        collection_name: base,
        vector: embeddings.map((m) => m.embedding),
        output_fields: ['content', 'metadata'],
        limit: 3,
    });
    console.log(result);
    if (result.status.code === 0) {
        return result.results;
    }
    return [];
};
exports.queryRelated = queryRelated;
// API 请求处理方法
const APIHandler = async (ctx) => {
    const { content = '' } = JSON.parse(ctx.body);
    const result = await (0, exports.queryDB)(content);
    ctx.body = JSON.stringify({ result });
};
exports.APIHandler = APIHandler;
