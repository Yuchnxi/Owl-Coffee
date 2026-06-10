import axios from 'axios'
import { ElMessage } from 'element-plus'
import { clearAuthStorage, getAuthStorage } from './storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
})

service.interceptors.request.use(config => {
  const { accessToken } = getAuthStorage()

  config.headers = config.headers || {}

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

service.interceptors.response.use(
  response => {
    const result = response.data

    if (!result || result.code !== 0) {
      const message = result?.message || '接口请求失败'

      ElMessage.error(message)
      return Promise.reject(new Error(message))
    }

    return result.data
  },
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '接口请求失败'

    if (status === 401) {
      clearAuthStorage()
    }

    ElMessage.error(message)
    return Promise.reject(new Error(message))
  }
)

// 发起后台接口请求
export function request(config) {
  return service(config)
}

// 发起 GET 请求
export function get(url, options = {}) {
  return request({
    ...options,
    url,
    method: 'get'
  })
}

// 发起 POST 请求
export function post(url, data, options = {}) {
  return request({
    ...options,
    url,
    method: 'post',
    data: data || {}
  })
}
