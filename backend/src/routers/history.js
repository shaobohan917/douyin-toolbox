const Router = require('koa-router');
const historyController = require('../controllers/history');

const router = new Router({ prefix: '/api/history' });

router.get('/', async (ctx) => {
  await historyController.getHistory(ctx);
});

router.post('/', async (ctx) => {
  const item = ctx.request.body;
  await historyController.addToHistory(ctx, item);
});

router.delete('/:id', async (ctx) => {
  const { id } = ctx.params;
  await historyController.deleteFromHistory(ctx, id);
});

router.delete('/', async (ctx) => {
  await historyController.clearHistory(ctx);
});

router.get('/stats', async (ctx) => {
  await historyController.getStats(ctx);
});

module.exports = router;
