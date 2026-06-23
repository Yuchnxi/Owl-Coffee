'use strict'

const Service = require('egg').Service

class UserService extends Service {
  // 查询后台用户列表
  async listAdminUsers(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildUserWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM users
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          avatar_url AS avatarUrl,
          nickname,
          gender,
          phone,
          order_count AS orderCount,
          total_consume_amount AS totalConsumeAmount,
          user_status AS userStatus,
          created_at AS createdAt
        FROM users
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatUserListItem(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询后台用户详情
  async findAdminUserDetail(userId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          openid,
          unionid,
          avatar_url AS avatarUrl,
          nickname,
          gender,
          phone,
          phone_bound AS phoneBound,
          user_status AS userStatus,
          order_count AS orderCount,
          total_consume_amount AS totalConsumeAmount,
          last_order_at AS lastOrderAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM users
        WHERE id = :userId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { userId }
    )

    if (!rows[0]) {
      return null
    }

    return this.formatUserDetail(rows[0])
  }

  // 更新小程序用户状态
  async updateUserStatus(userId, userStatus, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE users
        SET
          user_status = :userStatus,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :userId
          AND deleted_at IS NULL
      `,
      { userId, userStatus, adminUserId }
    )

    if (result.affectedRows === 0) {
      return null
    }

    return this.findAdminUserDetail(userId)
  }

  // 构造用户查询条件
  buildUserWhere(filters) {
    const conditions = ['deleted_at IS NULL']
    const params = {}

    if (filters.nickname) {
      conditions.push('nickname LIKE :nickname')
      params.nickname = `%${filters.nickname}%`
    }

    if (filters.phone) {
      conditions.push('phone LIKE :phone')
      params.phone = `%${filters.phone}%`
    }

    if (filters.userStatus) {
      conditions.push('user_status = :userStatus')
      params.userStatus = filters.userStatus
    }

    if (filters.startTime) {
      conditions.push('created_at >= :startTime')
      params.startTime = filters.startTime
    }

    if (filters.endTime) {
      conditions.push('created_at <= :endTime')
      params.endTime = filters.endTime
    }

    return { conditions, params }
  }

  // 标准化分页参数
  normalizePagination(filters) {
    const page = Math.max(Number(filters.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100)

    return { page, pageSize }
  }

  // 格式化分页响应
  formatPagination(page, pageSize, total) {
    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // 格式化后台用户列表项
  formatUserListItem(user) {
    return {
      id: user.id,
      avatarUrl: user.avatarUrl,
      nickname: user.nickname,
      gender: user.gender,
      phone: user.phone,
      orderCount: Number(user.orderCount),
      totalConsumeAmount: Number(user.totalConsumeAmount),
      userStatus: user.userStatus,
      createdAt: this.formatTime(user.createdAt),
    }
  }

  // 格式化后台用户详情
  formatUserDetail(user) {
    return {
      id: user.id,
      openidBound: Boolean(user.openid),
      unionidBound: Boolean(user.unionid),
      avatarUrl: user.avatarUrl,
      nickname: user.nickname,
      gender: user.gender,
      phone: user.phone,
      phoneBound: Boolean(user.phoneBound),
      orderCount: Number(user.orderCount),
      totalConsumeAmount: Number(user.totalConsumeAmount),
      userStatus: user.userStatus,
      lastOrderAt: this.formatTime(user.lastOrderAt),
      createdAt: this.formatTime(user.createdAt),
      updatedAt: this.formatTime(user.updatedAt),
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

module.exports = UserService
