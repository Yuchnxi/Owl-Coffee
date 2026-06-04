'use strict'

const Controller = require('egg').Controller

const ADJUST_TYPE_LIST = ['in', 'out', 'check']
const PRODUCT_STATUS_LIST = ['onSale', 'offSale']
const STOCK_STATUS_LIST = ['normal', 'lowStock', 'soldOut']

class AdminInventoryController extends Controller {
  // 查询 SKU 库存列表
  async skus() {
    const { ctx } = this
    const { productStatus, stockStatus } = ctx.query

    if (productStatus && !PRODUCT_STATUS_LIST.includes(productStatus)) {
      ctx.status = 400
      ctx.fail(10001, '商品状态不正确')
      return
    }

    if (stockStatus && !STOCK_STATUS_LIST.includes(stockStatus)) {
      ctx.status = 400
      ctx.fail(10001, '库存状态不正确')
      return
    }

    const result = await ctx.service.inventory.listSkus(ctx.query)

    ctx.success(result)
  }

  // 调整 SKU 库存
  async adjust() {
    const { ctx } = this
    const payload = this.normalizeAdjustment(ctx.request.body || {})
    const errorMessage = this.validateAdjustment(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.inventory.adjustStock(payload, ctx.state.admin.id)

    if (!result) {
      ctx.status = 404
      ctx.fail(10002, 'SKU 不存在')
      return
    }

    if (result.errorCode) {
      ctx.status = 409
      ctx.fail(result.errorCode, result.message, result.data)
      return
    }

    ctx.success(result)
  }

  // 查询库存调整记录
  async adjustments() {
    const { ctx } = this
    const { changeType } = ctx.query

    if (changeType && !ADJUST_TYPE_LIST.includes(changeType) && changeType !== 'order_deduct') {
      ctx.status = 400
      ctx.fail(10001, '库存调整类型不正确')
      return
    }

    const result = await ctx.service.inventory.listAdjustments(ctx.query)

    ctx.success(result)
  }

  // 标准化库存调整请求体
  normalizeAdjustment(body) {
    return {
      skuId: body.skuId || '',
      adjustType: body.adjustType || '',
      quantity: Number.isInteger(Number(body.quantity)) ? Number(body.quantity) : -1,
      reason: typeof body.reason === 'string' ? body.reason.trim() : '',
    }
  }

  // 校验库存调整请求体
  validateAdjustment(payload) {
    if (!payload.skuId) {
      return 'SKU 不能为空'
    }

    if (!ADJUST_TYPE_LIST.includes(payload.adjustType)) {
      return '库存调整类型不正确'
    }

    if (payload.quantity < 0) {
      return '库存数量不能小于 0'
    }

    if (payload.adjustType !== 'check' && payload.quantity === 0) {
      return '入库或出库数量必须大于 0'
    }

    if (!payload.reason) {
      return '调整原因不能为空'
    }

    if (payload.reason.length > 255) {
      return '调整原因不能超过 255 个字符'
    }

    return ''
  }
}

module.exports = AdminInventoryController
