'use strict'

const Controller = require('egg').Controller

const USER_STATUS_LIST = ['normal', 'disabled']

class AdminUserController extends Controller {
  // 查询后台用户列表
  async index() {
    const { ctx } = this
    const errorMessage = this.validateQuery(ctx.query)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.user.listAdminUsers(ctx.query)

    ctx.success(result)
  }

  // 查询后台用户详情
  async show() {
    const { ctx } = this
    const user = await ctx.service.user.findAdminUserDetail(ctx.params.userId)

    if (!user) {
      ctx.status = 404
      ctx.fail(10002, '用户不存在')
      return
    }

    ctx.success(user)
  }

  // 更新小程序用户状态
  async updateStatus() {
    const { ctx } = this
    const { userStatus } = ctx.request.body || {}

    if (!USER_STATUS_LIST.includes(userStatus)) {
      ctx.status = 400
      ctx.fail(10001, '用户状态不正确')
      return
    }

    const user = await ctx.service.user.updateUserStatus(
      ctx.params.userId,
      userStatus,
      ctx.state.admin.id
    )

    if (!user) {
      ctx.status = 404
      ctx.fail(10002, '用户不存在')
      return
    }

    ctx.success(user)
  }

  // 校验后台用户列表查询参数
  validateQuery(query) {
    if (query.userStatus && !USER_STATUS_LIST.includes(query.userStatus)) {
      return '用户状态不正确'
    }

    return ''
  }
}

module.exports = AdminUserController
