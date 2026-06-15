import { del, get, post, put } from '../utils/request'

// 查询优惠券列表
export function fetchCoupons(params) {
  return get('/api/admin/coupons', {
    params
  })
}

// 新增优惠券
export function createCoupon(data) {
  return post('/api/admin/coupons', data)
}

// 编辑优惠券
export function updateCoupon(couponId, data) {
  return put(`/api/admin/coupons/${couponId}`, data)
}

// 停用优惠券
export function disableCoupon(couponId) {
  return put(`/api/admin/coupons/${couponId}/disable`)
}

// 删除优惠券
export function deleteCoupon(couponId) {
  return del(`/api/admin/coupons/${couponId}`)
}
