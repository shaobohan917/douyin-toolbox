<template>
  <view class="container">
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">Video Result</text>
      <view class="more-btn">
        <text>⋯</text>
      </view>
    </view>

    <view v-if="!videoData" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">Loading...</text>
    </view>

    <view v-else class="content">
      <view class="video-player-wrapper">
        <video
          v-if="playUrl"
          class="video-player"
          :src="playUrl"
          :controls="true"
          :autoplay="false"
          object-fit="contain"
        />
        <image
          v-else
          class="video-cover"
          :src="videoData.cover"
          mode="aspectFill"
        />
      </view>

      <view class="video-details">
        <view class="video-header">
          <view class="video-info">
            <text class="video-title">{{ videoData.title }}</text>
            <view class="author-row">
              <image
                class="author-avatar"
                :src="videoData.author.avatar"
                mode="aspectFill"
              />
              <text class="author-name">@{{ videoData.author.nickname }}</text>
            </view>
          </view>
          <view class="follow-btn" @click="followAuthor">
            <text>+ Follow</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item" @click="showStats('likes')">
            <text class="stat-num">{{ formatNumber(videoData.statistics.diggCount) }}</text>
            <text class="stat-label">Likes</text>
          </view>
          <view class="stat-item" @click="showStats('comments')">
            <text class="stat-num">{{ formatNumber(videoData.statistics.commentCount) }}</text>
            <text class="stat-label">Comments</text>
          </view>
          <view class="stat-item" @click="showStats('shares')">
            <text class="stat-num">{{ formatNumber(videoData.statistics.shareCount) }}</text>
            <text class="stat-label">Shares</text>
          </view>
          <view class="stat-item" @click="showStats('collects')">
            <text class="stat-num">{{ formatNumber(videoData.statistics.collectCount) }}</text>
            <text class="stat-label">Collects</text>
          </view>
        </view>

        <view class="action-buttons">
          <view class="action-btn" @click="likeVideo">
            <text class="action-icon">👍</text>
            <text class="action-text">Like</text>
          </view>
          <view class="action-btn" @click="commentVideo">
            <text class="action-icon">💬</text>
            <text class="action-text">Comment</text>
          </view>
          <view class="action-btn" @click="collectVideo">
            <text class="action-icon">⭐</text>
            <text class="action-text">Collect</text>
          </view>
          <view class="action-btn" @click="shareVideo">
            <text class="action-icon">📤</text>
            <text class="action-text">Share</text>
          </view>
        </view>
      </view>

      <view class="download-section">
        <text class="section-title">Download</text>
        <view class="download-options">
          <view
            class="download-option"
            :class="{ active: selectedQuality === 'original' }"
            @click="selectQuality('original')"
          >
            <text>Original</text>
            <text class="quality-badge">HD</text>
          </view>
          <view
            class="download-option"
            :class="{ active: selectedQuality === '1080p' }"
            @click="selectQuality('1080p')"
          >
            <text>1080P</text>
          </view>
          <view
            class="download-option"
            :class="{ active: selectedQuality === '720p' }"
            @click="selectQuality('720p')"
          >
            <text>720P</text>
          </view>
        </view>
        <button class="download-btn" :loading="isDownloading" @click="startDownload">
          <text v-if="!isDownloading">Download Video</text>
          <text v-else>Downloading... {{ downloadProgress }}%</text>
        </button>
      </view>

      <view class="link-section">
        <text class="section-title">Share Link</text>
        <view class="link-card">
          <text class="link-text">{{ videoData.downloadUrl }}</text>
          <view class="copy-btn" @click="copyLink">
            <text>Copy</text>
          </view>
        </view>
      </view>

      <view class="ai-section" v-if="showAIFeatures">
        <text class="section-title">AI Features</text>
        <view class="ai-features">
          <view class="ai-feature" @click="extractText">
            <text class="ai-icon">📝</text>
            <text class="ai-text">Extract Text</text>
          </view>
          <view class="ai-feature" @click="generateSummary">
            <text class="ai-icon">📋</text>
            <text class="ai-text">Summary</text>
          </view>
          <view class="ai-feature" @click="translateText">
            <text class="ai-icon">🌐</text>
            <text class="ai-text">Translate</text>
          </view>
        </view>
        <view v-if="extractedText" class="ai-result">
          <text class="ai-result-title">Result</text>
          <scroll-view scroll-y class="ai-result-content">
            <text>{{ extractedText }}</text>
          </scroll-view>
          <view class="ai-result-actions">
            <view class="ai-action-btn" @click="copyExtractedText">
              <text>Copy</text>
            </view>
            <view class="ai-action-btn" @click="shareExtractedText">
              <text>Share</text>
            </view>
          </view>
        </view>
      </view>

      <view class="related-section" v-if="relatedVideos.length > 0">
        <text class="section-title">Related Videos</text>
        <scroll-view scroll-x class="related-scroll">
          <view class="related-list">
            <view
              v-for="video in relatedVideos"
              :key="video.id"
              class="related-item"
              @click="openRelatedVideo(video)"
            >
              <image
                class="related-cover"
                :src="video.cover"
                mode="aspectFill"
              />
              <view class="related-info">
                <text class="related-title">{{ truncate(video.title, 30) }}</text>
                <text class="related-author">@{{ video.author.nickname }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api/index.js'
import {
  showToast,
  copyToClipboard,
  downloadFile,
  shareToWeChat,
  formatNumber,
  formatDuration
} from '@/utils/index.js'

const videoId = ref('')
const videoData = ref(null)
const playUrl = ref('')
const selectedQuality = ref('original')
const isDownloading = ref(false)
const downloadProgress = ref(0)
const showAIFeatures = ref(true)
const extractedText = ref('')
const relatedVideos = ref([])

onLoad((options) => {
  if (options.videoId) {
    videoId.value = options.videoId
    loadVideoData()
  }
  if (options.url) {
    parseUrl(options.url)
  }
})

onMounted(() => {
  checkSavedVideo()
})

async function loadVideoData() {
  try {
    const saved = uni.getStorageSync('current_video')
    if (saved && saved.id === videoId.value) {
      videoData.value = saved
      playUrl.value = saved.playUrl || saved.downloadUrl
      loadRelatedVideos()
      return
    }

    const history = uni.getStorageSync('video_history') || []
    const found = history.find(h => h.videoId === videoId.value)
    if (found) {
      videoData.value = found
      playUrl.value = found.playUrl || found.downloadUrl
      loadRelatedVideos()
      return
    }

    showToast({ title: 'Video not found' })
  } catch (err) {
    console.error('Load video error:', err)
  }
}

async function parseUrl(url) {
  try {
    const res = await api.parseVideo(url)
    if (res.success) {
      videoData.value = res.data
      playUrl.value = res.data.playUrl || res.data.downloadUrl
      uni.setStorageSync('current_video', res.data)
      loadRelatedVideos()
    } else {
      showToast({ title: res.message || 'Failed to parse video' })
    }
  } catch (err) {
    console.error('Parse error:', err)
    showToast({ title: 'Failed to parse video' })
  }
}

function checkSavedVideo() {
  try {
    const saved = uni.getStorageSync('current_video')
    if (saved) {
      videoData.value = saved
      playUrl.value = saved.playUrl || saved.downloadUrl
      loadRelatedVideos()
    }
  } catch (err) {
    console.error('Check saved video error:', err)
  }
}

function goBack() {
  uni.navigateBack()
}

function selectQuality(quality) {
  selectedQuality.value = quality
}

async function startDownload() {
  if (!videoData.value) return

  isDownloading.value = true
  downloadProgress.value = 0

  try {
    const filename = `douyin_${videoData.value.id}_${selectedQuality.value}.mp4`

    uni.showLoading({ title: 'Downloading...' })

    await downloadFile(videoData.value.downloadUrl, filename)

    uni.hideLoading()
    showToast({ title: 'Download complete!' })
  } catch (err) {
    console.error('Download error:', err)
    uni.hideLoading()
    showToast({ title: 'Download failed', icon: 'none' })
  } finally {
    isDownloading.value = false
    downloadProgress.value = 0
  }
}

async function copyLink() {
  if (!videoData.value) return

  try {
    await copyToClipboard(videoData.value.downloadUrl)
    showToast({ title: 'Link copied!' })
  } catch (err) {
    showToast({ title: 'Failed to copy', icon: 'none' })
  }
}

async function likeVideo() {
  showToast({ title: 'Liked!' })
}

async function commentVideo() {
  uni.showModal({
    title: 'Comments',
    content: 'Comments feature coming soon',
    showCancel: false
  })
}

async function collectVideo() {
  showToast({ title: 'Collected!' })
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
    copyLink()
  }
}

