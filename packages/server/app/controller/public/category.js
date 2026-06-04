'use strict'

const Controller = require('egg').Controller

class PublicCategoryController extends Controller {
  // 查询官网启用分类列表
  async index() {
    const list = await this.ctx.service.category.listEnabledCategories()

    this.ctx.success({ list })
  }
}

module.exports = PublicCategoryController
