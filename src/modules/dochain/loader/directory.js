"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryReader = void 0;
const directory_1 = require("langchain/document_loaders/fs/directory");
const json_1 = require("langchain/document_loaders/fs/json");
const text_1 = require("langchain/document_loaders/fs/text");
const csv_1 = require("langchain/document_loaders/fs/csv");
const document_1 = require("./document");
class DirectoryReader extends document_1.Reader {
    async load(path) {
        const loader = new directory_1.DirectoryLoader(path, {
            ".json": (path) => new json_1.JSONLoader(path, "/texts"),
            ".jsonl": (path) => new json_1.JSONLinesLoader(path, "/html"),
            ".txt": (path) => new text_1.TextLoader(path),
            ".csv": (path) => new csv_1.CSVLoader(path, { column: "内容" }),
        });
        loader.load().then((files) => {
            const docs = files.map((d) => d.pageContent);
            this.addDocs(docs);
        });
    }
}
exports.DirectoryReader = DirectoryReader;
