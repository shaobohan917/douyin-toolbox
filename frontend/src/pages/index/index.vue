<template>
  <view class="container">
    <view class="header">
      <view class="logo-area">
        <text class="logo-text">Douyin</text>
        <text class="logo-sub">Toolbox</text>
      </view>
      <text class="header-desc">Parse videos and remove watermarks</text>
    </view>

    <view class="card input-card">
      <view class="input-wrapper">
        <input
          class="url-input"
          type="text"
          v-model="inputUrl"
          placeholder="Paste Douyin share link here..."
          confirm-type="search"
          @confirm="parseVideo"
        />
        <view 
          class="paste-btn" 
          @click="pasteFromClipboard"
        >
          <text>Paste</text>
        </view>
      </view>
      
      <view class="parse-btn-wrapper">
        <button 
          class="parse-btn" 
          :loading="isLoading"
          :disabled="isLoading || !inputUrl"
          @click="parseVideo"
        >
          <text v-if="!isLoading">Parse Video</text>
          <text v-else>Parsing...</text>
        </button>
      </view>
    </view>

    <view v-if="error" class="error-card">
      <text class="error-text">{{ error }}</text>
      <view class="close-error" @click="error = ''">
        <text>×</text>
      </view>
    </view>

    <view v-if="videoData" class="result-card">
      <view class="video-cover-wrapper">
        <image 
          class="video-cover" 
          :src="videoData.cover" 
          mode="aspectFill"
        />
        <view class="play-icon">
          <text class="play-text">▶</text>
        </view>
        <view class="duration-badge">
          <text>{{ formatDuration(videoData.duration) }}</text>
        </view>
      </view>

      <view class="video-info">
        <text class="video-title">{{ videoData.title }}</text>
        
        <view class="author-info">
          <image 
            class="author-avatar" 
            :src="videoData.author.avatar" 
            mode="aspectFill"
          />
          <text class="author-name">@{{ videoData.author.nickname }}</text>
        </view>

        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-num">{{ formatNumber(videoData.statistics.diggCount) }}</text>
            <text class="stat-label">Likes</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ formatNumber(videoData.statistics.commentCount) }}</text>
            <text class="stat-label">Comments</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ formatNumber(videoData.statistics.shareCount) }}</text>
            <text class="stat-label">Shares</text>
          </view>
        </view>
      </view>

      <view class="action-section">
        <view class="action-row">
          <button 
            class="action-btn primary" 
            @click="copyDownloadUrl"
          >
            <text>Copy Download Link</text>
          </button>
          <button 
            class="action-btn secondary" 
            @click="downloadVideo"
          >
            <text>Download</text>
          </button>
        </view>

        <view class="action-row">
          <button 
            class="action-btn outline" 
            @click="extractText"
            :loading="isExtracting"
          >
            <text>Extract Text (AI)</text>
          </button>
          <button 
            class="action-btn outline" 
            @click="shareVideo"
          >
            <text>Share</text>
          </button>
        </view>
      </view>

      <view v-if="extractedText" class="text-result">
        <view class="text-result-header">
          <text class="text-result-title">Extracted Text</text>
          <view class="copy-text-btn" @click="copyExtractedText">
            <text>Copy</text>
          </view>
        </view>
        <scroll-view scroll-y class="text-content">
          <text>{{ extractedText }}</text>
        </scroll-view>
      </view>
    </view>

    <view v-if="!videoData && !isLoading" class="tips-card">
      <text class="tips-title">How to use</text>
      <view class="tips-list">
        <view class="tip-item">
          <text class="tip-num">1</text>
          <text class="tip-text">Open Douyin and copy the share link</text>
        </view>
        <view class="tip-item">
          <text class="tip-num">2</text>
          <text class="tip-text">Paste the link above and tap Parse</text>
        </view>
        <view class="tip-item">
          <text class="tip-num">3</text>
          <text class="tip-text">Copy the watermark-free link or download</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/api/index.js'
