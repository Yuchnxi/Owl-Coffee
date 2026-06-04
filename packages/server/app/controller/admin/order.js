'use strict'

const Controller = require('egg').Controller

const ORDER_STATUS_LIST = [
  'pendingPayment',
  'paid',
  'making',
  'readyForPickup',
  'completed',
  'cancelled',
  'refunded',
]
const PAYMENT_STATUS_LIST = ['unpaid', 'paid', 'refunded']
const ORDER_SOURCE_LIST = ['app', 'admin']

class AdminOrderController extends Controller {
  // 查询后台订单列表
  async index() {
    const { ctx } = this
    const errorMessage = this.validateQuery(ctx.query)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.order.listAdminOrders(ctx.query)

    ctx.success(result)
  }

  // 查询后台订单详情
  async show() {
    const { ctx } = this
    const order = await ctx.service.order.findAdminOrderDetail(ctx.params.orderId)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    ctx.success(order)
  }

  // 后台补单
  async create() {
    const { ctx } = this
    const payload = this.normalizeCreatePayload(ctx.request.body || {})
    const errorMessage = this.validateCreatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.order.createAdminOrder(payload, ctx.state.admin.id)

    if (result.errorCode) {
      ctx.status = result.errorCode === 10002 ? 404 : 409
      ctx.fail(result.errorCode, result.message, result.data)
      return
    }

    ctx.success(result)
  }

  // 更新订单状态
  async updateStatus() {
    const { ctx } = this
    const { orderStatus } = ctx.request.body || {}
    const order = await ctx.service.order.findAdminOrderDetail(ctx.params.orderId)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    if (!ORDER_STATUS_LIST.includes(orderStatus)) {
      ctx.status = 400
      ctx.fail(10001, '订单状态不正确')
      return
    }

    const updatedOrder = await ctx.service.order.updateOrderStatus(
      ctx.params.orderId,
      orderStatus,
      ctx.state.admin.id
    )

    ctx.success(updatedOrder)
  }

  // 取消订单
  async cancel() {
    const { ctx } = this
    const order = await ctx.service.order.findAdminOrderDetail(ctx.params.orderId)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    if (order.orderStatus === 'cancelled') {
      ctx.status = 409
      ctx.fail(60002, '订单已取消')
      return
    }

    if (order.orderStatus === 'completed') {
      ctx.status = 409
      ctx.fail(60003, '订单已完成')
      return
    }

    const updatedOrder = await ctx.service.order.cancelOrder(ctx.params.orderId, ctx.state.admin.id)

    ctx.success(updatedOrder)
  }

  // 标记退款
  async refund() {
    const { ctx } = this
    const order = await ctx.service.order.findAdminOrderDetail(ctx.params.orderId)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    if (order.orderStatus === 'refunded') {
      ctx.status = 409
      ctx.fail(60001, '订单状态不允许当前操作')
      return
    }

    const updatedOrder = await ctx.service.order.refundOrder(ctx.params.orderId, ctx.state.admin.id)

    ctx.success(updatedOrder)
  }

  // 删除订单
  async destroy() {
    const { ctx } = this
    const order = await ctx.service.order.findAdminOrderDetail(ctx.params.orderId)

    if (!order) {
      ctx.status = 404
      ctx.fail(10002, '订单不存在')
      return
    }

    await ctx.service.order.deleteOrder(ctx.params.orderId, ctx.state.admin.id)

    ctx.success({})
  }

  // 校验订单列表查询参数
  validateQuery(query) {
    if (query.orderStatus && !ORDER_STATUS_LIST.includes(query.orderStatus)) {
      return '订单状态不正确'
    }

    if (query.paymentStatus && !PAYMENT_STATUS_LIST.includes(query.paymentStatus)) {
      return '支付状态不正确'
    }

    if (query.orderSource && !ORDER_SOURCE_LIST.includes(query.orderSource)) {
      return '订单来源不正确'
    }

    return ''
  }

  // 标准化补单请求体
  normalizeCreatePayload(body) {
    return {
      userName: typeof body.userName === 'string' ? body.userName.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      orderSource: body.orderSource || 'admin',
      items: this.mergeItems(Array.isArray(body.items) ? body.items : []),
      discountAmount: Number(body.discountAmount) || 0,
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

  // 校验补单请求体
  validateCreatePayload(payload) {
    if (payload.userName && payload.userName.length > 64) {
      return '用户名称不能超过 64 个字符'
    }

    if (payload.phone && payload.phone.length > 32) {
      return '手机号不能超过 32 个字符'
    }

    if (payload.orderSource !== 'admin') {
      return '后台补单来源必须为 admin'
    }

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

    if (payload.discountAmount < 0) {
      return '优惠金额不能小于 0'
    }

    if (payload.remark.length > 500) {
      return '备注不能超过 500 个字符'
    }

    return ''
  }
}

module.exports = AdminOrderController
