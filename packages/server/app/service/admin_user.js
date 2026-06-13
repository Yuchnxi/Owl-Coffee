'use strict'

const bcrypt = require('bcryptjs')
const Service = require('egg').Service

class AdminUserService extends Service {
  // 查询后台账号列表
  async listAdminUsers(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildAdminUserWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM admin_users au
        LEFT JOIN roles r ON r.id = au.role_id AND r.deleted_at IS NULL
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          au.id,
          au.account,
          au.name,
          au.phone,
          au.role_id AS roleId,
          r.name AS roleName,
          r.code AS roleCode,
          au.status,
          au.last_login_at AS lastLoginAt,
          au.created_at AS createdAt,
          au.updated_at AS updatedAt
        FROM admin_users au
        LEFT JOIN roles r ON r.id = au.role_id AND r.deleted_at IS NULL
        WHERE ${conditions.join(' AND ')}
        ORDER BY au.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatAdminUser(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询后台账号详情
  async findAdminUserDetail(adminUserId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          au.id,
          au.account,
          au.name,
          au.phone,
          au.avatar_url AS avatarUrl,
          au.role_id AS roleId,
          r.name AS roleName,
          r.code AS roleCode,
          au.status,
          au.last_login_at AS lastLoginAt,
          au.created_at AS createdAt,
          au.updated_at AS updatedAt,
          au.created_by AS createdBy,
          au.updated_by AS updatedBy
        FROM admin_users au
        LEFT JOIN roles r ON r.id = au.role_id AND r.deleted_at IS NULL
        WHERE au.id = :adminUserId
          AND au.deleted_at IS NULL
        LIMIT 1
      `,
      { adminUserId }
    )

    return rows[0] ? this.formatAdminUser(rows[0]) : null
  }

  // 新增后台账号
  async createAdminUser(data, operatorId) {
    const role = await this.findEnabledRole(data.roleId)

    if (!role) {
      return { error: '角色不存在或已禁用' }
    }

    const accountExists = await this.existsByAccount(data.account)

    if (accountExists) {
      return { error: '登录账号已存在', conflict: true }
    }

    const id = this.service.authToken.createId('admin')
    const passwordHash = await bcrypt.hash(data.password, 10)

    await this.app.mysql.execute(
      `
        INSERT INTO admin_users (
          id,
          account,
          password_hash,
          name,
          phone,
          avatar_url,
          role_id,
          status,
          last_login_at,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by
        )
        VALUES (
          :id,
          :account,
          :passwordHash,
          :name,
          :phone,
          NULL,
          :roleId,
          :status,
          NULL,
          NOW(3),
          NOW(3),
          NULL,
          :operatorId,
          :operatorId
        )
      `,
      {
        id,
        account: data.account,
        passwordHash,
        name: data.name,
        phone: data.phone || null,
        roleId: data.roleId,
        status: data.status,
        operatorId,
      }
    )

    return { data: await this.findAdminUserDetail(id) }
  }

  // 编辑后台账号
  async updateAdminUser(adminUserId, data, operatorId) {
    const current = await this.findAdminUserDetail(adminUserId)

    if (!current) {
      return { notFound: true }
    }

    const role = await this.findEnabledRole(data.roleId)

    if (!role) {
      return { error: '角色不存在或已禁用' }
    }

    if (current.status === 'enabled' && current.roleCode === 'admin' && role.code !== 'admin') {
      const canChangeRole = await this.canReduceEnabledAdmin(adminUserId)

      if (!canChangeRole) {
        return { error: '至少需要保留一个启用状态的管理员账号' }
      }
    }

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET
          name = :name,
          phone = :phone,
          role_id = :roleId,
          updated_at = NOW(3),
          updated_by = :operatorId
        WHERE id = :adminUserId
          AND deleted_at IS NULL
      `,
      {
        adminUserId,
        name: data.name,
        phone: data.phone || null,
        roleId: data.roleId,
        operatorId,
      }
    )

    return { data: await this.findAdminUserDetail(adminUserId) }
  }

  // 更新后台账号状态
  async updateAdminUserStatus(adminUserId, status, operatorId) {
    const current = await this.findAdminUserDetail(adminUserId)

    if (!current) {
      return { notFound: true }
    }

    if (adminUserId === operatorId && status === 'disabled') {
      return { error: '不能禁用当前登录账号' }
    }

    if (status === 'disabled' && current.status === 'enabled' && current.roleCode === 'admin') {
      const canDisable = await this.canReduceEnabledAdmin(adminUserId)

      if (!canDisable) {
        return { error: '至少需要保留一个启用状态的管理员账号' }
      }
    }

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET
          status = :status,
          updated_at = NOW(3),
          updated_by = :operatorId
        WHERE id = :adminUserId
          AND deleted_at IS NULL
      `,
      { adminUserId, status, operatorId }
    )

    return { data: await this.findAdminUserDetail(adminUserId) }
  }

  // 重置后台账号密码
  async resetAdminUserPassword(adminUserId, password, operatorId) {
    const current = await this.findAdminUserDetail(adminUserId)

    if (!current) {
      return { notFound: true }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET
          password_hash = :passwordHash,
          updated_at = NOW(3),
          updated_by = :operatorId
        WHERE id = :adminUserId
          AND deleted_at IS NULL
      `,
      { adminUserId, passwordHash, operatorId }
    )

    return { data: await this.findAdminUserDetail(adminUserId) }
  }