import {
  isValidDouyinUrl,
  extractDouyinUrl,
  showToast,
  copyToClipboard,
  downloadFile,
  shareToWeChat,
  formatNumber,
  formatDuration
} from '@/utils/index.js'

const inputUrl = ref('')
const videoData = ref(null)
const isLoading = ref(false)
const isExtracting = ref(false)
const error = ref('')
const extractedText = ref('')

async function parseVideo() {
  if (!inputUrl.value.trim()) {
    showToast({ title: 'Please enter a URL' })
    return
  }

  // Extract clean URL from text
  const cleanUrl = extractDouyinUrl(inputUrl.value)

  if (!isValidDouyinUrl(cleanUrl)) {
    error.value = 'Invalid Douyin link. Please check and try again.'
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    const res = await api.parseVideo(cleanUrl)
    
    if (res.success) {
      videoData.value = res.data
      saveToHistory(res.data)
    } else {
      error.value = res.message || 'Failed to parse video'
    }
  } catch (err) {
    console.error('Parse error:', err)
    error.value = 'Failed to parse video. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function pasteFromClipboard() {
  try {
    #ifdef MP-WEIXIN
    uni.getClipboardData({
      success: (res) => {
        inputUrl.value = res.data
      }
    })
    #endif
    
    #ifdef H5
    const text = await navigator.clipboard.readText()
    inputUrl.value = text
    #endif
    
    #ifdef APP-PLUS
    uni.getClipboardData({
      success: (res) => {
        inputUrl.value = res.data
      }
    })
    #endif
  } catch (err) {
    showToast({ title: 'Failed to paste' })
  }
}

async function copyDownloadUrl() {
  if (!videoData.value) return
  
  try {
    await copyToClipboard(videoData.value.downloadUrl)
    showToast({ title: 'Copied to clipboard' })
  } catch (err) {
    showToast({ title: 'Failed to copy' })
  }
}

async function downloadVideo() {
  if (!videoData.value) return
  
  showToast({ title: 'Downloading...' })
  
  try {
    await downloadFile(videoData.value.downloadUrl, `douyin_${videoData.value.id}.mp4`)
    showToast({ title: 'Download complete!' })
  } catch (err) {
    console.error('Download error:', err)
    showToast({ title: 'Download failed. Please try again.' })
  }
}

async function extractText() {
  if (!videoData.value) return
  
  isExtracting.value = true
  
  try {
    const configRes = await api.getConfig()
    const apiKey = configRes.data?.dashscopeApiKey
    
    if (!apiKey) {
      showToast({ title: 'Please configure API key in Settings' })
      isExtracting.value = false
      return
    }

    const res = await api.extractText(videoData.value.downloadUrl, apiKey)
    
    if (res.success) {
      extractedText.value = res.data.text || 'No text detected'
      showToast({ title: 'Text extracted!' })
    } else {
      showToast({ title: res.message || 'Extraction failed' })
    }
  } catch (err) {
    console.error('Extract error:', err)
    showToast({ title: 'Failed to extract text' })
  } finally {
    isExtracting.value = false
  }
}

async function shareVideo() {
  if (!videoData.value) return
  
  try {
    await shareToWeChat({
      title: videoData.value.title,
      summary: `Shared from Douyin Toolbox - @${videoData.value.author.nickname}`,
      url: videoData.value.downloadUrl,
      imageUrl: videoData.value.cover
    })
  } catch (err) {
    console.error('Share error:', err)
  }
}

async function copyExtractedText() {
  if (!extractedText.value) return
  
  try {
    await copyToClipboard(extractedText.value)
    showToast({ title: 'Text copied!' })
  } catch (err) {
    showToast({ title: 'Failed to copy' })
  }
}

async function saveToHistory(data) {
  try {
    await api.addToHistory({
      url: inputUrl.value,
      videoId: data.id,
      title: data.title,
      cover: data.cover,
      downloadUrl: data.downloadUrl,
      author: data.author.nickname
    })
  } catch (err) {
    console.error('Save history error:', err)
  }
}

function onPullDownRefresh() {
  if (videoData.value) {
    parseVideo()
  } else {
    uni.stopPullDownRefresh()
  }
}

defineExpose({
  parseVideo,
  pasteFromClipboard,
  copyDownloadUrl,
  downloadVideo,
  extractText,
  shareVideo,
  formatNumber,
  formatDuration
})
</script>

<style lang="scss" scoped>
.header {
  padding: 40rpx 20rpx;
  text-align: center;
  
  .logo-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    margin-bottom: 16rpx;
    
    .logo-text {
      font-size: 56rpx;
      font-weight: bold;
      color: #FF2E4D;
    }
    
    .logo-sub {
      font-size: 40rpx;
      color: #333;
      font-weight: 500;
    }
  }
  
  .header-desc {
    font-size: 26rpx;
    color: #999;
  }
}

