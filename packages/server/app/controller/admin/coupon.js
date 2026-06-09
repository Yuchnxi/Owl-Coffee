'use strict'

const Controller = require('egg').Controller

const COUPON_TYPE_LIST = ['discountAmount', 'discountRate']
const COUPON_STATUS_LIST = ['notStarted', 'active', 'ended', 'disabled']

class AdminCouponController extends Controller {
  // 查询后台优惠券列表
  async index() {
    const { ctx } = this
    const errorMessage = this.validateQuery(ctx.query)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.coupon.listAdminCoupons(ctx.query)

    ctx.success(result)
  }

  // 新增优惠券模板
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const coupon = await ctx.service.coupon.createCoupon(payload, ctx.state.admin.id)

    ctx.success(coupon)
  }

  // 编辑优惠券模板
  async update() {
    const { ctx } = this
    const coupon = await ctx.service.coupon.findById(ctx.params.couponId)

    if (!coupon) {
      ctx.status = 404
      ctx.fail(10002, '优惠券不存在')
      return
    }

    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload, coupon)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const updatedCoupon = await ctx.service.coupon.updateCoupon(
      ctx.params.couponId,
      payload,
      ctx.state.admin.id
    )

    ctx.success(updatedCoupon)
  }

  // 停用优惠券模板
  async disable() {
    const { ctx } = this
    const coupon = await ctx.service.coupon.disableCoupon(ctx.params.couponId, ctx.state.admin.id)

    if (!coupon) {
      ctx.status = 404
      ctx.fail(10002, '优惠券不存在')
      return
    }

    ctx.success(coupon)
  }

  // 删除优惠券模板
  async destroy() {
    const { ctx } = this
    const deleted = await ctx.service.coupon.deleteCoupon(ctx.params.couponId, ctx.state.admin.id)

    if (!deleted) {
      ctx.status = 404
      ctx.fail(10002, '优惠券不存在')
      return
    }

    ctx.success({})
  }

  // 标准化优惠券请求体
  normalizePayload(body) {
    return {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      couponType: body.couponType || '',
      thresholdAmount: Number(body.thresholdAmount),
      discountAmount: body.discountAmount === null || body.discountAmount === undefined ? null : Number(body.discountAmount),
      discountRate: body.discountRate === null || body.discountRate === undefined ? null : Number(body.discountRate),
      totalQuantity: Number.isInteger(Number(body.totalQuantity)) ? Number(body.totalQuantity) : 0,
      limitPerUser: Number.isInteger(Number(body.limitPerUser)) ? Number(body.limitPerUser) : 0,
      validStartAt: body.validStartAt || '',
      validEndAt: body.validEndAt || '',
      couponStatus: body.couponStatus || 'notStarted',
    }
  }

  // 校验优惠券列表查询参数
  validateQuery(query) {
    if (query.couponType && !COUPON_TYPE_LIST.includes(query.couponType)) {
      return '优惠券类型不正确'
    }

    if (query.couponStatus && !COUPON_STATUS_LIST.includes(query.couponStatus)) {
      return '优惠券状态不正确'
    }

    return ''
  }

  // 校验优惠券请求体
  validatePayload(payload, currentCoupon = null) {
    if (!payload.name) {
      return '优惠券名称不能为空'
    }

    if (payload.name.length > 128) {
      return '优惠券名称不能超过 128 个字符'
    }

    if (!COUPON_TYPE_LIST.includes(payload.couponType)) {
      return '优惠券类型不正确'
    }

    if (!Number.isFinite(payload.thresholdAmount) || payload.thresholdAmount < 0) {
      return '使用门槛不能小于 0'
    }

    if (payload.couponType === 'discountAmount') {
      if (!Number.isFinite(payload.discountAmount) || payload.discountAmount <= 0) {
        return '满减金额必须大于 0'
      }
    }

    if (payload.couponType === 'discountRate') {
      if (!Number.isFinite(payload.discountRate) || payload.discountRate <= 0 || payload.discountRate >= 10) {
        return '折扣比例必须大于 0 且小于 10'
      }
    }

    if (payload.totalQuantity <= 0) {
      return '发放数量必须大于 0'
    }

    if (currentCoupon && payload.totalQuantity < currentCoupon.usedQuantity) {
      return '发放数量不能小于已使用数量'
    }

    if (payload.limitPerUser <= 0) {
      return '每人限领数量必须大于 0'
    }

    if (!this.isValidDate(payload.validStartAt) || !this.isValidDate(payload.validEndAt)) {
      return '有效期时间不正确'
    }

    if (new Date(payload.validStartAt).getTime() >= new Date(payload.validEndAt).getTime()) {
      return '有效期结束时间必须晚于开始时间'
    }

    if (!COUPON_STATUS_LIST.includes(payload.couponStatus)) {
      return '优惠券状态不正确'
    }

    return ''
  }

  // 判断日期是否有效
  isValidDate(value) {
    return value && !Number.isNaN(new Date(value).getTime())
  }
}

module.exports = AdminCouponController
