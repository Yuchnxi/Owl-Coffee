'use strict'

const Controller = require('egg').Controller

const STATUS_GROUP_LIST = ['all', 'pendingPayment', 'paid', 'making', 'readyForPickup', 'completed', 'cancelled']

class AppOrderController extends Controller {
  // 创建小程序待付款订单
  async create() {
    const { ctx } = this
    const payload = this.normalizeCreatePayload(ctx.request.body || {})
    const errorMessage = this.validateCreatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const user = await ctx.service.appAuth.findUserById(ctx.state.appUser.id)

    if (!user || user.userStatus !== 'normal') {
      ctx.status = 403
      ctx.fail(30004, '用户已禁用')
      return
    }

    const result = await ctx.service.order.createAppOrder(payload, user)

    if (result.errorCode) {
      ctx.status = result.errorCode === 10002 ? 404 : 409
      ctx.fail(result.errorCode, result.message, result.data)
      return
    }

    ctx.success(result)
  }

  // 查询小程序订单列表
  async index() {
    const { ctx } = this
    const { statusGroup = 'all' } = ctx.query

    if (!STATUS_GROUP_LIST.includes(statusGroup)) {
      ctx.status = 400
      ctx.fail(10001, '订单状态分组不正确')
      return
    }

    const result = await ctx.service.order.listAppOrders(ctx.state.appUser.id, { statusGroup })

    ctx.success(result)
  }

  // 查询小程序订单详情
  async show() {
    const { ctx } = this
    const order = await ctx.service.order.findAppOrderDetail(ctx.params.orderId, ctx.state.appUser.id)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    ctx.success(order)
  }

  // 取消小程序待付款订单
  async cancel() {
    const { ctx } = this
    const result = await ctx.service.order.cancelAppOrder(ctx.params.orderId, ctx.state.appUser.id)

    if (!result) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    if (result.errorCode) {
      ctx.status = 409
      ctx.fail(result.errorCode, result.message, result.data)
      return
    }

    ctx.success(result)
  }

  // 确认取餐
  async confirmPickup() {
    const { ctx } = this
    const result = await ctx.service.order.confirmPickup(ctx.params.orderId, ctx.state.appUser.id)

    if (!result) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    if (result.errorCode) {
      ctx.status = 409
      ctx.fail(result.errorCode, result.message, result.data)
      return
    }

    ctx.success(result)
  }

  // 标准化下单请求体
  normalizeCreatePayload(body) {
    return {
      items: this.mergeItems(Array.isArray(body.items) ? body.items : []),
      couponUserId: body.couponUserId || null,
      remark: typeof body.remark === 'string' ? body.remark.trim() : '',
    }
  }

  // 合并重复 SKU 明细
  mergeItems(items) {
    const itemMap = new Map()

    for (const item of items) {
      const skuId = item.skuId || ''
      const quantity = Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : 0

      itemMap.set(skuId, (itemMap.get(skuId) || 0) + quantity)
    }

    return Array.from(itemMap.entries()).map(([skuId, quantity]) => ({
      skuId,
      quantity,
    }))
  }

  // 校验下单请求体
  validateCreatePayload(payload) {
    if (payload.items.length === 0) {
      return '订单商品不能为空'
    }

    for (const item of payload.items) {
      if (!item.skuId) {
        return 'SKU 不能为空'
      }

      if (item.quantity <= 0) {
        return '商品数量必须大于 0'
      }
    }

    if (payload.remark.length > 500) {
      return '备注不能超过 500 个字符'
    }

    return ''
  }
}

module.exports = AppOrderController
