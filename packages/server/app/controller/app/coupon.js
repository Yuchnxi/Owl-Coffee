'use strict'

const Controller = require('egg').Controller

const USER_COUPON_STATUS_LIST = ['available', 'used', 'expired']

class AppCouponController extends Controller {
  // 查询我的优惠券
  async index() {
    const { ctx } = this
    const { status = '' } = ctx.query

    if (status && !USER_COUPON_STATUS_LIST.includes(status)) {
      ctx.status = 400
      ctx.fail(10001, '优惠券状态不正确')
      return
    }

    const result = await ctx.service.coupon.listAppCoupons(ctx.state.appUser.id, status)

    ctx.success(result)
  }

  // 查询结算可用优惠券
  async available() {
    const { ctx } = this
    const totalAmount = Number(ctx.query.totalAmount)

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      ctx.status = 400
      ctx.fail(10001, '订单金额不正确')
      return
    }

    const result = await ctx.service.coupon.listAvailableAppCoupons(ctx.state.appUser.id, totalAmount)

    ctx.success(result)
  }
}

module.exports = AppCouponController
