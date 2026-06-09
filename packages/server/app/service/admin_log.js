'use strict'

const Service = require('egg').Service

class AdminLogService extends Service {
  // 写入后台登录日志
  async createLoginLog(data) {
    await this.app.mysql.execute(
      `
        INSERT INTO admin_login_logs (
          id,
          admin_user_id,
          account,
          login_result,
          ip,
          user_agent,
          message,
          created_at
        )
        VALUES (
          :id,
          :adminUserId,
          :account,
          :loginResult,
          :ip,
          :userAgent,
          :message,
          NOW(3)
        )
      `,
      {
        id: this.service.authToken.createId('log'),
        adminUserId: data.adminUserId || null,
        account: data.account || '',
        loginResult: data.loginResult,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        message: data.message || null,
      }
    )
  }

  // 写入后台操作日志
  async createOperationLog(data) {
    await this.app.mysql.execute(
      `
        INSERT INTO admin_operation_logs (
          id,
          admin_user_id,
          module,
          action,
          target_id,
          summary,
          ip,
          created_at
        )
        VALUES (
          :id,
          :adminUserId,
          :module,
          :action,
          :targetId,
          :summary,
          :ip,
          NOW(3)
        )
      `,
      {
        id: this.service.authToken.createId('log'),
        adminUserId: data.adminUserId || null,
        module: data.module,
        action: data.action,
        targetId: data.targetId || null,
        summary: data.summary || null,
        ip: data.ip || null,
      }
    )
  }

  // 查询后台登录日志
  async listLoginLogs(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildLoginLogWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM admin_login_logs
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          admin_user_id AS adminUserId,
          account,
          login_result AS loginResult,
          ip,
          user_agent AS userAgent,
          message,
          created_at AS createdAt
        FROM admin_login_logs
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatLoginLog(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询后台操作日志
  async listOperationLogs(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildOperationLogWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM admin_operation_logs
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          admin_user_id AS adminUserId,
          module,
          action,
          target_id AS targetId,
          summary,
          ip,
          created_at AS createdAt
        FROM admin_operation_logs
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatOperationLog(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 构造登录日志查询条件
  buildLoginLogWhere(filters) {
    const conditions = ['1 = 1']
    const params = {}

    if (filters.account) {
      conditions.push('account LIKE :account')
      params.account = `%${filters.account}%`
    }

    if (filters.loginResult) {
      conditions.push('login_result = :loginResult')
      params.loginResult = filters.loginResult
    }

    if (filters.startTime) {
      conditions.push('created_at >= :startTime')
      params.startTime = this.formatDbDateTime(filters.startTime)
    }

    if (filters.endTime) {
      conditions.push('created_at <= :endTime')
      params.endTime = this.formatDbDateTime(filters.endTime)
    }

    return { conditions, params }
  }

  // 构造操作日志查询条件
  buildOperationLogWhere(filters) {
    const conditions = ['1 = 1']
    const params = {}

    if (filters.module) {
      conditions.push('module = :module')
      params.module = filters.module
    }

    if (filters.action) {
      conditions.push('action = :action')
      params.action = filters.action
    }

    if (filters.adminUserId) {
      conditions.push('admin_user_id = :adminUserId')
      params.adminUserId = filters.adminUserId
    }

    if (filters.startTime) {
      conditions.push('created_at >= :startTime')
      params.startTime = this.formatDbDateTime(filters.startTime)
    }

    if (filters.endTime) {
      conditions.push('created_at <= :endTime')
      params.endTime = this.formatDbDateTime(filters.endTime)
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

  // 格式化登录日志
  formatLoginLog(row) {
    return {
      id: row.id,
      adminUserId: row.adminUserId,
      account: row.account,
      loginResult: row.loginResult,
      ip: row.ip,
      userAgent: row.userAgent,
      message: row.message,
      createdAt: this.formatTime(row.createdAt),
    }
  }

  // 格式化操作日志
  formatOperationLog(row) {
    return {
      id: row.id,
      adminUserId: row.adminUserId,
      module: row.module,
      action: row.action,
      targetId: row.targetId,
      summary: row.summary,
      ip: row.ip,
      createdAt: this.formatTime(row.createdAt),
    }
  }

  // 格式化数据库时间字段
  formatDbDateTime(value) {
    const date = new Date(value)
    const pad = (number, size = 2) => String(number).padStart(size, '0')

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join('-') + ' ' + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join(':') + `.${pad(date.getMilliseconds(), 3)}`
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = AdminLogService
