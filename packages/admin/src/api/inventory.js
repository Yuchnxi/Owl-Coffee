import { get, post } from '../utils/request'

// 查询 SKU 库存列表
export function fetchInventorySkus(params) {
  return get('/api/admin/inventory/skus', {
    params
  })
}

// 调整 SKU 库存
export function adjustInventory(data) {
  return post('/api/admin/inventory/adjustments', data)
}

// 查询库存调整记录
export function fetchInventoryAdjustments(params) {
  return get('/api/admin/inventory/adjustments', {
    params
  })
}
