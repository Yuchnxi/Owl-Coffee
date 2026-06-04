'use strict'

const Controller = require('egg').Controller

class AdminAuthController extends Controller {
  // 返回开发阶段验证码占位信息
  async captcha() {
    this.ctx.success({
      captchaId: 'captcha_dev',
      imageUrl: '待补充',
    })
  }

  // 后台账号密码登录
  async login() {
    const { ctx } = this
    const { account, password } = ctx.request.body || {}

    if (!account || !password) {
      ctx.status = 400
      ctx.fail(10001, '账号和密码不能为空')
      return
    }

    const result = await ctx.service.adminAuth.login(account, password)

    if (!result) {
      ctx.status = 401
      ctx.fail(20001, '账号或密码错误')
      return
    }

    ctx.success(result)
  }

  // 刷新后台 accessToken
  async refresh() {
    const { ctx } = this
    const { refreshToken } = ctx.request.body || {}

    if (!refreshToken) {
      ctx.status = 400
      ctx.fail(10001, 'refreshToken 不能为空')
      return
    }

    const result = await ctx.service.adminAuth.refresh(refreshToken)

    if (!result) {
      ctx.status = 401
      ctx.fail(20003, 'Refresh Token 无效')
      return
    }

    ctx.success(result)
  }

  // 返回当前后台登录用户
  async me() {
    const { ctx } = this
    const adminUser = await ctx.service.adminAuth.findAdminById(ctx.state.admin.id)

    if (!adminUser || adminUser.status !== 'enabled') {
      ctx.status = 401
      ctx.fail(20001, '未登录')
      return
    }

    const menus = await ctx.service.adminAuth.listMenus(adminUser.roleId)

    ctx.success({
      ...ctx.service.adminAuth.formatAdminUser(adminUser),
      menus,
    })
  }

  // 后台退出登录
  async logout() {
    this.ctx.success({})
  }
}

module.exports = AdminAuthController
