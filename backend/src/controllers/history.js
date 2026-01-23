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

      // Calculate all stats in a single pass
      let todayCount = 0;
      let thisWeekCount = 0;
      let thisMonthCount = 0;
      const videoIds = new Set();
      const authors = new Set();

      for (const item of history) {
        const createdAt = new Date(item.createdAt);
        
        if (createdAt >= today) todayCount++;
        if (createdAt >= thisWeek) thisWeekCount++;
        if (createdAt >= thisMonth) thisMonthCount++;
        
        videoIds.add(item.videoId);
        authors.add(item.author);
      }

      const stats = {
        total: history.length,
        today: todayCount,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        uniqueVideos: videoIds.size,
        uniqueAuthors: authors.size
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