async function followAuthor() {
  showToast({ title: 'Following!' })
}

function showStats(type) {
  uni.showModal({
    title: 'Statistics',
    content: `${type}: ${formatNumber(videoData.value?.statistics?.[`${type}Count`] || 0)}`,
    showCancel: false
  })
}

async function extractText() {
  if (!videoData.value) return

  try {
    const configRes = await api.getConfig()
    const apiKey = configRes.data?.aliyunApiKey

    if (!apiKey) {
      showToast({ title: 'Please configure API key in Settings' })
      return
    }

    uni.showLoading({ title: 'Extracting...' })

    const res = await api.extractText(videoData.value.downloadUrl, apiKey)

    uni.hideLoading()

    if (res.success) {
      extractedText.value = res.data.text || 'No text detected'
      showToast({ title: 'Text extracted!' })
    } else {
      showToast({ title: res.message || 'Extraction failed' })
    }
  } catch (err) {
    console.error('Extract error:', err)
    uni.hideLoading()
    showToast({ title: 'Failed to extract text', icon: 'none' })
  }
}

async function generateSummary() {
  showToast({ title: 'Summary feature coming soon' })
}

async function translateText() {
  if (!extractedText.value) {
    showToast({ title: 'Please extract text first', icon: 'none' })
    return
  }
  showToast({ title: 'Translation feature coming soon' })
}

