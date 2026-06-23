'use strict'

const Controller = require('egg').Controller

const GENDER_LIST = ['male', 'female', 'secret']

class AppAuthController extends Controller {
  // 小程序微信登录
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

  // 小程序退出登录
  async logout() {
    const { ctx } = this

    await ctx.service.appAuth.logout(ctx.state.appUser.id)

    ctx.success({})
  }

  // 小程序手机号授权
  async phone() {
    const { ctx } = this
    const { phoneCode } = ctx.request.body || {}

    if (!phoneCode || phoneCode === '待补充') {
      ctx.status = 400
      ctx.fail(10001, '手机号授权凭证无效')
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

  // 更新当前小程序用户资料
  async profile() {
    const { ctx } = this
    const payload = this.normalizeProfilePayload(ctx.request.body || {})
    const error = this.validateProfilePayload(payload)

    if (error) {
      ctx.status = 400
      ctx.fail(10001, error)
      return
    }

    const user = await ctx.service.appAuth.updateProfile(ctx.state.appUser.id, payload)

    ctx.success(ctx.service.appAuth.formatCurrentUser(user))
  }

  // 归一化资料更新参数
  normalizeProfilePayload(body) {
    return {
      nickname: typeof body.nickname === 'string' ? body.nickname.trim() : '',
      avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '',
      gender: typeof body.gender === 'string' ? body.gender.trim() : '',
    }
  }

  // 校验资料更新参数
  validateProfilePayload(payload) {
    if (payload.nickname && payload.nickname.length > 64) {
      return '用户名称不能超过 64 个字符'
    }

    if (payload.avatarUrl && payload.avatarUrl.length > 512) {
      return '头像地址不能超过 512 个字符'
    }

    if (payload.gender && !GENDER_LIST.includes(payload.gender)) {
      return '性别参数不正确'
    }

    return ''
  }
}

module.exports = AppAuthController
