import { del, get, post, put } from '../utils/request'

// 查询订单列表
export function fetchOrders(params) {
  return get('/api/admin/orders', {
    params
  })
}

// 查询订单详情
export function fetchOrderDetail(orderId) {
  return get(`/api/admin/orders/${orderId}`)
}

// 后台补单
export function createOrder(data) {
  return post('/api/admin/orders', data)
}

// 更新订单制作状态
export function updateOrderStatus(orderId, orderStatus) {
  return put(`/api/admin/orders/${orderId}/status`, {
    orderStatus
  })
}

// 取消订单
export function cancelOrder(orderId) {
  return put(`/api/admin/orders/${orderId}/cancel`)
}

// 标记退款
export function refundOrder(orderId) {
  return put(`/api/admin/orders/${orderId}/refund`)
}

// 删除订单
export function deleteOrder(orderId) {
  return del(`/api/admin/orders/${orderId}`)
}
