'use strict'

const Controller = require('egg').Controller

class PublicContentController extends Controller {
  // 查询官网门店公开信息
  async store() {
    const data = await this.ctx.service.publicContent.getStore()

    this.ctx.success(data)
  }

  // 查询小程序二维码公开信息
  async miniappQrcode() {
    const data = await this.ctx.service.publicContent.getMiniappQrcode()

    this.ctx.success(data)
  }
}

module.exports = PublicContentController
