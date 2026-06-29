'use strict'

const Controller = require('egg').Controller

const BANNER_STATUS_LIST = ['enabled', 'disabled']
const LINK_TYPE_LIST = ['none', 'page', 'url']

class AdminBannerController extends Controller {
  // 查询后台轮播图列表
  async index() {
    const { ctx } = this
    const errorMessage = this.validateQuery(ctx.query)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const result = await ctx.service.banner.listAdminBanners(ctx.query)

    ctx.success(result)
  }

  // 新增轮播图
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const banner = await ctx.service.banner.createBanner(payload, ctx.state.admin.id)

    ctx.success(banner)
  }

  // 编辑轮播图
  async update() {
    const { ctx } = this
    const banner = await ctx.service.banner.findById(ctx.params.bannerId)

    if (!banner) {
      ctx.status = 404
      ctx.fail(10002, '轮播图不存在')
      return
    }

    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const updatedBanner = await ctx.service.banner.updateBanner(
      ctx.params.bannerId,
      payload,
      ctx.state.admin.id
    )

    ctx.success(updatedBanner)
  }

  // 更新轮播图状态
  async updateStatus() {
    const { ctx } = this
    const { status } = ctx.request.body || {}

    if (!BANNER_STATUS_LIST.includes(status)) {
      ctx.status = 400
      ctx.fail(10001, '轮播图状态不正确')
      return
    }

    const banner = await ctx.service.banner.updateBannerStatus(
      ctx.params.bannerId,
      status,
      ctx.state.admin.id
    )

    if (!banner) {
      ctx.status = 404
      ctx.fail(10002, '轮播图不存在')
      return
    }

    ctx.success(banner)
  }

  // 删除轮播图
  async destroy() {
    const { ctx } = this
    const deleted = await ctx.service.banner.deleteBanner(ctx.params.bannerId, ctx.state.admin.id)

    if (!deleted) {
      ctx.status = 404
      ctx.fail(10002, '轮播图不存在')
      return
    }

    ctx.success({})
  }

  // 标准化轮播图请求体
  normalizePayload(body) {
    return {
      title: typeof body.title === 'string' ? body.title.trim() : '',
      kicker: typeof body.kicker === 'string' ? body.kicker.trim() : '',
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '',
      linkType: body.linkType || 'none',
      linkUrl: typeof body.linkUrl === 'string' ? body.linkUrl.trim() : '',
      sort: Number.isInteger(Number(body.sort)) ? Number(body.sort) : 0,
      status: body.status || 'enabled',
    }
  }

  // 校验列表查询参数
  validateQuery(query) {
    if (query.status && !BANNER_STATUS_LIST.includes(query.status)) {
      return '轮播图状态不正确'
    }

    return ''
  }

  // 校验轮播图请求体
  validatePayload(payload) {
    if (!payload.title) {
      return '轮播图标题不能为空'
    }

    if (payload.title.length > 128) {
      return '轮播图标题不能超过 128 个字符'
    }

    if (payload.kicker.length > 64) {
      return '辅助文案不能超过 64 个字符'
    }

    if (!payload.imageUrl) {
      return '轮播图图片不能为空'
    }

    if (payload.imageUrl.length > 512) {
      return '图片地址不能超过 512 个字符'
    }

    if (!LINK_TYPE_LIST.includes(payload.linkType)) {
      return '跳转类型不正确'
    }

    if (payload.linkType !== 'none' && !payload.linkUrl) {
      return '跳转地址不能为空'
    }

    if (payload.linkUrl.length > 255) {
      return '跳转地址不能超过 255 个字符'
    }

    if (!BANNER_STATUS_LIST.includes(payload.status)) {
      return '轮播图状态不正确'
    }

    return ''
  }
}

module.exports = AdminBannerController
