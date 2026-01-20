<template>
  <view class="container">
    <view v-if="historyList.length === 0" class="empty-state">
      <image src="/static/images/empty-history.png" mode="aspectFit" />
      <text>No history yet</text>
      <text class="empty-sub">Parsed videos will appear here</text>
    </view>

    <view v-else class="history-list">
      <view 
        v-for="item in historyList" 
        :key="item.id" 
        class="history-item"
        @click="openVideo(item)"
      >
        <image 
          class="history-cover" 
          :src="item.cover" 
          mode="aspectFill"
        />
        <view class="history-info">
          <text class="history-title">{{ item.title }}</text>
          <text class="history-author">@{{ item.author }}</text>
          <text class="history-time">{{ formatTime(item.createdAt) }}</text>
        </view>
        <view class="history-actions">
          <view class="action-icon" @click.stop="copyLink(item)">
            <text>📋</text>
          </view>
          <view class="action-icon" @click.stop="deleteItem(item)">
            <text>🗑️</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="historyList.length > 0" class="clear-btn-wrapper">
      <button class="clear-btn" @click="clearAllHistory">
        Clear History
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showModal, copyToClipboard } from '@/utils/index.js'

const historyList = ref([])

onMounted(() => {
  loadHistory()
})

function loadHistory() {
  try {
    const history = uni.getStorageSync('video_history') || []
    historyList.value = history
  } catch (e) {
    console.error('Load history error:', e)
    historyList.value = []
  }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago'
  
  return date.toLocaleDateString()
}

async function openVideo(item) {
  uni.setStorageSync('current_video', item)
  uni.navigateTo({
    url: `/pages/index/index?videoId=${item.videoId}`
  })
}

async function copyLink(item) {
  try {
    await copyToClipboard(item.downloadUrl)
    showToast({ title: 'Copied!' })
  } catch (err) {
    showToast({ title: 'Failed to copy', icon: 'none' })
  }
}

async function deleteItem(item) {
  const confirmed = await showModal({
    title: 'Delete',
    content: 'Remove this from history?',
    showCancel: true
  })
  
  if (confirmed) {
    try {
      const history = uni.getStorageSync('video_history') || []
      const filtered = history.filter(h => h.id !== item.id)
      uni.setStorageSync('video_history', filtered)
      historyList.value = filtered
      showToast({ title: 'Deleted' })
    } catch (e) {
      console.error('Delete error:', e)
    }
  }
}

async function clearAllHistory() {
  const confirmed = await showModal({
    title: 'Clear History',
    content: 'This will delete all history. Continue?',
    showCancel: true
  })
  
  if (confirmed) {
    try {
      uni.removeStorageSync('video_history')
      historyList.value = []
      showToast({ title: 'Cleared' })
    } catch (e) {
      console.error('Clear error:', e)
    }
  }
}

function onPullDownRefresh() {
  loadHistory()
  uni.stopPullDownRefresh()
}

defineExpose({
  loadHistory,
  onPullDownRefresh
})
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  
  image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 40rpx;
  }
  
  text {
    color: #999;
    font-size: 28rpx;
  }
  
  .empty-sub {
    font-size: 24rpx;
    margin-top: 16rpx;
    color: #ccc;
  }
}

.history-list {
  .history-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    
    .history-cover {
      width: 160rpx;
      height: 120rpx;
      border-radius: 12rpx;
      flex-shrink: 0;
    }
    
    .history-info {
      flex: 1;
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      min-width: 0;
      
      .history-title {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .history-author {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      
      .history-time {
        font-size: 22rpx;
        color: #ccc;
      }
    }
    
    .history-actions {
      display: flex;
      gap: 20rpx;
      margin-left: 20rpx;
      
      .action-icon {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 50%;
        
        text {
          font-size: 28rpx;
        }
        
        &:active {
          background: #eee;
        }
      }
    }
  }
}

.clear-btn-wrapper {
  padding: 40rpx 0;
  
  .clear-btn {
    width: 100%;
    height: 88rpx;
    background: #f5f5f5;
    color: #FF2E4D;
    border: 2rpx solid #FF2E4D;
    border-radius: 44rpx;
    font-size: 30rpx;
    
    &:active {
      background: rgba(255, 46, 77, 0.1);
    }
  }
}
</style>
