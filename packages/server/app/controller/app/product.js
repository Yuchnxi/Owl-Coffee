'use strict'

const Controller = require('egg').Controller

class AppProductController extends Controller {
  // 查询小程序商品列表
  async index() {
    const list = await this.ctx.service.product.listPublicProducts(this.ctx.query)

    this.ctx.success({ list })
  }

  // 查询小程序商品详情
  async show() {
    const { ctx } = this
    const product = await ctx.service.product.findPublicProductDetail(ctx.params.productId)

    if (!product) {
      ctx.status = 404
      ctx.fail(10002, '商品不存在')
      return
    }

    ctx.success(product)
  }

  // 查询 SKU 可售状态
  async availability() {
    const { ctx } = this
    const result = await ctx.service.product.getSkuAvailability(ctx.params.skuId)

    if (!result) {
      ctx.status = 404
      ctx.fail(10002, 'SKU 不存在')
      return
    }

    ctx.success(result)
  }
}

module.exports = AppProductController
