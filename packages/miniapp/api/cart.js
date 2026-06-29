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

// 更新购物车单项数量
function updateCartItem(cartItemId, quantity) {
  return request({
    url: `/api/app/cart/items/${cartItemId}`,
    method: 'PUT',
    data: { quantity },
  })
}

// 删除购物车单项
function deleteCartItem(cartItemId) {
  return request({
    url: `/api/app/cart/items/${cartItemId}`,
    method: 'DELETE',
  })
}

// 清空服务端购物车
function clearRemoteCart() {
  return request({
    url: '/api/app/cart',
    method: 'DELETE',
  })
}

module.exports = {
  clearRemoteCart,
  deleteCartItem,
  fetchCart,
  syncCart,
  addCartItem,
  updateCartItem,
}
