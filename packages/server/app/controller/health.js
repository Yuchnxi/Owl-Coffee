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

  // 返回数据库连接健康状态
  async database() {
    const { ctx, app } = this

    try {
      await app.mysql.query('SELECT 1')
      ctx.success({
        status: 'ok',
        database: app.config.database.database,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      ctx.status = 503
      ctx.fail(10000, '数据库连接异常')
    }
  }
}

module.exports = HealthController
