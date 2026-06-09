'use strict'

const Service = require('egg').Service

class RoleService extends Service {
  // 查询后台角色列表
  async listRoles() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          r.id,
          r.name,
          r.code,
          r.description,
          r.status,
          r.created_at AS createdAt,
          r.updated_at AS updatedAt,
          COUNT(rm.menu_id) AS menuCount
        FROM roles r
        LEFT JOIN role_menus rm ON rm.role_id = r.id
        WHERE r.deleted_at IS NULL
        GROUP BY r.id
        ORDER BY r.created_at ASC, r.id ASC
      `
    )

    return {
      list: rows.map(row => this.formatRole(row)),
    }
  }

  // 查询后台角色详情
  async findRoleDetail(roleId) {
    const role = await this.findRoleById(roleId)

    if (!role) {
      return null
    }

    const menus = await this.listRoleMenus(roleId)

    return {
      ...role,
      menuIds: menus.map(menu => menu.id),
      menus: this.buildMenuTree(menus),
    }
  }

  // 根据 ID 查询角色
  async findRoleById(roleId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          name,
          code,
          description,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM roles
        WHERE id = :roleId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { roleId }
    )

    return rows[0] ? this.formatRole(rows[0]) : null
  }

  // 查询角色拥有的菜单
  async listRoleMenus(roleId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          m.id,
          m.parent_id AS parentId,
          m.name,
          m.path,
          m.icon,
          m.sort,
          m.status,
          m.meta,
          m.created_at AS createdAt,
          m.updated_at AS updatedAt
        FROM role_menus rm
        INNER JOIN menus m ON m.id = rm.menu_id
        WHERE rm.role_id = :roleId
          AND m.deleted_at IS NULL
        ORDER BY m.sort ASC, m.created_at ASC
      `,
      { roleId }
    )

    return rows.map(row => this.formatMenu(row))
  }

  // 查询后台菜单树
  async listMenuTree(onlyEnabled = false) {
    const conditions = ['deleted_at IS NULL']

    if (onlyEnabled) {
      conditions.push("status = 'enabled'")
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          parent_id AS parentId,
          name,
          path,
          icon,
          sort,
          status,
          meta,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM menus
        WHERE ${conditions.join(' AND ')}
        ORDER BY sort ASC, created_at ASC
      `
    )

    return {
      list: this.buildMenuTree(rows.map(row => this.formatMenu(row))),
    }
  }

  // 更新角色菜单权限
  async updateRoleMenus(roleId, menuIds) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      await connection.execute(
        'DELETE FROM role_menus WHERE role_id = :roleId',
        { roleId }
      )

      for (const menuId of menuIds) {
        await connection.execute(
          `
            INSERT INTO role_menus (role_id, menu_id, created_at)
            VALUES (:roleId, :menuId, NOW(3))
          `,
          { roleId, menuId }
        )
      }

      await connection.commit()
      return this.findRoleDetail(roleId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 判断菜单 ID 是否全部有效
  async areMenuIdsValid(menuIds) {
    if (menuIds.length === 0) {
      return true
    }

    const placeholders = menuIds.map((_, index) => `:menuId${index}`)
    const params = {}

    menuIds.forEach((menuId, index) => {
      params[`menuId${index}`] = menuId
    })

    const [rows] = await this.app.mysql.execute(
      `
        SELECT id
        FROM menus
        WHERE id IN (${placeholders.join(', ')})
          AND deleted_at IS NULL
          AND status = 'enabled'
      `,
      params
    )

    return rows.length === menuIds.length
  }

  // 构建菜单树
  buildMenuTree(menus) {
    const menuMap = new Map()
    const roots = []

    for (const menu of menus) {
      menuMap.set(menu.id, {
        ...menu,
        children: [],
      })
    }

    for (const menu of menuMap.values()) {
      if (menu.parentId && menuMap.has(menu.parentId)) {
        menuMap.get(menu.parentId).children.push(menu)
      } else {
        roots.push(menu)
      }
    }

    return roots
  }

  // 格式化角色响应
  formatRole(row) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      status: row.status,
      menuCount: row.menuCount === undefined ? undefined : Number(row.menuCount),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 格式化菜单响应
  formatMenu(row) {
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      path: row.path,
      icon: row.icon,
      sort: Number(row.sort),
      status: row.status,
      meta: this.parseJson(row.meta),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 解析 JSON 字段
  parseJson(value) {
    if (!value) {
      return null
    }

    if (typeof value === 'object') {
      return value
    }

    try {
      return JSON.parse(value)
    } catch (err) {
      return null
    }
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = RoleService
