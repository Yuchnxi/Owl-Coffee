import { get, put } from '../utils/request'

// 查询小程序用户列表
export function fetchUsers(params) {
  return get('/api/admin/users', {
    params
  })
}

// 查询小程序用户详情
export function fetchUserDetail(userId) {
  return get(`/api/admin/users/${userId}`)
}

// 更新小程序用户状态
export function updateUserStatus(userId, userStatus) {
  return put(`/api/admin/users/${userId}/status`, {
    userStatus
  })
}
