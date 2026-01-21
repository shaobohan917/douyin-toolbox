const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const serve = require('koa-static');
const path = require('path');
const fs = require('fs-extra');

const videoRouter = require('./routers/video');
const historyRouter = require('./routers/history');
const configRouter = require('./routers/config');

const app = new Koa();
const router = new Router();

app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser({
  jsonLimit: '10mb',
  formLimit: '10mb'
}));

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message,
      data: null
    };
    console.error('Server error:', err);
  }
});

router.get('/api/health', async (ctx) => {
  ctx.body = {
    success: true,
    message: 'Douyin Toolbox API is running',
    data: {
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(videoRouter.routes());
app.use(videoRouter.allowedMethods());

app.use(historyRouter.routes());
app.use(historyRouter.allowedMethods());

app.use(configRouter.routes());
app.use(configRouter.allowedMethods());

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
