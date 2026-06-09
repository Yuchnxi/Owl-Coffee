'use strict'

const Controller = require('egg').Controller

const CATEGORY_STATUS_LIST = ['enabled', 'disabled']

class AdminCategoryController extends Controller {
  // 查询后台分类列表
  async index() {
    const { ctx } = this
    const { name, status } = ctx.query

    if (status && !CATEGORY_STATUS_LIST.includes(status)) {
      ctx.status = 400
      ctx.fail(10001, '分类状态不正确')
      return
    }

    const list = await ctx.service.category.listAdminCategories({
      name,
      status,
    })

    ctx.success({ list })
  }

  // 新增商品分类
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const duplicated = await ctx.service.category.existsByName(payload.name)

    if (duplicated) {
      ctx.status = 409
      ctx.fail(10003, '分类名称已存在')
      return
    }

    const category = await ctx.service.category.createCategory(payload, ctx.state.admin.id)

    ctx.success(category)
  }

  // 编辑商品分类
  async update() {
    const { ctx } = this
    const { categoryId } = ctx.params
    const category = await ctx.service.category.findById(categoryId)

    if (!category) {
      ctx.status = 404
      ctx.fail(10002, '分类不存在')
      return
    }

    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const duplicated = await ctx.service.category.existsByName(payload.name, categoryId)

    if (duplicated) {
      ctx.status = 409
      ctx.fail(10003, '分类名称已存在')
      return
    }

    const updatedCategory = await ctx.service.category.updateCategory(
      categoryId,
      payload,
      ctx.state.admin.id
    )

    ctx.success(updatedCategory)
  }

  // 删除商品分类
  async destroy() {
    const { ctx } = this
    const { categoryId } = ctx.params
    const category = await ctx.service.category.findById(categoryId)

    if (!category) {
      ctx.status = 404
      ctx.fail(10002, '分类不存在')
      return
    }

    await ctx.service.category.deleteCategory(categoryId, ctx.state.admin.id)

    ctx.success({})
  }

  // 标准化分类请求体
  normalizePayload(body) {
    return {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      sort: Number.isInteger(Number(body.sort)) ? Number(body.sort) : 0,
      status: body.status || 'enabled',
    }
  }

  // 校验分类请求体
  validatePayload(payload) {
    if (!payload.name) {
      return '分类名称不能为空'
    }

    if (payload.name.length > 64) {
      return '分类名称不能超过 64 个字符'
    }

    if (!CATEGORY_STATUS_LIST.includes(payload.status)) {
      return '分类状态不正确'
    }

    if (payload.sort < 0) {
      return '排序不能小于 0'
    }

    return ''
  }
}

module.exports = AdminCategoryController
