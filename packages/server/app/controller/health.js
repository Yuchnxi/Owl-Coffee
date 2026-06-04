'use strict'

const Controller = require('egg').Controller

class HealthController extends Controller {
  // 返回服务健康状态
  async index() {
    this.ctx.success({
      status: 'ok',
      service: 'owl-coffee-server',
      timestamp: new Date().toISOString(),
    })
  }
}

module.exports = HealthController
