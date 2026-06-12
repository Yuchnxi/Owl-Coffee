import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchCurrentUser, loginApi, logoutApi } from '../api/auth'
import { clearAuthStorage, getAuthStorage, setAuthStorage } from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const storage = getAuthStorage()

  // 后台 accessToken
  const accessToken = ref(storage.accessToken)

  // 后台 refreshToken
  const refreshToken = ref(storage.refreshToken)

  // 当前后台用户信息
  const user = ref(storage.user)

  // 是否已登录
  const isLoggedIn = computed(() => Boolean(accessToken.value))

  // 提交登录并保存登录态
  async function login(form) {
    const result = await loginApi(form)

    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user

    setAuthStorage({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    })

    return result
  }

  // 拉取当前后台用户信息
  async function loadCurrentUser() {
    user.value = await fetchCurrentUser()

    setAuthStorage({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value
    })

    return user.value
  }

  // 清空登录态
  function clearAuth() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    clearAuthStorage()
  }

  // 退出登录
  async function logout() {
    try {
      await logoutApi()
    } finally {
      clearAuth()
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    login,
    loadCurrentUser,
    clearAuth,
    logout
  }
})
