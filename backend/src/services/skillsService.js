const { spawn } = require('child_process');
const path = require('path');

class SkillsService {
  constructor() {
    this.skillsPath = path.join(__dirname, '../../skills');
    this.pythonCmd = process.env.PYTHON_CMD || 'python3';
  }

  /**
   * Analyze video content using Skills library
   * @param {string} videoId - Video ID
   * @param {string} title - Video title
   * @param {Array<string>} tags - Video tags (optional)
   * @param {string} audioText - Audio transcription text (optional)
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeVideo(videoId, title, tags = null, audioText = null) {
    return new Promise((resolve, reject) => {
      try {
        // Escape special characters in strings
        const escapedTitle = this.escapeString(title);
        const escapedAudioText = audioText ? this.escapeString(audioText) : 'None';
        const tagsJson = tags ? JSON.stringify(tags) : 'None';

        // Python script to execute
        const script = `
import sys
sys.path.insert(0, '${this.skillsPath}')
from skills.douyin.video_summarizer import analyze_video
import json

result = analyze_video(
    video_id="${videoId}",
    title="${escapedTitle}",
    tags=${tagsJson},
    audio_text=${escapedAudioText}
)
print(result.to_json())
        `;

        const pythonProcess = spawn(this.pythonCmd, ['-c', script]);

        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output.trim());
              resolve(result);
            } catch (e) {
              console.error('Failed to parse Python output:', e);
              console.error('Output:', output);
              reject(new Error('Failed to parse analysis result'));
            }
          } else {
            console.error('Python script failed with code:', code);
            console.error('Error:', error);
            reject(new Error(error || 'Python script execution failed'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(new Error(`Failed to start Python: ${err.message}`));
        });
      } catch (error) {
        console.error('SkillsService error:', error);
        reject(new Error(`Analysis failed: ${error.message}`));
      }
    });
  }

  /**
   * Escape special characters for Python string
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeString(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}

module.exports = new SkillsService();