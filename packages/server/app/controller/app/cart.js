'use strict'

const Controller = require('egg').Controller

class AppCartController extends Controller {
  // 查询购物车
  async index() {
    const result = await this.ctx.service.cart.listCart(this.ctx.state.appUser.id)

    this.ctx.success(result)
  }

  // 同步购物车
  async sync() {
    const { ctx } = this
    const items = this.normalizeItems((ctx.request.body || {}).items)
    const errorMessage = await this.validateItems(items)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.cart.syncCart(ctx.state.appUser.id, items)

    ctx.success(result)
  }

  // 加入购物车
  async addItem() {
    const { ctx } = this
    const { skuId, quantity } = this.normalizeItem(ctx.request.body || {})
    const errorMessage = await this.validateItems([{ skuId, quantity }])

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.cart.addItem(ctx.state.appUser.id, skuId, quantity)

    ctx.success(result)
  }

  // 更新购物车项数量
  async updateItem() {
    const { ctx } = this
    const quantity = Number.isInteger(Number((ctx.request.body || {}).quantity))
      ? Number(ctx.request.body.quantity)
      : 0

    if (quantity <= 0) {
      ctx.status = 400
      ctx.fail(10001, '商品数量必须大于 0')
      return
    }

    const result = await ctx.service.cart.updateItem(ctx.state.appUser.id, ctx.params.cartItemId, quantity)

    if (!result) {
      ctx.status = 404
      ctx.fail(10002, '购物车项不存在')
      return
    }

    ctx.success(result)
  }

  // 删除购物车项
  async deleteItem() {
    const { ctx } = this
    const deleted = await ctx.service.cart.deleteItem(ctx.state.appUser.id, ctx.params.cartItemId)

    if (!deleted) {
      ctx.status = 404
      ctx.fail(10002, '购物车项不存在')
      return
    }

    ctx.success({})
  }

  // 清空购物车
  async clear() {
    await this.ctx.service.cart.clearCart(this.ctx.state.appUser.id)

    this.ctx.success({})
  }

  // 标准化购物车明细数组
  normalizeItems(items) {
    if (!Array.isArray(items)) {
      return []
    }

    const itemMap = new Map()

    for (const item of items) {
      const normalizedItem = this.normalizeItem(item)
      itemMap.set(normalizedItem.skuId, (itemMap.get(normalizedItem.skuId) || 0) + normalizedItem.quantity)
    }

    return Array.from(itemMap.entries()).map(([skuId, quantity]) => ({
      skuId,
      quantity,
    }))
  }

  // 标准化购物车明细
  normalizeItem(item) {
    return {
      skuId: item.skuId || '',
      quantity: Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : 0,
    }
  }

  // 校验购物车明细
  async validateItems(items) {
    for (const item of items) {
      if (!item.skuId) {
        return 'SKU 不能为空'
      }

      if (item.quantity <= 0) {
        return '商品数量必须大于 0'
      }

      const sku = await this.ctx.service.cart.findSku(item.skuId)

      if (!sku) {
        return 'SKU 不存在'
      }
    }

    return ''
  }
}

module.exports = AppCartController
