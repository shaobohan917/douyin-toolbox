const Router = require('koa-router');
const configController = require('../controllers/config');

const router = new Router({ prefix: '/api/config' });

router.get('/', async (ctx) => {
  await configController.getConfig(ctx);
});

router.post('/', async (ctx) => {
  const config = ctx.request.body;
  await configController.updateConfig(ctx, config);
});

module.exports = router;
