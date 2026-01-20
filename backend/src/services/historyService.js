const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class HistoryService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, 'history.json');
    this.init();
  }

  init() {
    fs.ensureDirSync(this.dataDir);
    if (!fs.existsSync(this.filePath)) {
      fs.writeJsonSync(this.filePath, [], { spaces: 2 });
    }
  }

  async getAll(options = {}) {
    try {
      let history = fs.readJsonSync(this.filePath);

      if (options.sortBy === 'date') {
        history = history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (options.sortBy === 'title') {
        history = history.sort((a, b) => a.title.localeCompare(b.title));
      }

      if (options.limit) {
        history = history.slice(0, options.limit);
      }

      return history;
    } catch (error) {
      console.error('Get history error:', error);
      throw new Error('Failed to get history');
    }
  }

  async getById(id) {
    try {
      const history = fs.readJsonSync(this.filePath);
      const item = history.find(h => h.id === id);
      return item || null;
    } catch (error) {
      console.error('Get history item error:', error);
      throw new Error('Failed to get history item');
    }
  }

  async add(item) {
    try {
      const history = fs.readJsonSync(this.filePath);

      const newItem = {
        id: uuidv4(),
        videoId: item.videoId || '',
        url: item.url || '',
        title: item.title || '',
        cover: item.cover || '',
        downloadUrl: item.downloadUrl || '',
        author: item.author || '',
        createdAt: new Date().toISOString()
      };

      history.unshift(newItem);

      if (history.length > 1000) {
        history = history.slice(0, 1000);
      }

      fs.writeJsonSync(this.filePath, history, { spaces: 2 });

      return newItem;
    } catch (error) {
      console.error('Add history error:', error);
      throw new Error('Failed to add to history');
    }
  }

  async delete(id) {
    try {
      let history = fs.readJsonSync(this.filePath);
      const filtered = history.filter(h => h.id !== id);
      fs.writeJsonSync(this.filePath, filtered, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Delete history error:', error);
      throw new Error('Failed to delete history item');
    }
  }

  async clear() {
    try {
      fs.writeJsonSync(this.filePath, [], { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Clear history error:', error);
      throw new Error('Failed to clear history');
    }
  }

  async search(query) {
    try {
      const history = fs.readJsonSync(this.filePath);
      const lowerQuery = query.toLowerCase();

      const results = history.filter(h =>
        h.title?.toLowerCase().includes(lowerQuery) ||
        h.author?.toLowerCase().includes(lowerQuery) ||
        h.videoId?.includes(query)
      );

      return results;
    } catch (error) {
      console.error('Search history error:', error);
      throw new Error('Failed to search history');
    }
  }

  async getStats() {
    try {
      const history = fs.readJsonSync(this.filePath);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: history.length,
        today: history.filter(h => new Date(h.createdAt) >= today).length,
        thisWeek: history.filter(h => new Date(h.createdAt) >= thisWeek).length,
        thisMonth: history.filter(h => new Date(h.createdAt) >= thisMonth).length,
        uniqueVideos: new Set(history.map(h => h.videoId)).size,
        uniqueAuthors: new Set(history.map(h => h.author)).size
      };

      return stats;
    } catch (error) {
      console.error('Get history stats error:', error);
      throw new Error('Failed to get history stats');
    }
  }

  async export(format = 'json') {
    try {
      const history = await this.getAll({ sortBy: 'date' });

      if (format === 'json') {
        return JSON.stringify(history, null, 2);
      } else if (format === 'csv') {
        const headers = ['id', 'videoId', 'url', 'title', 'cover', 'downloadUrl', 'author', 'createdAt'];
        const rows = history.map(h => headers.map(header => `"${h[header] || ''}"`).join(','));
        return [headers.join(','), ...rows].join('\n');
      }

      throw new Error('Unsupported format');
    } catch (error) {
      console.error('Export history error:', error);
      throw new Error('Failed to export history');
    }
  }
}

module.exports = new HistoryService();
