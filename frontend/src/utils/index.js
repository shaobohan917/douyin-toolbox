export const extractDouyinUrl = (text) => {
  const urlPattern = /(https?:\/\/(?:v\.douyin\.com|www\.douyin\.com)\/[\w\-\/]+)/
  const match = text.match(urlPattern)
  return match ? match[1] : text
}

export const isValidDouyinUrl = (url) => {
  const patterns = [
    /^https?:\/\/v\.douyin\.com\/[\w\-]+/,
    /^https?:\/\/www\.douyin\.com\/video\/\d+/,
    /^https?:\/\/www\.douyin\.com\/share\/video\/\d+/,
    /^https?:\/\/www\.douyin\.com\/v\/\d+/,
    /^https?:\/\/www\.douyin\.com\/note\/\d+/
  ]
  
  return patterns.some(pattern => pattern.test(url))
}

export const extractVideoId = (url) => {
  const patterns = [
    /\/video\/(\d+)/,
    /\/v\/(\d+)/,
    /\/share\/video\/(\d+)/,
    /douyin\.com\/(\d+)/,
    /\/note\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export const formatNumber = (num) => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + 'B'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'W'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return 'Just now'
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + ' min ago'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + ' hours ago'
  } else if (diff < 604800000) {
    return Math.floor(diff / 86400000) + ' days ago'
  }
  
  return date.toLocaleDateString()
}

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    #ifdef MP-WEIXIN
    uni.setClipboardData({
      data: text,
      success: () => resolve(true),
      fail: (err) => reject(err)
    })
    #endif
    
    #ifdef H5
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      resolve(true)
    } catch (err) {
      document.body.removeChild(textarea)
      reject(err)
    }
    #endif
    
    #ifdef APP-PLUS
    uni.setClipboardData({
      data: text,
      success: () => resolve(true),
      fail: (err) => reject(err)
    })
    #endif
  })
}

export const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    #ifdef MP-WEIXIN
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => resolve(true),
            fail: reject
          })
        } else {
          reject(new Error('Download failed'))
        }
      },
      fail: reject
    })
    #endif
    
    #ifdef H5
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'video.mp4'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    resolve(true)
    #endif
    
    #ifdef APP-PLUS
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => resolve(true),
            fail: reject
          })
        } else {
          reject(new Error('Download failed'))
        }
      },
      fail: reject
    })
    #endif
  })
}

export const shareToWeChat = (options) => {
  return new Promise((resolve, reject) => {
    #ifdef MP-WEIXIN
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    resolve(true)
    #endif
    
    #ifdef APP-PLUS
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneSession',
      type: 0,
      href: options.url,
      title: options.title,
      summary: options.summary,
      imageUrl: options.imageUrl,
      success: () => resolve(true),
      fail: (err) => reject(err)
    })
    #endif
  })
}

export const showLoading = (title = 'Loading...') => {
  uni.showLoading({
    title,
    mask: true
  })
}

export const hideLoading = () => {
  uni.hideLoading()
}

export const showToast = (options) => {
  uni.showToast({
    title: options.title,
    icon: options.icon || 'none',
    duration: options.duration || 2000
  })
}

export const showModal = (options) => {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title,
      content: options.content,
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || 'Cancel',
      confirmText: options.confirmText || 'OK',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

export const getStorage = (key, defaultValue = null) => {
  try {
    const value = uni.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (e) {
    return defaultValue
  }
}

export const setStorage = (key, value) => {
  try {
    uni.setStorageSync(key, value)
    return true
  } catch (e) {
    return false
  }
}

export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}

export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

export const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
