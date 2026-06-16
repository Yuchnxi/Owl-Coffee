import { get, put } from '../utils/request'

// 查询当前管理员账号设置
export function fetchAccountSetting() {
  return get('/api/admin/settings/account')
}

// 更新当前管理员账号设置
export function updateAccountSetting(data) {
  return put('/api/admin/settings/account', data)
}
