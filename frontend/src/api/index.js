const BASE_URL = 'http://localhost:3000/api'

const request = (options) => {
  const token = uni.getStorageSync('access_token') || ''
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.header
      },
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          uni.showToast({
            title: 'Unauthorized',
            icon: 'none'
          })
          reject(new Error('Unauthorized'))
        } else {
          reject(new Error(res.data?.message || 'Request failed'))
        }
      },
      fail: (err) => {
        console.error('Request error:', err)
        reject(err)
      }
    })
  })
}

export const api = {
  health() {
    return request({
      url: '/health',
      method: 'GET'
    })
  },
  
  parseVideo(url) {
    return request({
      url: '/video/parse',
      method: 'POST',
      data: { url }
    })
  },
  
  getDownloadUrl(url) {
    return request({
      url: '/video/download',
      method: 'POST',
      data: { url }
    })
  },
  
  extractText(videoUrl, apiKey) {
    return request({
      url: '/video/speech-to-text',
      method: 'POST',
      data: { videoUrl, apiKey }
    })
  },
  
  getHistory() {
    return request({
      url: '/history',
      method: 'GET'
    })
  },
  
  addToHistory(item) {
    return request({
      url: '/history',
      method: 'POST',
      data: item
    })
  },
  
  deleteFromHistory(id) {
    return request({
      url: `/history/${id}`,
      method: 'DELETE'
    })
  },
  
  clearHistory() {
    return request({
      url: '/history',
      method: 'DELETE'
    })
  },
  
  getConfig() {
    return request({
      url: '/config',
      method: 'GET'
    })
  },
  
  updateConfig(config) {
    return request({
      url: '/config',
      method: 'POST',
      data: config
    })
  }
}

export default api
