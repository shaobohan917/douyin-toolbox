const Router = require('koa-router');
const videoController = require('../controllers/video');
const { isValidDouyinUrl } = require('../utils/videoHelper');

const router = new Router({ prefix: '/api/video' });

router.post('/parse', async (ctx) => {
  const { url } = ctx.request.body;
  if (!url) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'URL is required', data: null };
    return;
  }
  
  // Validate Douyin URL format
  if (!isValidDouyinUrl(url)) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'Invalid Douyin URL format', data: null };
    return;
  }
  
  await videoController.parseVideo(ctx, url);
});

router.post('/download', async (ctx) => {
  const { url, filename } = ctx.request.body;
  if (!url) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'URL is required', data: null };
    return;
  }
  await videoController.downloadVideo(ctx, url, filename);
});

router.post('/speech-to-text', async (ctx) => {
  const { videoUrl, apiKey } = ctx.request.body;
  if (!videoUrl) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'Video URL is required', data: null };
    return;
  }
  await videoController.extractText(ctx, videoUrl, apiKey);
});

router.get('/proxy-download', async (ctx) => {
  const { url } = ctx.query;
  if (!url) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'URL is required', data: null };
    return;
  }
  await videoController.proxyDownload(ctx, url);
});

router.post('/analyze', async (ctx) => {
  const { videoId, title, tags, audioText } = ctx.request.body;
  if (!videoId || !title) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'Video ID and title are required', data: null };
    return;
  }
  await videoController.analyzeVideoContent(ctx, { videoId, title, tags, audioText });
});

module.exports = router;
