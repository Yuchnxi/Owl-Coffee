const request = require('../utils/request')

// 创建待付款订单
function createOrder(data) {
  return request({
    url: '/api/app/orders',
    method: 'POST',
    data,
  })
}

// 查询订单列表
function fetchOrders(statusGroup = 'all') {
  return request({
    url: '/api/app/orders',
    data: { statusGroup },
  })
}

// 查询订单详情
function fetchOrderDetail(orderId) {
  return request({
    url: `/api/app/orders/${orderId}`,
  })
}

// 取消待付款订单
function cancelOrder(orderId) {
  return request({
    url: `/api/app/orders/${orderId}/cancel`,
    method: 'PUT',
  })
}

// 确认待取餐订单已取餐
function confirmPickup(orderId) {
  return request({
    url: `/api/app/orders/${orderId}/confirm-pickup`,
    method: 'PUT',
  })
}

// 发起模拟支付
function mockPay(orderId, result = 'success') {
  return request({
    url: '/api/app/payments/mock',
    method: 'POST',
    data: { orderId, result },
  })
}

module.exports = {
  cancelOrder,
  confirmPickup,
  createOrder,
  fetchOrderDetail,
  fetchOrders,
  mockPay,
}