async function copyExtractedText() {
  if (!extractedText.value) return

  try {
    await copyToClipboard(extractedText.value)
    showToast({ title: 'Copied!' })
  } catch (err) {
    showToast({ title: 'Failed to copy', icon: 'none' })
  }
}

async function shareExtractedText() {
  if (!extractedText.value) return

  try {
    await shareToWeChat({
      title: 'Extracted Text',
      summary: extractedText.value.slice(0, 100)
    })
  } catch (err) {
    copyExtractedText()
  }
}

function truncate(str, length) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

function loadRelatedVideos() {
  const history = uni.getStorageSync('video_history') || []
  const related = history
    .filter(h => h.id !== videoData.value?.id)
    .slice(0, 10)
  relatedVideos.value = related
}

function openRelatedVideo(video) {
  uni.setStorageSync('current_video', video)
  videoData.value = video
  playUrl.value = video.playUrl || video.downloadUrl
  videoId.value = video.id
  loadRelatedVideos()
}

defineExpose({
  loadVideoData,
  startDownload,
  copyLink,
  shareVideo
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;

  .back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .back-icon {
      font-size: 40rpx;
      color: #333;
    }
  }

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }

  .more-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 40rpx;
      color: #333;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx;

  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid #f5f5f5;
    border-top-color: #FF2E4D;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content {
  padding: 20rpx;
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  height: 500rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #000;

  .video-player {
    width: 100%;
    height: 100%;
  }

  .video-cover {
    width: 100%;
    height: 100%;
  }
}

.video-details {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 20rpx;

  .video-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30rpx;

    .video-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
      line-height: 1.5;
      flex: 1;
      margin-right: 20rpx;
    }

    .follow-btn {
      padding: 12rpx 32rpx;
      background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
      border-radius: 32rpx;

      text {
        color: #fff;
        font-size: 26rpx;
        font-weight: 500;
      }
    }
  }

  .author-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;

    .author-avatar {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
    }

    .author-name {
      font-size: 26rpx;
      color: #666;
    }
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;
    padding: 20rpx 0;
    border-top: 1rpx solid #f5f5f5;
    border-bottom: 1rpx solid #f5f5f5;
    margin-bottom: 30rpx;

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

  .action-buttons {
    display: flex;
    justify-content: space-around;

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16rpx;

      .action-icon {
        font-size: 40rpx;
        margin-bottom: 8rpx;
      }

      .action-text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}

.download-section,
.link-section,
.ai-section,
.related-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 20rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
  }
}

.download-options {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;

  .download-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s;

    &.active {
      border-color: #FF2E4D;
      background: rgba(255, 46, 77, 0.1);
    }

    text {
      font-size: 28rpx;
      color: #333;
    }

    .quality-badge {
      font-size: 20rpx;
      color: #FF2E4D;
      margin-top: 4rpx;
    }
  }
}

.download-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;

  &:active {
    opacity: 0.85;
  }
}

.link-card {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;

  .link-text {
    flex: 1;
    font-size: 24rpx;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 20rpx;
  }

  .copy-btn {
    padding: 12rpx 32rpx;
    background: #FF2E4D;
    border-radius: 8rpx;

    text {
      color: #fff;
      font-size: 26rpx;
    }
  }
}

.ai-features {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;

  .ai-feature {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx;
    background: #f5f5f5;
    border-radius: 12rpx;

    .ai-icon {
      font-size: 40rpx;
      margin-bottom: 12rpx;
    }

    .ai-text {
      font-size: 26rpx;
      color: #333;
    }
  }
}

.ai-result {
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx;

  .ai-result-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
  }

  .ai-result-content {
    max-height: 300rpx;

    text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
    }
  }

  .ai-result-actions {
    display: flex;
    gap: 20rpx;
    margin-top: 20rpx;

    .ai-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16rpx;
      background: #FF2E4D;
      border-radius: 8rpx;

      text {
        color: #fff;
        font-size: 26rpx;
      }
    }
  }
}

.related-scroll {
  white-space: nowrap;

  .related-list {
    display: inline-flex;
    gap: 20rpx;
  }

  .related-item {
    width: 280rpx;
    flex-shrink: 0;
    background: #f5f5f5;
    border-radius: 12rpx;
    overflow: hidden;

    .related-cover {
      width: 100%;
      height: 200rpx;
    }

    .related-info {
      padding: 16rpx;

      .related-title {
        font-size: 26rpx;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }

      .related-author {
        font-size: 22rpx;
        color: #999;
        margin-top: 4rpx;
        display: block;
      }
    }
  }
}
</style>
