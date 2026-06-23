const config = require('../config/index')

// 上传小程序文件到服务端 COS 中转接口
function uploadFile(filePath, bizType = 'avatar') {
  const token = wx.getStorageSync('accessToken')

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${config.baseURL}/api/app/uploads`,
      filePath,
      name: 'file',
      formData: { bizType },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        let response = {}

        try {
          response = JSON.parse(res.data || '{}')
        } catch (err) {
          reject(new Error('上传响应解析失败'))
          return
        }

        if (res.statusCode < 200 || res.statusCode >= 300 || response.code !== 0) {
          const error = new Error(response.message || '上传失败')
          error.statusCode = res.statusCode
          error.code = response.code
          reject(error)
          return
        }

        resolve(response.data)
      },
      fail() {
        reject(new Error('文件上传失败'))
      },
    })
  })
}

module.exports = {
  uploadFile,
}
