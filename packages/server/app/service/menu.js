'use strict'

const Service = require('egg').Service

const DEFAULT_MENU_ID = 'dashboard'

class MenuService extends Service {
  // 查询后台可管理菜单树
  async listMenuTree() {
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
        WHERE deleted_at IS NULL
          AND id != :defaultMenuId
        ORDER BY sort ASC, created_at ASC
      `,
      { defaultMenuId: DEFAULT_MENU_ID }
    )

    return {
      list: this.buildMenuTree(rows.map(row => this.formatMenu(row))),
    }
  }

  // 根据菜单 ID 查询菜单
  async findById(menuId) {
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
        WHERE id = :menuId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { menuId }
    )

    return rows[0] ? this.formatMenu(rows[0]) : null
  }

  // 判断菜单 ID 是否已占用
  async existsById(menuId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id
        FROM menus
        WHERE id = :menuId
        LIMIT 1
      `,
      { menuId }
    )

    return rows.length > 0
  }

  // 判断菜单是否存在子菜单
  async hasChildren(menuId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id
        FROM menus
        WHERE parent_id = :menuId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { menuId }
    )

    return rows.length > 0
  }

  // 新增后台菜单
  async createMenu(data) {
    await this.app.mysql.execute(
      `
        INSERT INTO menus (
          id,
          parent_id,
          name,
          path,
          icon,
          sort,
          status,
          meta,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (
          :id,
          :parentId,
          :name,
          :path,
          :icon,
          :sort,
          :status,
          :meta,
          NOW(3),
          NOW(3),
          NULL
        )
      `,
      this.toSqlPayload(data)
    )

    return this.findById(data.id)
  }

  // 编辑后台菜单
  async updateMenu(menuId, data) {
    await this.app.mysql.execute(
      `
        UPDATE menus
        SET
          parent_id = :parentId,
          name = :name,
          path = :path,
          icon = :icon,
          sort = :sort,
          status = :status,
          meta = :meta,
          updated_at = NOW(3)
        WHERE id = :menuId
          AND deleted_at IS NULL
      `,
      {
        ...this.toSqlPayload(data),
        menuId,
      }
    )

    return this.findById(menuId)
  }

  // 更新后台菜单状态
  async updateMenuStatus(menuId, status) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE menus
        SET status = :status, updated_at = NOW(3)
        WHERE id = :menuId
          AND deleted_at IS NULL
      `,
      { menuId, status }
    )

    if (result.affectedRows === 0) {
      return null
    }

    return this.findById(menuId)
  }

  // 软删除后台菜单
  async deleteMenu(menuId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      const [result] = await connection.execute(
        `
          UPDATE menus
          SET deleted_at = NOW(3), updated_at = NOW(3)
          WHERE id = :menuId
            AND deleted_at IS NULL
        `,
        { menuId }
      )

      await connection.execute(
        'DELETE FROM role_menus WHERE menu_id = :menuId',
        { menuId }
      )

      await connection.commit()
      return result.affectedRows > 0
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
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

  // 转换菜单写入参数
  toSqlPayload(data) {
    return {
      id: data.id,
      parentId: data.parentId,
      name: data.name,
      path: data.path,
      icon: data.icon,
      sort: data.sort,
      status: data.status,
      meta: data.meta ? JSON.stringify(data.meta) : null,
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

module.exports = MenuService