  // 删除后台账号
  async deleteAdminUser(adminUserId, operatorId) {
    const current = await this.findAdminUserDetail(adminUserId)

    if (!current) {
      return { notFound: true }
    }

    if (adminUserId === operatorId) {
      return { error: '不能删除当前登录账号' }
    }

    if (current.status === 'enabled' && current.roleCode === 'admin') {
      const canDelete = await this.canReduceEnabledAdmin(adminUserId)

      if (!canDelete) {
        return { error: '至少需要保留一个启用状态的管理员账号' }
      }
    }

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET
          deleted_at = NOW(3),
          updated_at = NOW(3),
          updated_by = :operatorId
        WHERE id = :adminUserId
          AND deleted_at IS NULL
      `,
      { adminUserId, operatorId }
    )

    return { data: {} }
  }

  // 查询启用角色
  async listEnabledRoles() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, name, code, description, status
        FROM roles
        WHERE deleted_at IS NULL
          AND status = 'enabled'
        ORDER BY created_at ASC, id ASC
      `
    )

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      status: row.status,
    }))
  }

  // 根据 ID 查询启用角色
  async findEnabledRole(roleId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, name, code, status
        FROM roles
        WHERE id = :roleId
          AND deleted_at IS NULL
          AND status = 'enabled'
        LIMIT 1
      `,
      { roleId }
    )

    return rows[0] || null
  }

  // 判断账号是否已存在
  async existsByAccount(account) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id
        FROM admin_users
        WHERE account = :account
        LIMIT 1
      `,
      { account }
    )

    return Boolean(rows[0])
  }

  // 判断是否允许减少一个启用管理员
  async canReduceEnabledAdmin(adminUserId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM admin_users au
        INNER JOIN roles r ON r.id = au.role_id
        WHERE au.deleted_at IS NULL
          AND au.status = 'enabled'
          AND r.deleted_at IS NULL
          AND r.status = 'enabled'
          AND r.code = 'admin'
          AND au.id != :adminUserId
      `,
      { adminUserId }
    )

    return Number(rows[0].total) > 0
  }

  // 构造后台账号查询条件
  buildAdminUserWhere(filters) {
    const conditions = ['au.deleted_at IS NULL']
    const params = {}

    if (filters.account) {
      conditions.push('au.account LIKE :account')
      params.account = `%${filters.account}%`
    }

    if (filters.name) {
      conditions.push('au.name LIKE :name')
      params.name = `%${filters.name}%`
    }

    if (filters.phone) {
      conditions.push('au.phone LIKE :phone')
      params.phone = `%${filters.phone}%`
    }

    if (filters.roleId) {
      conditions.push('au.role_id = :roleId')
      params.roleId = filters.roleId
    }

    if (filters.status) {
      conditions.push('au.status = :status')
      params.status = filters.status
    }

    return { conditions, params }
  }

  // 标准化分页参数
  normalizePagination(filters) {
    const page = Math.max(Number(filters.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100)

    return { page, pageSize }
  }

  // 格式化后台账号响应
  formatAdminUser(row) {
    return {
      id: row.id,
      account: row.account,
      name: row.name,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      roleId: row.roleId,
      roleName: row.roleName,
      roleCode: row.roleCode,
      status: row.status,
      lastLoginAt: this.formatTime(row.lastLoginAt),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
    }
  }

  // 格式化分页响应
  formatPagination(page, pageSize, total) {
    return {
      page,
      pageSize,
      total,
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

module.exports = AdminUserService
