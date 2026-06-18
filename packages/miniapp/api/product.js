const request = require('../utils/request')

// 查询小程序商品分类
function fetchCategories() {
  return request({
    url: '/api/app/categories',
  })
}

// 查询小程序商品列表
function fetchProducts(params = {}) {
  return request({
    url: '/api/app/products',
    data: params,
  })
}

// 查询小程序商品详情
function fetchProductDetail(productId) {
  return request({
    url: `/api/app/products/${productId}`,
  })
}

// 查询 SKU 可售状态
function fetchSkuAvailability(skuId) {
  return request({
    url: `/api/app/skus/${skuId}/availability`,
  })
}

module.exports = {
  fetchCategories,
  fetchProducts,
  fetchProductDetail,
  fetchSkuAvailability,
}
