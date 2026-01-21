const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VideoService {
  constructor() {
    this.baseUrl = 'https://www.douyin.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }

  extractVideoId(url) {
    const patterns = [
      /\/video\/(\d+)/,
      /\/v\/(\d+)/,
      /\/share\/video\/(\d+)/,
      /douyin\.com\/(\d+)/,
      /\/note\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  removeWatermark(urlList) {
    if (!urlList || urlList.length === 0) return null;

    let url = urlList[0];
    if (!url) return null;

    url = url.replace('v.douyin.com', 'www.douyin.com');
    url = url.replace('/playwm/', '/play/');
    url = url.replace(/&ratio=720p/, '');

    return url;
  }

  async parseVideo(url) {
    const videoId = this.extractVideoId(url);

    if (!videoId) {
      throw new Error('Invalid Douyin URL');
    }

    const apiUrl = `${this.baseUrl}/aweme/v1/web/aweme/detail/?aweme_id=${videoId}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: this.headers,
        timeout: 15000
      });

      if (response.data && response.data.aweme_detail) {
        return this.formatVideoData(response.data.aweme_detail);
      } else {
        throw new Error('Failed to fetch video data');
      }
    } catch (error) {
      console.error('Parse video error:', error.message);
      throw new Error(`Failed to parse video: ${error.message}`);
    }
  }

  formatVideoData(aweme) {
    const video = aweme.video;

    return {
      id: aweme.aweme_id,
      title: aweme.desc || '',
      cover: this.getFirstImageUrl(video.cover?.url_list),
      duration: video.duration || 0,
      author: {
        uid: aweme.author?.uid || '',
        nickname: aweme.author?.nickname || '',
        avatar: this.getFirstImageUrl(aweme.author?.avatar_thumb?.url_list)
      },
      watermarkUrl: this.getFirstUrl(video.play_addr?.url_list),
      downloadUrl: this.removeWatermark(video.play_addr?.url_list),
      playUrl: this.getFirstUrl(video.play_addr?.url_list),
      createTime: aweme.create_time || Date.now(),
      statistics: {
        diggCount: aweme.statistics?.digg_count || 0,
        commentCount: aweme.statistics?.comment_count || 0,
        shareCount: aweme.statistics?.share_count || 0,
        collectCount: aweme.statistics?.collect_count || 0
      }
    };
  }

  getFirstImageUrl(urlList) {
    if (!urlList || !Array.isArray(urlList) || urlList.length === 0) return '';
    return urlList[0] || '';
  }

  getFirstUrl(urlList) {
    if (!urlList || !Array.isArray(urlList) || urlList.length === 0) return null;
    return urlList[0] || null;
  }

  async downloadVideo(videoUrl, filename = null) {
    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 60000,
        headers: {
          ...this.headers,
          'Referer': this.baseUrl
        }
      });

      const ext = this.getFileExtension(videoUrl) || '.mp4';
      const fileName = filename || `video_${uuidv4()}${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads');

      await fs.ensureDir(uploadDir);
      const filePath = path.join(uploadDir, fileName);

      const writer = fs.createWriteStream(filePath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);

        writer.on('finish', () => {
          resolve({
            filePath,
            fileName,
            size: fs.statSync(filePath).size
          });
        });

        writer.on('error', (error) => {
          fs.unlink(filePath, () => {});
          reject(error);
        });
      });
    } catch (error) {
      console.error('Download error:', error.message);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  getFileExtension(url) {
    if (!url) return null;
    const match = url.match(/\.(\w+)(?:\?|$)/);
    return match ? `.${match[1]}` : null;
  }

  async getVideoInfo(videoId) {
    const apiUrl = `${this.baseUrl}/aweme/v1/web/aweme/detail/?aweme_id=${videoId}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: this.headers,
        timeout: 15000
      });

      if (response.data && response.data.aweme_detail) {
        return this.formatVideoData(response.data.aweme_detail);
      } else {
        throw new Error('Video not found');
      }
    } catch (error) {
      console.error('Get video info error:', error.message);
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL is required' };
    }

    const patterns = [
      /^https?:\/\/v\.douyin\.com\/[\w\-]+/,
      /^https?:\/\/www\.douyin\.com\/video\/\d+/,
      /^https?:\/\/www\.douyin\.com\/share\/video\/\d+/,
      /^https?:\/\/www\.douyin\.com\/v\/\d+/,
      /^https?:\/\/www\.douyin\.com\/note\/\d+/
    ];

    const isValid = patterns.some(pattern => pattern.test(url));

    if (!isValid) {
      return { valid: false, error: 'Invalid Douyin URL format' };
    }

    return { valid: true };
  }
}

module.exports = new VideoService();
