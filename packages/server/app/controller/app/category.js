'use strict'

const Controller = require('egg').Controller

class AppCategoryController extends Controller {
  // 查询小程序启用分类列表
  async index() {
    const list = await this.ctx.service.category.listEnabledCategories()

    this.ctx.success({ list })
  }
}

module.exports = AppCategoryController
