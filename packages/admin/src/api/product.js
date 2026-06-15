import { del, get, post, put, request } from '../utils/request'

// 查询商品列表
export function fetchProducts(params) {
  return get('/api/admin/products', {
    params
  })
}

// 查询商品详情
export function fetchProductDetail(productId) {
  return get(`/api/admin/products/${productId}`)
}

// 新增商品
export function createProduct(data) {
  return post('/api/admin/products', data)
}

// 编辑商品
export function updateProduct(productId, data) {
  return put(`/api/admin/products/${productId}`, data)
}

// 更新商品上下架状态
export function updateProductStatus(productId, productStatus) {
  return put(`/api/admin/products/${productId}/status`, {
    productStatus
  })
}

// 删除商品
export function deleteProduct(productId) {
  return del(`/api/admin/products/${productId}`)
}

// 查询商品分类
export function fetchCategories(params) {
  return get('/api/admin/categories', {
    params
  })
}

// 新增商品分类
export function createCategory(data) {
  return post('/api/admin/categories', data)
}

// 编辑商品分类
export function updateCategory(categoryId, data) {
  return put(`/api/admin/categories/${categoryId}`, data)
}

// 删除商品分类
export function deleteCategory(categoryId) {
  return del(`/api/admin/categories/${categoryId}`)
}

// 上传商品图片
export function uploadProductImage(file) {
  const formData = new FormData()

  formData.append('bizType', 'product')
  formData.append('file', file)

  return request({
    url: '/api/admin/uploads',
    method: 'post',
    data: formData
  })
}
