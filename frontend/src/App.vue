<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
  initApp()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

function initApp() {
  const token = uni.getStorageSync('access_token')
  if (!token) {
    uni.setStorageSync('access_token', generateToken())
  }
  
  const history = uni.getStorageSync('video_history')
  if (!history) {
    uni.setStorageSync('video_history', [])
  }
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
</script>

<style lang="scss">
@import 'uview-plus/index.scss';

page {
  background-color: #f8f8f8;
  font-size: 28rpx;
  color: #333;
}

.container {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #FF2E4D, #FF6B8A);
  color: #fff;
  border-radius: 44rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  border: none;
  
  &:active {
    opacity: 0.8;
  }
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border-radius: 44rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  border: none;
  
  &:active {
    background: #eee;
  }
}

.btn-outline {
  background: transparent;
  color: #FF2E4D;
  border: 2rpx solid #FF2E4D;
  border-radius: 44rpx;
  padding: 22rpx 46rpx;
  font-size: 30rpx;
  
  &:active {
    background: rgba(255, 46, 77, 0.1);
  }
}

.input-field {
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx 30rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  &:focus {
    border-color: #FF2E4D;
    background: #fff;
  }
}

.text-primary {
  color: #FF2E4D;
}

.text-success {
  color: #07c160;
}

.text-warning {
  color: #ff976a;
}

.text-gray {
  color: #999;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-10 {
  gap: 20rpx;
}

.gap-20 {
  gap: 40rpx;
}

.mt-10 {
  margin-top: 20rpx;
}

.mt-20 {
  margin-top: 40rpx;
}

.mb-10 {
  margin-bottom: 20rpx;
}

.mb-20 {
  margin-bottom: 40rpx;
}

.p-20 {
  padding: 40rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  text {
    color: #999;
    font-size: 28rpx;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60rpx;
}

.success-badge {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 16rpx;
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.error-badge {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 16rpx;
  background: rgba(255, 46, 77, 0.1);
  color: #FF2E4D;
  border-radius: 8rpx;
  font-size: 24rpx;
}
</style>
