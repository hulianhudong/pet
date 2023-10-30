const { init: initDB, Counter } = require('./db');

const init = async (router) => {
  await initDB();

  // 更新计数
  router.post('/api/count', async (ctx) => {
    const { request } = ctx;
    const { action } = request.body;
    if (action === 'inc') {
      await Counter.create();
    } else if (action === 'clear') {
      await Counter.destroy({
        truncate: true,
      });
    }

    ctx.body = {
      code: 0,
      data: await Counter.count(),
    };
  });

  // 获取计数
  router.get('/api/count', async (ctx) => {
    const result = await Counter.count();

    ctx.body = {
      code: 0,
      data: result,
    };
  });

  // 小程序调用，获取微信 Open ID
  router.get('/api/wx_openid', async (ctx) => {
    if (ctx.request.headers['x-wx-source']) {
      ctx.body = ctx.request.headers['x-wx-openid'];
    }
  });
};
