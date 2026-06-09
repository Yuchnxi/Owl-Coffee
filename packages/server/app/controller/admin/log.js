'use strict'

const Controller = require('egg').Controller

const LOGIN_RESULT_LIST = ['success', 'fail']

class AdminLogController extends Controller {
  // 查询后台登录日志
  async loginLogs() {
    const { ctx } = this
    const { loginResult } = ctx.query

    if (loginResult && !LOGIN_RESULT_LIST.includes(loginResult)) {
      ctx.status = 400
      ctx.fail(10001, '登录结果不正确')
      return
    }

    const result = await ctx.service.adminLog.listLoginLogs(ctx.query)

    ctx.success(result)
  }

  // 查询后台操作日志
  async operationLogs() {
    const result = await this.ctx.service.adminLog.listOperationLogs(this.ctx.query)

    this.ctx.success(result)
  }
}

module.exports = AdminLogController
