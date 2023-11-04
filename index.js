const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const path = require('path');
const { queryDB } = require('./src/api/query');
const { Chat } = require('./src/api/chat');
const koaStatic = require('koa-static');

// 静态资源目录的路径
const staticPath = path.join(__dirname, 'public');

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const cors = require('koa2-cors');

const app = new Koa();

// 使用 koa-static 中间件
app.use(koaStatic(staticPath));

// 使用 cors 中间件
app.use(cors());
app.use(
  cors({
    origin: '*',
    credentials: true, // 如果需要发送身份凭证，设置为true
  })
);

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

// 首页
router.get('/', async (ctx) => {
  ctx.body = homePage;
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
