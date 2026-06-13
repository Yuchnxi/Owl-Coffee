'use strict'

const Controller = require('egg').Controller

const ACCOUNT_PATTERN = /^[A-Za-z0-9_]{4,32}$/
const ADMIN_USER_STATUS_LIST = ['enabled', 'disabled']

class AdminUserController extends Controller {
  // 查询后台账号列表
  async index() {
    const { ctx } = this
    const errorMessage = this.validateQuery(ctx.query)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.adminUser.listAdminUsers(ctx.query)

    ctx.success(result)
  }

  // 查询后台账号详情
  async show() {
    const { ctx } = this
    const adminUser = await ctx.service.adminUser.findAdminUserDetail(ctx.params.adminUserId)

    if (!adminUser) {
      ctx.status = 404
      ctx.fail(10002, '账号不存在')
      return
    }

    ctx.success(adminUser)
  }

  // 新增后台账号
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload, { passwordRequired: true, statusRequired: true })

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.adminUser.createAdminUser(payload, ctx.state.admin.id)

    this.sendMutationResult(result)
  }

  // 编辑后台账号
  async update() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload, { passwordRequired: false, statusRequired: false })

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.adminUser.updateAdminUser(
      ctx.params.adminUserId,
      payload,
      ctx.state.admin.id
    )

    this.sendMutationResult(result)
  }

  // 启停后台账号
  async updateStatus() {
    const { ctx } = this
    const { status } = ctx.request.body || {}

    if (!ADMIN_USER_STATUS_LIST.includes(status)) {
      ctx.status = 400
      ctx.fail(10001, '账号状态不正确')
      return
    }

    const result = await ctx.service.adminUser.updateAdminUserStatus(
      ctx.params.adminUserId,
      status,
      ctx.state.admin.id
    )

    this.sendMutationResult(result)
  }

  // 重置后台账号密码
  async resetPassword() {
    const { ctx } = this
    const { password } = ctx.request.body || {}

    if (!password || String(password).length < 6) {
      ctx.status = 400
      ctx.fail(10001, '密码不能少于 6 位')
      return
    }

    const result = await ctx.service.adminUser.resetAdminUserPassword(
      ctx.params.adminUserId,
      String(password),
      ctx.state.admin.id
    )

    this.sendMutationResult(result)
  }

  // 删除后台账号
  async destroy() {
    const { ctx } = this
    const result = await ctx.service.adminUser.deleteAdminUser(ctx.params.adminUserId, ctx.state.admin.id)

    this.sendMutationResult(result)
  }

  // 查询可选角色
  async roles() {
    const result = await this.ctx.service.adminUser.listEnabledRoles()

    this.ctx.success({ list: result })
  }

  // 返回变更接口结果
  sendMutationResult(result) {
    const { ctx } = this

    if (result?.notFound) {
      ctx.status = 404
      ctx.fail(10002, '账号不存在')
      return
    }

    if (result?.conflict) {
      ctx.status = 409
      ctx.fail(10003, result.error)
      return
    }

    if (result?.error) {
      ctx.status = 400
      ctx.fail(10001, result.error)
      return
    }

    ctx.success(result?.data || {})
  }

  // 标准化账号请求体
  normalizePayload(payload) {
    return {
      account: String(payload.account || '').trim(),
      name: String(payload.name || '').trim(),
      phone: String(payload.phone || '').trim(),
      roleId: String(payload.roleId || '').trim(),
      password: payload.password === undefined ? '' : String(payload.password),
      status: payload.status || 'enabled',
    }
  }

  // 校验账号列表查询参数
  validateQuery(query) {
    if (query.status && !ADMIN_USER_STATUS_LIST.includes(query.status)) {
      return '账号状态不正确'
    }

    return ''
  }

  // 校验账号请求体
  validatePayload(payload, options) {
    if (!ACCOUNT_PATTERN.test(payload.account)) {
      return '登录账号只能使用 4-32 位英文、数字和下划线'
    }

    if (!payload.name) {
      return '姓名不能为空'
    }

    if (payload.name.length > 64) {
      return '姓名不能超过 64 个字符'
    }

    if (payload.phone && payload.phone.length > 32) {
      return '手机号不能超过 32 个字符'
    }

    if (!payload.roleId) {
      return '角色不能为空'
    }

    if (options.statusRequired && !ADMIN_USER_STATUS_LIST.includes(payload.status)) {
      return '账号状态不正确'
    }

    if (options.passwordRequired && (!payload.password || payload.password.length < 6)) {
      return '密码不能少于 6 位'
    }

    return ''
  }
}

module.exports = AdminUserController
