import { del, get, post, put } from '../utils/request'

// 查询后台账号列表
export function fetchAdminUsers(params) {
  return get('/api/admin/admin-users', {
    params
  })
}

// 查询后台账号详情
export function fetchAdminUserDetail(adminUserId) {
  return get(`/api/admin/admin-users/${adminUserId}`)
}

// 新增后台账号
export function createAdminUser(data) {
  return post('/api/admin/admin-users', data)
}

// 编辑后台账号
export function updateAdminUser(adminUserId, data) {
  return put(`/api/admin/admin-users/${adminUserId}`, data)
}

// 更新后台账号状态
export function updateAdminUserStatus(adminUserId, status) {
  return put(`/api/admin/admin-users/${adminUserId}/status`, {
    status
  })
}

// 重置后台账号密码
export function resetAdminUserPassword(adminUserId, password) {
  return put(`/api/admin/admin-users/${adminUserId}/password`, {
    password
  })
}

// 删除后台账号
export function deleteAdminUser(adminUserId) {
  return del(`/api/admin/admin-users/${adminUserId}`)
}

// 查询可选后台角色
export function fetchAdminUserRoles() {
  return get('/api/admin/admin-users/roles')
}
