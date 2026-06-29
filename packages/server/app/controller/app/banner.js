'use strict'

const Controller = require('egg').Controller

class AppBannerController extends Controller {
  // 查询小程序首页轮播图
  async index() {
    const { ctx } = this
    const result = await ctx.service.banner.listAppBanners()

    ctx.success(result)
  }
}

module.exports = AppBannerController
