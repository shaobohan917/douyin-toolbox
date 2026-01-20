const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ConfigService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, 'config.json');
    this.defaultConfig = {
      dashscopeApiKey: '',
      maxHistoryItems: 100,
      autoSaveHistory: true,
      theme: 'light',
      language: 'zh-CN'
    };
    this.initDataDir();
  }
    };
    this.init();
  }

  init() {
    fs.ensureDirSync(this.dataDir);
    if (!fs.existsSync(this.filePath)) {
      fs.writeJsonSync(this.filePath, this.defaultConfig, { spaces: 2 });
    }
  }

  async get(key = null) {
    try {
      let config = fs.readJsonSync(this.filePath);

      delete config.aliyunApiKey;
      delete config.openaiApiKey;
      delete config.DOUYIN_API_KEY;

      if (key) {
        const keys = key.split('.');
        for (const k of keys) {
          if (!config || !config[k]) {
            return null;
          }
          config = config[k];
        }
        return config;
      }

      const result = { ...config };
      delete result.aliyunApiKey;
      delete result.openaiApiKey;
      delete result.DOUYIN_API_KEY;

      return result;
    } catch (error) {
      console.error('Get config error:', error);
      if (key) return null;
      return this.defaultConfig;
    }
  }

  async set(key, value) {
    try {
      let config = fs.readJsonSync(this.filePath);

      const keys = key.split('.');
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      fs.writeJsonSync(this.filePath, config, { spaces: 2 });

      return { success: true };
    } catch (error) {
      console.error('Set config error:', error);
      throw new Error('Failed to set config');
    }
  }

  async update(updates) {
    try {
      let config = fs.readJsonSync(this.filePath);

      config = { ...config, ...updates };

      delete config.aliyunApiKey;
      delete config.openaiApiKey;
      delete config.DOUYIN_API_KEY;

      fs.writeJsonSync(this.filePath, config, { spaces: 2 });

      return config;
    } catch (error) {
      console.error('Update config error:', error);
      throw new Error('Failed to update config');
    }
  }

  async reset() {
    try {
      fs.writeJsonSync(this.filePath, this.defaultConfig, { spaces: 2 });
      return this.defaultConfig;
    } catch (error) {
      console.error('Reset config error:', error);
      throw new Error('Failed to reset config');
    }
  }

  async delete(key) {
    try {
      let config = fs.readJsonSync(this.filePath);

      const keys = key.split('.');
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          return { success: false, error: 'Key not found' };
        }
        current = current[keys[i]];
      }

      delete current[keys[keys.length - 1]];

      fs.writeJsonSync(this.filePath, config, { spaces: 2 });

      return { success: true };
    } catch (error) {
      console.error('Delete config error:', error);
      throw new Error('Failed to delete config');
    }
  }

  async getAliyunApiKey() {
    const config = await this.get();
    return config?.aliyunApiKey || '';
  }

  async setAliyunApiKey(apiKey) {
    return await this.set('aliyunApiKey', apiKey);
  }

  async validateAliyunApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, error: 'API key is required' };
    }

    if (!apiKey.startsWith('sk-')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    return { valid: true };
  }

  async exportConfig() {
    const config = await this.get();
    return JSON.stringify(config, null, 2);
  }

  async importConfig(configJson) {
    try {
      const config = JSON.parse(configJson);
      fs.writeJsonSync(this.filePath, config, { spaces: 2 });
      return config;
    } catch (error) {
      console.error('Import config error:', error);
      throw new Error('Invalid config format');
    }
  }
}

module.exports = new ConfigService();
