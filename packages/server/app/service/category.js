'use strict'

const Service = require('egg').Service

class CategoryService extends Service {
  // 查询后台分类列表
  async listAdminCategories(filters = {}) {
    const conditions = ['deleted_at IS NULL']
    const params = {}

    if (filters.name) {
      conditions.push('name LIKE :name')
      params.name = `%${filters.name}%`
    }

    if (filters.status) {
      conditions.push('status = :status')
      params.status = filters.status
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, name, sort, status, created_at AS createdAt, updated_at AS updatedAt
        FROM categories
        WHERE ${conditions.join(' AND ')}
        ORDER BY sort ASC, created_at DESC
      `,
      params
    )

    return rows.map(row => this.formatCategory(row))
  }

  // 查询公开启用分类列表
  async listEnabledCategories() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, name, sort, status, created_at AS createdAt, updated_at AS updatedAt
        FROM categories
        WHERE deleted_at IS NULL
          AND status = 'enabled'
        ORDER BY sort ASC, created_at DESC
      `
    )

    return rows.map(row => this.formatCategory(row))
  }

  // 根据分类 ID 查询分类
  async findById(categoryId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, name, sort, status, created_at AS createdAt, updated_at AS updatedAt
        FROM categories
        WHERE id = :categoryId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { categoryId }
    )

    return rows[0] ? this.formatCategory(rows[0]) : null
  }

  // 判断分类名称是否重复
  async existsByName(name, excludeId = '') {
    const params = { name }
    const conditions = ['name = :name', 'deleted_at IS NULL']

    if (excludeId) {
      conditions.push('id != :excludeId')
      params.excludeId = excludeId
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT id
        FROM categories
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      params
    )

    return rows.length > 0
  }

  // 创建商品分类
  async createCategory(data, adminUserId) {
    const id = this.service.authToken.createId('cat')

    await this.app.mysql.execute(
      `
        INSERT INTO categories (
          id,
          name,
          sort,
          status,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by
        )
        VALUES (
          :id,
          :name,
          :sort,
          :status,
          NOW(3),
          NOW(3),
          NULL,
          :adminUserId,
          :adminUserId
        )
      `,
      {
        id,
        name: data.name,
        sort: data.sort,
        status: data.status,
        adminUserId,
      }
    )

    return this.findById(id)
  }

  // 更新商品分类
  async updateCategory(categoryId, data, adminUserId) {
    await this.app.mysql.execute(
      `
        UPDATE categories
        SET
          name = :name,
          sort = :sort,
          status = :status,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :categoryId
          AND deleted_at IS NULL
      `,
      {
        categoryId,
        name: data.name,
        sort: data.sort,
        status: data.status,
        adminUserId,
      }
    )

    return this.findById(categoryId)
  }

  // 软删除商品分类
  async deleteCategory(categoryId, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE categories
        SET
          deleted_at = NOW(3),
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :categoryId
          AND deleted_at IS NULL
      `,
      { categoryId, adminUserId }
    )

    return result.affectedRows > 0
  }

  // 格式化分类响应
  formatCategory(category) {
    return {
      id: category.id,
      name: category.name,
      sort: category.sort,
      status: category.status,
      createdAt: this.formatTime(category.createdAt),
      updatedAt: this.formatTime(category.updatedAt),
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

module.exports = CategoryService
