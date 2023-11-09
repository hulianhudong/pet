const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const path = require('path');
const { queryDB } = require('./src/api/query');
const { Chat } = require('./src/api/chat');
const { addRouter } = require('./src/word')
const koaStatic = require('koa-static');

// 静态资源目录的路径
const staticPath = path.join(__dirname, 'public');

const router = new Router();

const cors = require('koa2-cors');

const app = new Koa();

app.use(async (ctx, next) => {
  // 获取请求路径
  const { path } = ctx.request;
  // 如果请求路径以/static/pages/开头，则进行重写
  if (path.includes('/.well-known/')) {
    ctx.request.path = path.replace('/.well-known/', '/well-known/');
  }

  // 继续处理下一个中间件
  await next();
});


// 使用 koa-static 中间件
app.use(koaStatic(staticPath));

// 使用 cors 中间件
app.use(cors({ origin: 'https://yiyan.baidu.com' }));
app.use(
  cors({
    origin: '*',
    credentials: true, // 如果需要发送身份凭证，设置为true
  })
);

// 添加wordService
addRouter(router);

// 更新计数
router.all('/api/search', async (ctx) => {
  const { request } = ctx;
  console.log(request.body);
  const { base = 'petill', content = '猫' } = request.body;

  const result = await queryDB(content, base);
  ctx.body = {
    code: 0,
    data: result,
  };
});

// 会话聊天
router.all('/api/chat', async (ctx) => {
  const { body } = ctx.request;
  const compeletion = await Chat(body);
  ctx.body = compeletion;
});

app
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 3000; // 80;
async function bootstrap() {
  app.listen(port, () => {
    console.log('启动成功', port);
  });
}
bootstrap();
