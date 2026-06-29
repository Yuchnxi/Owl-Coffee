'use strict'

const Service = require('egg').Service

const BANNER_STATUS_TO_DB = {
  enabled: 'enabled',
  disabled: 'disabled',
}

const BANNER_STATUS_TO_API = {
  enabled: 'enabled',
  disabled: 'disabled',
}

class BannerService extends Service {
  // 查询后台轮播图列表
  async listAdminBanners(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildBannerWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM banners
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          title,
          kicker,
          image_url AS imageUrl,
          link_type AS linkType,
          link_url AS linkUrl,
          sort,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM banners
        WHERE ${conditions.join(' AND ')}
        ORDER BY sort ASC, created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatBanner(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询小程序启用轮播图
  async listAppBanners() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          title,
          kicker,
          image_url AS imageUrl,
          link_type AS linkType,
          link_url AS linkUrl,
          sort,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM banners
        WHERE deleted_at IS NULL
          AND status = 'enabled'
        ORDER BY sort ASC, created_at DESC
      `
    )

    return {
      list: rows.map(row => this.formatBanner(row)),
    }
  }

  // 根据 ID 查询轮播图
  async findById(bannerId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          title,
          kicker,
          image_url AS imageUrl,
          link_type AS linkType,
          link_url AS linkUrl,
          sort,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM banners
        WHERE id = :bannerId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { bannerId }
    )

    return rows[0] ? this.formatBanner(rows[0]) : null
  }

  // 新增轮播图
  async createBanner(data, adminUserId) {
    const bannerId = this.service.authToken.createId('banner')

    await this.app.mysql.execute(
      `
        INSERT INTO banners (
          id,
          title,
          kicker,
          image_url,
          link_type,
          link_url,
          sort,
          status,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by
        )
        VALUES (
          :bannerId,
          :title,
          :kicker,
          :imageUrl,
          :linkType,
          :linkUrl,
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
        bannerId,
        ...this.toDbParams(data),
        adminUserId,
      }
    )

    return this.findById(bannerId)
  }

  // 编辑轮播图
  async updateBanner(bannerId, data, adminUserId) {
    await this.app.mysql.execute(
      `
        UPDATE banners
        SET
          title = :title,
          kicker = :kicker,
          image_url = :imageUrl,
          link_type = :linkType,
          link_url = :linkUrl,
          sort = :sort,
          status = :status,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :bannerId
          AND deleted_at IS NULL
      `,
      {
        bannerId,
        ...this.toDbParams(data),
        adminUserId,
      }
    )

    return this.findById(bannerId)
  }

  // 更新轮播图状态
  async updateBannerStatus(bannerId, status, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE banners
        SET status = :status, updated_at = NOW(3), updated_by = :adminUserId
        WHERE id = :bannerId
          AND deleted_at IS NULL
      `,
      {
        bannerId,
        status: this.toDbStatus(status),
        adminUserId,
      }
    )

    if (result.affectedRows === 0) {
      return null
    }

    return this.findById(bannerId)
  }

  // 软删除轮播图
  async deleteBanner(bannerId, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE banners
        SET deleted_at = NOW(3), updated_at = NOW(3), updated_by = :adminUserId
        WHERE id = :bannerId
          AND deleted_at IS NULL
      `,
      { bannerId, adminUserId }
    )

    return result.affectedRows > 0
  }

  // 构造轮播图查询条件
  buildBannerWhere(filters) {
    const conditions = ['deleted_at IS NULL']
    const params = {}

    if (filters.title) {
      conditions.push('title LIKE :title')
      params.title = `%${filters.title}%`
    }

    if (filters.status) {
      conditions.push('status = :status')
      params.status = this.toDbStatus(filters.status)
    }

    return { conditions, params }
  }

  // 转换写入参数
  toDbParams(data) {
    return {
      title: data.title,
      kicker: data.kicker || null,
      imageUrl: data.imageUrl,
      linkType: data.linkType || 'none',
      linkUrl: data.linkType === 'none' ? null : (data.linkUrl || null),
      sort: Number(data.sort) || 0,
      status: this.toDbStatus(data.status),
    }
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

  // 格式化轮播图响应
  formatBanner(row) {
    return {
      id: row.id,
      title: row.title,
      kicker: row.kicker,
      imageUrl: row.imageUrl,
      linkType: row.linkType || 'none',
      linkUrl: row.linkUrl,
      sort: Number(row.sort),
      status: this.toApiStatus(row.status),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 转换接口状态为数据库状态
  toDbStatus(status) {
    return BANNER_STATUS_TO_DB[status] || status
  }

  // 转换数据库状态为接口状态
  toApiStatus(status) {
    return BANNER_STATUS_TO_API[status] || status
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = BannerService