.input-card {
  padding: 30rpx;
}

.input-wrapper {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .url-input {
    flex: 1;
    height: 88rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s;
    
    &:focus {
      border-color: #FF2E4D;
      background: #fff;
    }
  }
  
  .paste-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 32rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    color: #666;
    font-size: 28rpx;
    
    &:active {
      background: #eee;
    }
  }
}

.parse-btn-wrapper {
  .parse-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
    color: #fff;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 500;
    
    &[disabled] {
      opacity: 0.6;
    }
    
    &:active:not([disabled]) {
      opacity: 0.85;
    }
  }
}

.error-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  background: rgba(255, 46, 77, 0.1);
  border-radius: 12rpx;
  margin: 20rpx 0;
  
  .error-text {
    flex: 1;
    color: #FF2E4D;
    font-size: 26rpx;
  }
  
  .close-error {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FF2E4D;
    font-size: 36rpx;
  }
}

.result-card {
  margin-top: 20rpx;
}

.video-cover-wrapper {
  position: relative;
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  
  .video-cover {
    width: 100%;
    height: 100%;
  }
  
  .play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100rpx;
    height: 100rpx;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .play-text {
      color: #fff;
      font-size: 40rpx;
      margin-left: 8rpx;
    }
  }
  
  .duration-badge {
    position: absolute;
    bottom: 20rpx;
    right: 20rpx;
    padding: 6rpx 16rpx;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8rpx;
    
    text {
      color: #fff;
      font-size: 24rpx;
    }
  }
}

.video-info {
  padding: 0 10rpx;
  margin-bottom: 30rpx;
  
  .video-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.5;
    margin-bottom: 20rpx;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .author-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
    
    .author-avatar {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
    }
    
    .author-name {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .stats-row {
    display: flex;
    gap: 60rpx;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .stat-num {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
      
      .stat-label {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }
  }
}

.action-section {
  margin-top: 30rpx;
  
  .action-row {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .action-btn {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 40rpx;
    font-size: 28rpx;
    border: none;
    
    &.primary {
      background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
      color: #fff;
    }
    
    &.secondary {
      background: #f5f5f5;
      color: #333;
    }
    
    &.outline {
      background: transparent;
      color: #FF2E4D;
      border: 2rpx solid #FF2E4D;
    }
    
    &:active {
      opacity: 0.8;
    }
  }
}

.text-result {
  margin-top: 30rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  
  .text-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .text-result-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
    }
    
    .copy-text-btn {
      padding: 8rpx 24rpx;
      background: #FF2E4D;
      border-radius: 8rpx;
      
      text {
        color: #fff;
        font-size: 24rpx;
      }
    }
  }
  
  .text-content {
    max-height: 300rpx;
    
    text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
    }
  }
}

.tips-card {
  margin-top: 40rpx;
  padding: 30rpx;
  
  .tips-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .tips-list {
    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 20rpx;
      margin-bottom: 20rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .tip-num {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
        color: #fff;
        border-radius: 50%;
        font-size: 24rpx;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .tip-text {
        flex: 1;
        font-size: 26rpx;
        color: #666;
        line-height: 1.5;
        padding-top: 10rpx;
      }
    }
  }
}
</style>
