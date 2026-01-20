const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class HistoryController {
  constructor() {
    this.historyFile = path.join(__dirname, '../../data/history.json');
    this.initDataDir();
  }

  initDataDir() {
    const dataDir = path.dirname(this.historyFile);
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(this.historyFile)) {
      fs.writeJsonSync(this.historyFile, []);
    }
  }

  async getHistory(ctx) {
    try {
      const history = fs.readJsonSync(this.historyFile);
      
      ctx.body = {
        success: true,
        message: 'History retrieved successfully',
        data: history.reverse()
      };
    } catch (error) {
      console.error('Get history error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get history',
        data: []
      };
    }
  }

  async addToHistory(ctx, item) {
    try {
      const history = fs.readJsonSync(this.historyFile);
      
      const newItem = {
        id: uuidv4(),
        ...item,
        createdAt: new Date().toISOString()
      };

      history.push(newItem);
      
      const maxItems = 100;
      const trimmedHistory = history.slice(-maxItems);
      
      fs.writeJsonSync(this.historyFile, trimmedHistory);

      ctx.body = {
        success: true,
        message: 'Added to history successfully',
        data: newItem
      };
    } catch (error) {
      console.error('Add to history error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to add to history',
        data: null
      };
    }
  }

  async deleteFromHistory(ctx, id) {
    try {
      let history = fs.readJsonSync(this.historyFile);
      history = history.filter(item => item.id !== id);
      
      fs.writeJsonSync(this.historyFile, history);

      ctx.body = {
        success: true,
        message: 'Deleted from history successfully',
        data: { id }
      };
    } catch (error) {
      console.error('Delete from history error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to delete from history',
        data: null
      };
    }
  }

  async clearHistory(ctx) {
    try {
      fs.writeJsonSync(this.historyFile, []);

      ctx.body = {
        success: true,
        message: 'History cleared successfully',
        data: null
      };
    } catch (error) {
      console.error('Clear history error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to clear history',
        data: null
      };
    }
  }

  async getStats(ctx) {
    try {
      const history = fs.readJsonSync(this.historyFile);

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

      ctx.body = {
        success: true,
        message: 'Stats retrieved successfully',
        data: stats
      };
    } catch (error) {
      console.error('Get stats error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get stats',
        data: null
      };
    }
  }
}

module.exports = new HistoryController();
