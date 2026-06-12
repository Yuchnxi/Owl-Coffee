const TOKEN_KEY = 'owl_admin_access_token'
const REFRESH_TOKEN_KEY = 'owl_admin_refresh_token'
const USER_KEY = 'owl_admin_user'

// 读取后台登录信息
export function getAuthStorage() {
  const userText = localStorage.getItem(USER_KEY)

  return {
    accessToken: localStorage.getItem(TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    user: userText ? JSON.parse(userText) : null
  }
}

// 保存后台登录信息
export function setAuthStorage({ accessToken, refreshToken, user }) {
  localStorage.setItem(TOKEN_KEY, accessToken || '')
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken || '')
  localStorage.setItem(USER_KEY, JSON.stringify(user || null))
}

// 清除后台登录信息
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
