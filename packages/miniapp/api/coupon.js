const request = require('../utils/request')

// 查询我的优惠券列表
function fetchCoupons(status = 'available') {
  return request({
    url: '/api/app/coupons',
    data: { status },
  })
}

// 查询结算可用优惠券
function fetchAvailableCoupons(amount) {
  return request({
    url: '/api/app/coupons/available',
    data: { totalAmount: amount },
  })
}

module.exports = {
  fetchAvailableCoupons,
  fetchCoupons,
}
