const request = require('../utils/request')

// 加入购物车
function addCartItem(data) {
  return request({
    url: '/api/app/cart/items',
    method: 'POST',
    data,
  })
}

module.exports = {
  addCartItem,
}
