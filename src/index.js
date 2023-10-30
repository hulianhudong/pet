"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa2_cors_1 = __importDefault(require("koa2-cors"));
const koa_router_1 = __importDefault(require("koa-router"));
const app = new koa_1.default();
const router = new koa_router_1.default();
// 鉴权中间件
// app.use(jwt({ secret: 'auth_token' }).unless({ path: [/^\/api\/login/] }));
// 使用 cors 中间件
app.use((0, koa2_cors_1.default)({}));
// // 静态资源目录的路径
// const staticPath = path.join(__dirname, '..', 'public');
// // 使用 koa-static 中间件
// app.use(koaStatic(staticPath));
// 将所有 api/* 请求转发到 APIHandler 方法
router.all('/api/hello', async function (ctx, next) {
    console.log(ctx.request.url);
    ctx.body = 'hello world';
    next && next();
});
// 将路由应用到 Koa 应用
app.use(router.routes()).use(router.allowedMethods());
app.use(async (ctx) => {
    console.log(ctx.request.url);
});
app.listen(3001, () => {
    console.log('Server is running on port 3000');
});
