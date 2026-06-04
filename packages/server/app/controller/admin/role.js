'use strict'

const Controller = require('egg').Controller

class AdminRoleController extends Controller {
  // 查询后台角色列表
  async index() {
    const result = await this.ctx.service.role.listRoles()

    this.ctx.success(result)
  }

  // 查询后台角色详情
  async show() {
    const { ctx } = this
    const role = await ctx.service.role.findRoleDetail(ctx.params.roleId)

    if (!role) {
      ctx.status = 404
      ctx.fail(10002, '角色不存在')
      return
    }

    ctx.success(role)
  }

  // 更新角色菜单权限
  async updateMenus() {
    const { ctx } = this
    const role = await ctx.service.role.findRoleById(ctx.params.roleId)

    if (!role) {
      ctx.status = 404
      ctx.fail(10002, '角色不存在')
      return
    }

    const menuIds = this.normalizeMenuIds((ctx.request.body || {}).menuIds)
    const errorMessage = await this.validateMenuIds(menuIds)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const updatedRole = await ctx.service.role.updateRoleMenus(ctx.params.roleId, menuIds)

    ctx.success(updatedRole)
  }

  // 查询后台菜单树
  async menus() {
    const result = await this.ctx.service.role.listMenuTree(true)

    this.ctx.success(result)
  }

  // 标准化菜单 ID 列表
  normalizeMenuIds(menuIds) {
    if (!Array.isArray(menuIds)) {
      return []
    }

    return Array.from(new Set(menuIds.filter(menuId => typeof menuId === 'string' && menuId.trim())))
  }

  // 校验菜单 ID 列表
  async validateMenuIds(menuIds) {
    const valid = await this.ctx.service.role.areMenuIdsValid(menuIds)

    if (!valid) {
      return '菜单权限不正确'
    }

    return ''
  }
}

module.exports = AdminRoleController
