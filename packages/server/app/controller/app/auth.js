'use strict'

const Controller = require('egg').Controller

class AppAuthController extends Controller {
  // 小程序演示登录
  async login() {
    const { ctx } = this
    const { code } = ctx.request.body || {}

    if (!code) {
      ctx.status = 400
      ctx.fail(10001, 'code 不能为空')
      return
    }

    const result = await ctx.service.appAuth.login(code)

    ctx.success(result)
  }

  // 刷新小程序 accessToken
  async refresh() {
    const { ctx } = this
    const { refreshToken } = ctx.request.body || {}

    if (!refreshToken) {
      ctx.status = 400
      ctx.fail(10001, 'refreshToken 不能为空')
      return
    }

    const result = await ctx.service.appAuth.refresh(refreshToken)

    if (!result) {
      ctx.status = 401
      ctx.fail(20003, 'Refresh Token 无效')
      return
    }

    ctx.success(result)
  }

  // 小程序手机号授权演示
  async phone() {
    const { ctx } = this
    const { phoneCode } = ctx.request.body || {}

    if (!phoneCode) {
      ctx.status = 400
      ctx.fail(10001, 'phoneCode 不能为空')
      return
    }

    const user = await ctx.service.appAuth.bindPhone(ctx.state.appUser.id, phoneCode)

    ctx.success({
      phone: user.phone,
      phoneBound: Boolean(user.phoneBound),
    })
  }

  // 查询当前小程序用户
  async me() {
    const { ctx } = this
    const user = await ctx.service.appAuth.findUserById(ctx.state.appUser.id)

    if (!user || user.userStatus !== 'normal') {
      ctx.status = 401
      ctx.fail(20001, '未登录')
      return
    }

    ctx.success(ctx.service.appAuth.formatCurrentUser(user))
  }
}

module.exports = AppAuthController
