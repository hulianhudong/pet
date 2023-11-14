const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const path = require('path');
const { queryDB, questionPet } = require('./src/api/query');
const { Chat } = require('./src/api/chat');
const { addRouter } = require('./src/word')
const koaStatic = require('koa-static');

// 静态资源目录的路径
const staticPath = path.join(__dirname, 'public');

const router = new Router();

const cors = require('koa2-cors');

const app = new Koa();

// 使用 cors 中间件，所有域名都可跨域请求
app.use(cors({ origin: '*' }));

app.use(async (ctx, next) => {
    // 获取请求路径
  const { path } = ctx.request;

  const { uid, sid, pluginId } = ctx.query;

  console.log(uid, sid, pluginId);

  if (ctx.method === 'OPTIONS') {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    ctx.status = 200;
    return;
  }

  // 如果请求路径以/static/pages/开头，则进行重写
  if (path.includes('/.well-known/')) {
    ctx.request.path = path.replace('/.well-known/', '/well-known/');
  } else if (path.includes('/ai-plugin.json')) {
    ctx.request.path = '/well-known/ai-plugin.json'
  } else if (path.includes('/openapi.yaml')) {
    ctx.request.path = '/well-known/openapi.yaml'
  }

  // 继续处理下一个中间件
  await next();
});


// 使用 koa-static 中间件
app.use(koaStatic(staticPath));


// 添加wordService
addRouter(router);

// 测试百度文心一言插件
router.all('/questionPet', questionPet);

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
