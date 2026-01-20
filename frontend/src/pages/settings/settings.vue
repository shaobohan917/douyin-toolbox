<template>
  <view class="container">
    <view class="card">
      <text class="card-title">Alibaba Cloud Bailian API</text>
      <text class="card-desc">Required for speech-to-text feature</text>
      
      <view class="input-group">
        <text class="input-label">API Key</text>
        <input 
          class="input-field" 
          type="text" 
          v-model="apiKey" 
          placeholder="sk-xxxxxxxxxxxx"
          password
        />
      </view>
      
      <view class="api-status" :class="{ connected: isApiConnected }">
        <text>{{ isApiConnected ? '✓ Connected' : '○ Not connected' }}</text>
      </view>
      
      <button 
        class="save-btn" 
        :loading="isSaving"
        @click="saveApiKey"
      >
        Save API Key
      </button>
    </view>

    <view class="card">
      <text class="card-title">About</text>
      <view class="about-info">
        <view class="info-row">
          <text class="info-label">Version</text>
          <text class="info-value">1.0.0</text>
        </view>
        <view class="info-row">
          <text class="info-label">Developer</text>
          <text class="info-value">Douyin Toolbox Team</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">Features</text>
      <view class="features-list">
        <view class="feature-item">
          <text class="feature-icon">🎬</text>
          <text class="feature-text">Parse Douyin videos</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🚫💧</text>
          <text class="feature-text">Remove watermarks</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">📝</text>
          <text class="feature-text">Extract video text (AI)</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">💾</text>
          <text class="feature-text">History management</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">📤</text>
          <text class="feature-text">Share to WeChat</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">Support</text>
      <text class="support-desc">For issues or feature requests, please contact us.</text>
      <button class="contact-btn" @click="contactSupport">
        Contact Support
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from '@/utils/index.js'

const apiKey = ref('')
const isApiConnected = ref(false)
const isSaving = ref(false)

onMounted(() => {
  loadConfig()
})

async function loadConfig() {
  try {
    const savedKey = uni.getStorageSync('aliyun_api_key')
    if (savedKey) {
      apiKey.value = savedKey
      isApiConnected.value = true
    }
  } catch (e) {
    console.error('Load config error:', e)
  }
}

async function saveApiKey() {
  if (!apiKey.value.trim()) {
    showToast({ title: 'Please enter API key' })
    return
  }

  if (!apiKey.value.startsWith('sk-')) {
    showToast({ title: 'Invalid API key format' })
    return
  }

  isSaving.value = true

  try {
    uni.setStorageSync('aliyun_api_key', apiKey.value)
    isApiConnected.value = true
    showToast({ title: 'Saved successfully!' })
  } catch (e) {
    console.error('Save config error:', e)
    showToast({ title: 'Failed to save', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

function contactSupport() {
  uni.showModal({
    title: 'Contact Support',
    content: 'Email: support@douyin-toolbox.com',
    showCancel: false,
    confirmText: 'OK'
  })
}

defineExpose({
  loadConfig
})
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
    display: block;
  }
  
  .card-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 24rpx;
    display: block;
  }
}

.input-group {
  margin-bottom: 24rpx;
  
  .input-label {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .input-field {
    width: 100%;
    height: 88rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
}

.api-status {
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #999;
  
  &.connected {
    background: rgba(7, 193, 96, 0.1);
    color: #07c160;
  }
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  
  &:active {
    opacity: 0.85;
  }
}

.about-info {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 28rpx;
      color: #666;
    }
    
    .info-value {
      font-size: 28rpx;
      color: #333;
    }
  }
}

.features-list {
  .feature-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 0;
    
    .feature-icon {
      font-size: 32rpx;
    }
    
    .feature-text {
      font-size: 28rpx;
      color: #333;
    }
  }
}

.support-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 24rpx;
  display: block;
}

.contact-btn {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  
  &:active {
    background: #eee;
  }
}
</style>
