"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRouter = void 0;
class WordService {
    constructor() {
        this.wordbook = [];
        this.wordbook = [];
    }
    async addWord(ctx) {
        const { word } = ctx.request.body;
        this.wordbook.push(word);
        ctx.body = { message: '单词添加成功' };
    }
    async deleteWord(ctx) {
        const { word } = ctx.request.body;
        if (this.wordbook.includes(word)) {
            this.wordbook.splice(this.wordbook.indexOf(word), 1);
        }
        ctx.body = { message: '单词删除成功' };
    }
    async getWordbook(ctx) {
        ctx.body = { wordbook: this.wordbook };
    }
    async generateSentences(ctx) {
        const { word_number } = ctx.request.body;
        const number = Math.min(word_number, this.wordbook.length);
        const random_words = this.wordbook.sort(() => Math.random() - 0.5).slice(0, number);
        const prompt = '利用英文单词（words）生成一个英文段落，要求这个段落不超过100个英文单词且必须全英文，并包含上述英文单词，同时是一个有逻辑的句子';
        // API返回字段"prompt"有特殊含义：开发者可以通过调试它来调试输出效果
        ctx.body = { words: random_words, prompt };
    }
}
const wordService = new WordService();
function addRouter(router) {
    // 添加一个单词
    router.post('/add_word', wordService.addWord.bind(wordService));
    // 删除一个单词
    router.delete('/delete_word', wordService.deleteWord.bind(wordService));
    // 获得单词本
    router.get('/get_wordbook', wordService.getWordbook.bind(wordService));
    // 生成句子
    router.post('/generate_sentences', wordService.generateSentences.bind(wordService));
}
exports.addRouter = addRouter;
exports.default = wordService;
