import { DirectoryLoader } from "langchain/document_loaders/fs/directory";

import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { Reader } from "./document";

export class DirectoryReader extends Reader {
  async load(path: string) {
    const loader = new DirectoryLoader(path, {
      ".json": (path) => new JSONLoader(path, "/texts"),
      ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
      ".txt": (path) => new TextLoader(path),
      ".csv": (path) => new CSVLoader(path, { column: "内容" }),
    });
    loader.load().then((files) => {
      const docs = files.map((d) => d.pageContent);
      this.addDocs(docs);
    });
  }
}
