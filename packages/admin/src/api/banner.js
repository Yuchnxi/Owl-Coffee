import { del, get, post, put } from '../utils/request'

// 查询轮播图列表
export function fetchBanners(params) {
  return get('/api/admin/banners', {
    params
  })
}

// 新增轮播图
export function createBanner(data) {
  return post('/api/admin/banners', data)
}

// 编辑轮播图
export function updateBanner(bannerId, data) {
  return put(`/api/admin/banners/${bannerId}`, data)
}

// 更新轮播图状态
export function updateBannerStatus(bannerId, status) {
  return put(`/api/admin/banners/${bannerId}/status`, {
    status
  })
}

// 删除轮播图
export function deleteBanner(bannerId) {
  return del(`/api/admin/banners/${bannerId}`)
}
