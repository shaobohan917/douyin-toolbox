const fs = require('fs-extra');
const path = require('path');

class ConfigController {
  constructor() {
    this.configFile = path.join(__dirname, '../../data/config.json');
    this.defaultConfig = {
      dashscopeApiKey: '',
      maxHistoryItems: 100,
      autoSaveHistory: true,
      theme: 'light',
      language: 'zh-CN'
    };
    this.initDataDir();
  }

  initDataDir() {
    const dataDir = path.dirname(this.configFile);
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(this.configFile)) {
      fs.writeJsonSync(this.configFile, this.defaultConfig);
    }
  }

  async getConfig(ctx) {
    try {
      let config = fs.readJsonSync(this.configFile);

      delete config.openaiApiKey;
      delete config.DOUYIN_API_KEY;

      // 如果配置文件中的 dashscopeApiKey 为空，则从环境变量读取
      if (!config.dashscopeApiKey && process.env.DASHSCOPE_API_KEY) {
        config.dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
      }

      if (config.dashscopeApiKey) {
        config.dashscopeApiKey = '***';
      }

      ctx.body = {
        success: true,
        message: 'Config retrieved successfully',
        data: config
      };
    } catch (error) {
      console.error('Get config error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get config',
        data: this.defaultConfig
      };
    }
  }

  async updateConfig(ctx, newConfig) {
    try {
      const currentConfig = fs.existsSync(this.configFile) 
        ? fs.readJsonSync(this.configFile) 
        : this.defaultConfig;

      delete currentConfig.openaiApiKey;
      delete currentConfig.DOUYIN_API_KEY;

      if (newConfig.dashscopeApiKey === '***') {
        newConfig.dashscopeApiKey = currentConfig.dashscopeApiKey;
      }

      delete newConfig.openaiApiKey;
      delete newConfig.DOUYIN_API_KEY;

      const updatedConfig = { ...currentConfig, ...newConfig };
      fs.writeJsonSync(this.configFile, updatedConfig);

      ctx.body = {
        success: true,
        message: 'Config updated successfully',
        data: updatedConfig
      };
    } catch (error) {
      console.error('Update config error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to update config',
        data: null
      };
    }
  }
}

module.exports = new ConfigController();
