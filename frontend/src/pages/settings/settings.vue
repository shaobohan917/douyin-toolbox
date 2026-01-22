<template>
  <view class="container">
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
function contactSupport() {
  uni.showModal({
    title: 'Contact Support',
    content: 'Email: support@douyin-toolbox.com',
    showCancel: false,
    confirmText: 'OK'
  })
}
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
