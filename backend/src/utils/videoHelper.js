/**
 * Video Helper Utility Functions
 * Unified functions for video ID extraction and watermark removal
 */

/**
 * Extract video ID from Douyin URL
 * @param {string} url - Douyin video URL
 * @returns {string|null} Video ID or null if not found
 */
function extractVideoId(url) {
  const patterns = [
    /\/video\/(\d+)/,
    /\/v\/(\d+)/,
    /\/share\/video\/(\d+)/,
    /douyin\.com\/(\d+)/,
    /iesdouyin\.com\/share\/video\/(\d+)/,
    /note\/(\d+)/,
    /v\.douyin\.com\/([a-zA-Z0-9\-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Remove watermark from video URL
 * @param {string} url - Video URL with watermark
 * @returns {string} Video URL without watermark
 */
function removeWatermark(url) {
  if (!url) return url;
  return url.replace('playwm', 'play');
}

/**
 * Extract clean Douyin URL from text
 * @param {string} text - Text containing Douyin URL
 * @returns {string} Clean Douyin URL
 */
function extractDouyinUrl(text) {
  const urlPattern = /(https?:\/\/(?:v\.douyin\.com|www\.douyin\.com)\/[\w\-\/]+)/;
  const match = text.match(urlPattern);
  return match ? match[1] : text;
}

/**
 * Validate Douyin URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Douyin URL
 */
function isValidDouyinUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const patterns = [
    /^https?:\/\/v\.douyin\.com\/[\w\-\/]+/,
    /^https?:\/\/www\.douyin\.com\/video\/\d+/,
    /^https?:\/\/www\.douyin\.com\/note\/\d+/,
    /^https?:\/\/www\.iesdouyin\.com\/share\/video\/\d+/
  ];

  return patterns.some(pattern => pattern.test(url));
}

module.exports = {
  extractVideoId,
  removeWatermark,
  extractDouyinUrl,
  isValidDouyinUrl
};