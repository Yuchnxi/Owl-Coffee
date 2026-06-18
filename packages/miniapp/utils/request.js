const config = require('../config/index')

// 发起统一接口请求，解析服务端标准响应
function request(options = {}) {
  const token = wx.getStorageSync('accessToken')
  const header = {
    'content-type': 'application/json',
    ...(options.header || {}),
  }

  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseURL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        const response = res.data || {}

        if (res.statusCode === 401) {
          const error = new Error(response.message || '请先授权登录')
          error.statusCode = res.statusCode
          reject(error)
          return
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          const error = new Error(response.message || '请求失败')
          error.statusCode = res.statusCode
          reject(error)
          return
        }

        if (response.code !== 0) {
          const error = new Error(response.message || '请求失败')
          error.code = response.code
          reject(error)
          return
        }

        resolve(response.data)
      },
      fail() {
        reject(new Error('网络请求失败'))
      },
    })
  })
}

module.exports = request
