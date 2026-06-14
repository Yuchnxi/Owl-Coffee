'use strict'

const Controller = require('egg').Controller

const DEFAULT_MENU_ID = 'dashboard'
const MENU_STATUS_LIST = ['enabled', 'disabled']

class AdminMenuController extends Controller {
  // 查询后台可管理菜单树
  async index() {
    const result = await this.ctx.service.menu.listMenuTree()

    this.ctx.success(result)
  }

  // 新增后台菜单
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = await this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const exists = await ctx.service.menu.existsById(payload.id)

    if (exists) {
      ctx.status = 409
      ctx.fail(10003, '菜单 ID 已存在')
      return
    }

    const menu = await ctx.service.menu.createMenu(payload)

    ctx.success(menu)
  }

  // 编辑后台菜单
  async update() {
    const { ctx } = this

    if (this.isDefaultMenu(ctx.params.menuId)) {
      ctx.status = 400
      ctx.fail(10001, '默认菜单不允许管理')
      return
    }

    const menu = await ctx.service.menu.findById(ctx.params.menuId)

    if (!menu) {
      ctx.status = 404
      ctx.fail(10002, '菜单不存在')
      return
    }

    const payload = this.normalizePayload(ctx.request.body || {}, ctx.params.menuId)
    const errorMessage = await this.validatePayload(payload, ctx.params.menuId)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const updatedMenu = await ctx.service.menu.updateMenu(ctx.params.menuId, payload)

    ctx.success(updatedMenu)
  }

  // 启停后台菜单
  async updateStatus() {
    const { ctx } = this
    const status = (ctx.request.body || {}).status

    if (this.isDefaultMenu(ctx.params.menuId)) {
      ctx.status = 400
      ctx.fail(10001, '默认菜单不允许管理')
      return
    }

    if (!MENU_STATUS_LIST.includes(status)) {
      ctx.status = 400
      ctx.fail(10001, '菜单状态不正确')
      return
    }

    const menu = await ctx.service.menu.updateMenuStatus(ctx.params.menuId, status)

    if (!menu) {
      ctx.status = 404
      ctx.fail(10002, '菜单不存在')
      return
    }

    ctx.success(menu)
  }

  // 删除后台菜单
  async destroy() {
    const { ctx } = this

    if (this.isDefaultMenu(ctx.params.menuId)) {
      ctx.status = 400
      ctx.fail(10001, '默认菜单不允许管理')
      return
    }

    const hasChildren = await ctx.service.menu.hasChildren(ctx.params.menuId)

    if (hasChildren) {
      ctx.status = 400
      ctx.fail(10001, '存在子菜单时不能删除')
      return
    }

    const deleted = await ctx.service.menu.deleteMenu(ctx.params.menuId)

    if (!deleted) {
      ctx.status = 404
      ctx.fail(10002, '菜单不存在')
      return
    }

    ctx.success({})
  }

  // 标准化菜单请求体
  normalizePayload(body, menuId = '') {
    return {
      id: menuId || (typeof body.id === 'string' ? body.id.trim() : ''),
      parentId: typeof body.parentId === 'string' && body.parentId.trim() ? body.parentId.trim() : null,
      name: typeof body.name === 'string' ? body.name.trim() : '',
      path: typeof body.path === 'string' ? body.path.trim() : '',
      icon: typeof body.icon === 'string' ? body.icon.trim() : '',
      sort: Number.isInteger(Number(body.sort)) ? Number(body.sort) : 0,
      status: body.status || 'enabled',
      meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
    }
  }

  // 校验菜单请求体
  async validatePayload(payload, currentMenuId = '') {
    if (!payload.id) {
      return '菜单 ID 不能为空'
    }

    if (this.isDefaultMenu(payload.id)) {
      return '默认菜单不允许管理'
    }

    if (payload.id.length > 32) {
      return '菜单 ID 不能超过 32 个字符'
    }

    if (!/^[a-z][a-z0-9_-]*$/.test(payload.id)) {
      return '菜单 ID 只能使用小写字母、数字、下划线和中划线'
    }

    if (!payload.name) {
      return '菜单名称不能为空'
    }

    if (payload.name.length > 64) {
      return '菜单名称不能超过 64 个字符'
    }

    if (!payload.path) {
      return '菜单路径不能为空'
    }

    if (payload.path.length > 128) {
      return '菜单路径不能超过 128 个字符'
    }

    if (!MENU_STATUS_LIST.includes(payload.status)) {
      return '菜单状态不正确'
    }

    if (payload.sort < 0) {
      return '排序不能小于 0'
    }

    if (!payload.parentId) {
      return ''
    }

    if (payload.parentId === payload.id || payload.parentId === currentMenuId) {
      return '父级菜单不能选择自己'
    }

    if (this.isDefaultMenu(payload.parentId)) {
      return '默认菜单不能作为父级菜单'
    }

    const parentMenu = await this.ctx.service.menu.findById(payload.parentId)

    if (!parentMenu) {
      return '父级菜单不存在'
    }

    if (currentMenuId) {
      const parentIsDescendant = await this.ctx.service.menu.isDescendantOf(payload.parentId, currentMenuId)

      if (parentIsDescendant) {
        return '父级菜单不能选择自己的子菜单'
      }
    }

    return ''
  }

  // 判断是否默认菜单
  isDefaultMenu(menuId) {
    return menuId === DEFAULT_MENU_ID
  }
}

module.exports = AdminMenuController
