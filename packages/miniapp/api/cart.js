const request = require('../utils/request')

// 查询购物车
function fetchCart() {
  return request({
    url: '/api/app/cart',
  })
}

// 同步购物车
function syncCart(items, cartVersion) {
  return request({
    url: '/api/app/cart/sync',
    method: 'POST',
    data: { items, cartVersion },
  })
}

// 加入购物车
function addCartItem(data) {
  return request({
    url: '/api/app/cart/items',
    method: 'POST',
    data,
  })
}

module.exports = {
  fetchCart,
  syncCart,
  addCartItem,
}
