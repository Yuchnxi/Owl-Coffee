import { get, post } from '../utils/request'

// 获取后台登录验证码
export function fetchCaptcha() {
  return get('/api/admin/auth/captcha')
}

// 提交后台登录表单
export function loginApi(data) {
  return post('/api/admin/auth/login', data)
}

// 查询当前后台登录用户
export function fetchCurrentUser() {
  return get('/api/admin/auth/me')
}

// 退出后台登录
export function logoutApi() {
  return post('/api/admin/auth/logout')
}
