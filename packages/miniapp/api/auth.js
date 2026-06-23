const request = require('../utils/request')

// 使用微信临时凭证登录
function login(code) {
  return request({
    url: '/api/app/auth/login',
    method: 'POST',
    data: { code },
  })
}

// 使用 Refresh Token 刷新登录凭证
function refreshAccessToken(refreshToken) {
  return request({
    url: '/api/app/auth/refresh',
    method: 'POST',
    data: { refreshToken },
  })
}

// 退出当前小程序登录态
function logout() {
  return request({
    url: '/api/app/auth/logout',
    method: 'POST',
  })
}

// 绑定微信手机号
function bindPhone(phoneCode) {
  return request({
    url: '/api/app/auth/phone',
    method: 'POST',
    data: { phoneCode },
  })
}

// 查询当前登录用户
function fetchCurrentUser() {
  return request({
    url: '/api/app/auth/me',
  })
}

// 更新当前登录用户资料
function updateProfile(data) {
  return request({
    url: '/api/app/auth/profile',
    method: 'PUT',
    data,
  })
}

module.exports = {
  login,
  refreshAccessToken,
  logout,
  bindPhone,
  fetchCurrentUser,
  updateProfile,
}
