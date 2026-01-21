const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VideoController {
  async parseVideo(ctx, url) {
    try {
      // Extract clean URL from text (handles Douyin share format)
      const cleanUrl = this.extractDouyinUrl(url);
      
      const parsedData = await this.parseDouyinUrl(cleanUrl);
      
      ctx.body = {
        success: true,
        message: 'Video parsed successfully',
        data: parsedData
      };
    } catch (error) {
      console.error('Parse video error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || 'Failed to parse video',
        data: null
      };
    }
  }

  extractDouyinUrl(text) {
    const urlPattern = /(https?:\/\/(?:v\.douyin\.com|www\.douyin\.com)\/[\w\-\/]+)/;
    const match = text.match(urlPattern);
    return match ? match[1] : text;
  }

  async parseDouyinUrl(url) {
    let targetUrl = url;

    // Handle short URLs (v.douyin.com/xxx)
    if (url.includes('v.douyin.com')) {
      try {
        const response = await axios.get(url, {
          maxRedirects: 0,
          validateStatus: status => status >= 200 && status < 400,
          timeout: 5000
        });
        
        // Get redirect URL from Location header
        if (response.headers.location) {
          targetUrl = response.headers.location;
          console.log('Redirected to:', targetUrl);
        }
      } catch (error) {
        // If no redirect header, try following redirects
        try {
          const response = await axios.get(url, {
            maxRedirects: 5,
            timeout: 5000
          });
          targetUrl = response.request.res.responseUrl || url;
          console.log('Final URL:', targetUrl);
        } catch (e) {
          console.error('Failed to follow redirect:', e.message);
        }
      }
    }
    
    const videoId = this.extractVideoId(targetUrl);
    
    if (!videoId) {
      throw new Error('Invalid Douyin URL: ' + targetUrl);
    }

    console.log('Extracted video ID:', videoId);
    
    // Use the same approach as yzfly/douyin-mcp-server
    const pageUrl = `https://www.iesdouyin.com/share/video/${videoId}/`;
    console.log('Fetching page:', pageUrl);
    
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.douyin.com/'
      },
      timeout: 15000
    });
    
    console.log('Page status:', response.status);
    
    // Extract window._ROUTER_DATA from the HTML (same as yzfly/douyin-mcp-server)
    const routerDataMatch = response.data.match(/window\._ROUTER_DATA\s*=\s*(.*?)<\/script>/);
    
    if (!routerDataMatch || !routerDataMatch[1]) {
      throw new Error('Failed to extract _ROUTER_DATA from page');
    }
    
    const jsonData = JSON.parse(routerDataMatch[1].trim());
    console.log('Successfully parsed _ROUTER_DATA');
    
    // Navigate to video info (same structure as yzfly's implementation)
    const VIDEO_ID_PAGE_KEY = 'video_(id)/page';
    const NOTE_ID_PAGE_KEY = 'note_(id)/page';
    
    let originalVideoInfo;
    if (VIDEO_ID_PAGE_KEY in jsonData.loaderData) {
      originalVideoInfo = jsonData.loaderData[VIDEO_ID_PAGE_KEY].videoInfoRes;
    } else if (NOTE_ID_PAGE_KEY in jsonData.loaderData) {
      originalVideoInfo = jsonData.loaderData[NOTE_ID_PAGE_KEY].videoInfoRes;
    } else {
      throw new Error('Cannot find video info in _ROUTER_DATA');
    }
    
    const data = originalVideoInfo.item_list[0];
    
    // Extract video info
    const video = data.video;
    const videoUrl = video.play_addr.url_list[0].replace('playwm', 'play');
    const desc = (data.desc || '').trim() || `douyin_${videoId}`;
    
    // Clean filename
    const cleanDesc = desc.replace(/[\\/:*?"<>|]/g, '_');
    
    // Get author info
    const author = data.author || {};
    
    // Get statistics
    const statistics = data.statistics || {};
    
    return {
      id: videoId,
      title: cleanDesc,
      cover: video.cover?.url_list?.[0] || '',
      duration: video.duration || 0,
      author: {
        uid: author.uid || '',
        nickname: author.nickname || '未知用户',
        avatar: author.avatar_thumb?.url_list?.[0] || author.avatar || ''
      },
      watermarkUrl: video.play_addr.url_list[0],
      downloadUrl: videoUrl,
      playUrl: videoUrl,
      createTime: data.create_time || Date.now() / 1000,
      statistics: {
        diggCount: statistics.digg_count || 0,
        commentCount: statistics.comment_count || 0,
        shareCount: statistics.share_count || 0,
        collectCount: statistics.collect_count || 0
      }
    };
  }

  extractVideoId(url) {
    const patterns = [
      /\/video\/(\d+)/,
      /\/v\/(\d+)/,
      /\/share\/video\/(\d+)/,
      /douyin\.com\/(\d+)/,
      /iesdouyin\.com\/share\/video\/(\d+)/,
      /\/note\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  async downloadVideo(ctx, url, filename) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000
      });

      const ext = path.extname(url) || '.mp4';
      const fileName = filename || `video_${uuidv4()}${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads');
      
      await fs.ensureDir(uploadDir);
      const filePath = path.join(uploadDir, fileName);

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
      ctx.set('Content-Type', 'video/mp4');
      
      ctx.body = fs.createReadStream(filePath);
    } catch (error) {
      console.error('Download error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to download video',
        data: null
      };
    }
  }

  async proxyDownload(ctx, videoUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Referer': 'https://www.douyin.com/'
        }
      });

      const contentType = response.headers['content-type'] || 'video/mp4';
      const ext = path.extname(videoUrl) || '.mp4';
      const fileName = `douyin_video_${Date.now()}${ext}`;

      ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
      ctx.set('Content-Type', contentType);
      ctx.set('Content-Length', response.headers['content-length'] || '');
      ctx.set('Cache-Control', 'no-cache');

      ctx.body = response.data;
    } catch (error) {
      console.error('Proxy download error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to download video: ' + error.message,
        data: null
      };
    }
  }

  async extractText(ctx, videoUrl, apiKey) {
    try {
      const sttService = require('../services/sttService');
      
      const dashscopeApiKey = apiKey || process.env.DASHSCOPE_API_KEY;
      
      if (!dashscopeApiKey) {
        throw new Error('请配置环境变量 DASHSCOPE_API_KEY');
      }

      const result = await sttService.extractText(videoUrl, dashscopeApiKey, {
        model: 'paraformer-v2',
        languageHints: ['zh', 'en']
      });
      
      ctx.body = {
        success: true,
        message: '文字提取成功',
        data: result
      };
    } catch (error) {
      console.error('Speech to text error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || 'Failed to extract text',
        data: null
      };
    }
  }
}

module.exports = new VideoController();
