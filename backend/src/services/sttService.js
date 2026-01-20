const axios = require('axios');

class STTService {
  constructor() {
    this.apiBase = 'https://dashscope.aliyuncs.com/api/v1';
    this.defaultTimeout = 120000;
  }

  async extractText(videoUrl, apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('阿里云百炼 API Key (DASHSCOPE_API_KEY) 不能为空');
    }

    if (!videoUrl) {
      throw new Error('视频 URL 不能为空');
    }

    try {
      console.log('开始提交转写任务...');
      const taskInfo = await this.submitTranscriptionTask(apiKey, videoUrl, options);
      console.log('任务已提交, task_id:', taskInfo.taskId);

      console.log('等待转写完成...');
      const result = await this.waitForCompletion(apiKey, taskInfo.taskId);

      return {
        success: true,
        text: result.text || '',
        duration: result.duration || 0,
        language: result.language || 'zh'
      };
    } catch (error) {
      console.error('STT error:', error);
      throw new Error(`语音识别失败: ${error.message}`);
    }
  }

  async submitTranscriptionTask(apiKey, videoUrl, options = {}) {
    const model = options.model || 'paraformer-v2';
    const languageHints = options.languageHints || ['zh', 'en'];

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    };

    const data = {
      model: model,
      input: {
        file_urls: [videoUrl]
      },
      parameters: {
        language_hints: languageHints,
        channel_id: [0]
      }
    };

    const response = await axios.post(
      `${this.apiBase}/services/audio/asr/transcription`,
      data,
      { headers, timeout: 30000 }
    );

    if (response.status !== 200) {
      throw new Error(`提交任务失败: ${response.status} ${response.statusText}`);
    }

    const output = response.data.output;
    return {
      taskId: output.task_id,
      status: output.task_status
    };
  }

  async waitForCompletion(apiKey, taskId, maxWaitTime = 300000) {
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.queryTaskStatus(apiKey, taskId);

      if (status.taskStatus === 'SUCCEEDED') {
        console.log('转写任务完成');
        return await this.getTranscriptionResult(apiKey, taskId);
      } else if (status.taskStatus === 'FAILED') {
        throw new Error(`转写任务失败: ${status.errorMessage || '未知错误'}`);
      } else if (status.taskStatus === 'RUNNING' || status.taskStatus === 'PENDING') {
        console.log(`任务状态: ${status.taskStatus}, 继续等待...`);
        await this.sleep(pollInterval);
      } else {
        console.log(`未知任务状态: ${status.taskStatus}, 继续等待...`);
        await this.sleep(pollInterval);
      }
    }

    throw new Error('转写任务等待超时');
  }

  async queryTaskStatus(apiKey, taskId) {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(
      `${this.apiBase}/tasks/${taskId}`,
      {},
      { headers, timeout: 10000 }
    );

    if (response.status !== 200) {
      throw new Error(`查询任务状态失败: ${response.status}`);
    }

    const output = response.data.output;
    return {
      taskId: output.task_id,
      taskStatus: output.task_status,
      errorCode: output.code,
      errorMessage: output.message
    };
  }

  async getTranscriptionResult(apiKey, taskId) {
    const status = await this.queryTaskStatus(apiKey, taskId);

    if (status.taskStatus !== 'SUCCEEDED') {
      throw new Error(`任务未完成, 状态: ${status.taskStatus}`);
    }

    const response = await axios.post(
      `${this.apiBase}/tasks/${taskId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const output = response.data.output;
    const results = output.results;

    if (!results || results.length === 0) {
      throw new Error('未找到转写结果');
    }

    const firstResult = results[0];
    
    if (firstResult.subtask_status !== 'SUCCEEDED') {
      throw new Error(`子任务失败: ${firstResult.message || '未知错误'}`);
    }

    if (!firstResult.transcription_url) {
      throw new Error('转写结果 URL 为空');
    }

    const transcriptUrl = firstResult.transcription_url;

    const transcriptResponse = await axios.get(transcriptUrl, { timeout: 30000 });
    const transcriptData = transcriptResponse.data;

    return this.parseTranscriptionResult(transcriptData);
  }

  parseTranscriptionResult(data) {
    let text = '';
    let duration = 0;
    let language = 'zh';

    if (data.transcripts && Array.isArray(data.transcripts) && data.transcripts.length > 0) {
      const transcript = data.transcripts[0];
      
      if (transcript.text) {
        text = transcript.text;
      }

      if (transcript.content_duration_in_milliseconds) {
        duration = Math.round(transcript.content_duration_in_milliseconds / 1000);
      }

      if (transcript.channel_id !== undefined) {
        language = this.detectLanguage(data, transcript.channel_id);
      }
    }

    return {
      text: text,
      duration: duration,
      language: language
    };
  }

  detectLanguage(data, channelId) {
    if (data.properties && data.properties.channels) {
      const channel = data.properties.channels.find(c => c.channel_id === channelId);
      if (channel && channel.channel_language) {
        return channel.channel_language;
      }
    }
    return 'zh';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkApiKey(apiKey) {
    if (!apiKey || apiKey.length < 10) {
      return { valid: false, message: 'API Key 格式不正确' };
    }

    try {
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${this.apiBase}/services/audio/asr/transcription`,
        {
          model: 'paraformer-v2',
          input: { file_urls: ['https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav'] }
        },
        { headers, timeout: 10000 }
      );

      if (response.status === 200) {
        return { valid: true, message: 'API Key 有效' };
      } else {
        return { valid: false, message: 'API Key 验证失败' };
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { valid: false, message: 'API Key 无效或已过期' };
      }
      return { valid: false, message: error.response?.data?.message || '验证失败' };
    }
  }

  async getSupportedLanguages() {
    return [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'yue', name: '粤语' },
      { code: 'de', name: 'Deutsch' },
      { code: 'fr', name: 'Français' },
      { code: 'ru', name: 'Русский' }
    ];
  }
}

module.exports = new STTService();
