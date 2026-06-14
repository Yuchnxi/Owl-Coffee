import { del, get, post, put } from '../utils/request'

// 查询后台角色列表
export function fetchRoles() {
  return get('/api/admin/roles')
}

// 查询后台角色详情
export function fetchRoleDetail(roleId) {
  return get(`/api/admin/roles/${roleId}`)
}

// 更新角色菜单权限
export function updateRoleMenus(roleId, menuIds) {
  return put(`/api/admin/roles/${roleId}/menus`, {
    menuIds
  })
}

// 查询后台菜单树
export function fetchMenus() {
  return get('/api/admin/menus')
}

// 新增后台菜单
export function createMenu(data) {
  return post('/api/admin/menus', data)
}

// 编辑后台菜单
export function updateMenu(menuId, data) {
  return put(`/api/admin/menus/${menuId}`, data)
}

// 更新后台菜单状态
export function updateMenuStatus(menuId, status) {
  return put(`/api/admin/menus/${menuId}/status`, {
    status
  })
}

// 删除后台菜单
export function deleteMenu(menuId) {
  return del(`/api/admin/menus/${menuId}`)
}
