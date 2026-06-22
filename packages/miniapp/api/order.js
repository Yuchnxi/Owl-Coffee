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

// 发起模拟支付
function mockPay(orderId, result = 'success') {
  return request({
    url: '/api/app/payments/mock',
    method: 'POST',
    data: { orderId, result },
  })
}

module.exports = {
  createOrder,
  fetchOrders,
  mockPay,
}
