'use strict'

const Controller = require('egg').Controller

class PublicProductController extends Controller {
  // 查询官网公开商品列表
  async index() {
    const list = await this.ctx.service.product.listPublicProducts(this.ctx.query)

    this.ctx.success({ list })
  }

  // 查询官网推荐商品列表
  async recommended() {
    const list = await this.ctx.service.product.listPublicProducts(this.ctx.query, true)

    this.ctx.success({ list })
  }
}

module.exports = PublicProductController
