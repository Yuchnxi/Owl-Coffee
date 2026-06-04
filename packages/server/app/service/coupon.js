'use strict'

const Service = require('egg').Service

const COUPON_TYPE_TO_DB = {
  discountAmount: 'discount_amount',
  discountRate: 'discount_rate',
}

const COUPON_TYPE_TO_API = {
  discount_amount: 'discountAmount',
  discount_rate: 'discountRate',
}

const COUPON_STATUS_TO_DB = {
  notStarted: 'not_started',
  active: 'active',
  ended: 'ended',
  disabled: 'disabled',
}

const COUPON_STATUS_TO_API = {
  not_started: 'notStarted',
  active: 'active',
  ended: 'ended',
  disabled: 'disabled',
}

class CouponService extends Service {
  // 查询后台优惠券列表
  async listAdminCoupons(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildCouponWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM coupons
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          name,
          coupon_type AS couponType,
          threshold_amount AS thresholdAmount,
          discount_amount AS discountAmount,
          discount_rate AS discountRate,
          total_quantity AS totalQuantity,
          used_quantity AS usedQuantity,
          limit_per_user AS limitPerUser,
          valid_start_at AS validStartAt,
          valid_end_at AS validEndAt,
          coupon_status AS couponStatus,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM coupons
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatCoupon(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 根据 ID 查询优惠券
  async findById(couponId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          name,
          coupon_type AS couponType,
          threshold_amount AS thresholdAmount,
          discount_amount AS discountAmount,
          discount_rate AS discountRate,
          total_quantity AS totalQuantity,
          used_quantity AS usedQuantity,
          limit_per_user AS limitPerUser,
          valid_start_at AS validStartAt,
          valid_end_at AS validEndAt,
          coupon_status AS couponStatus,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM coupons
        WHERE id = :couponId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { couponId }
    )

    return rows[0] ? this.formatCoupon(rows[0]) : null
  }

  // 创建优惠券模板
  async createCoupon(data, adminUserId) {
    const couponId = this.service.authToken.createId('coupon')

    await this.app.mysql.execute(
      `
        INSERT INTO coupons (
          id,
          name,
          coupon_type,
          threshold_amount,
          discount_amount,
          discount_rate,
          total_quantity,
          used_quantity,
          limit_per_user,
          valid_start_at,
          valid_end_at,
          coupon_status,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by
        )
        VALUES (
          :couponId,
          :name,
          :couponType,
          :thresholdAmount,
          :discountAmount,
          :discountRate,
          :totalQuantity,
          0,
          :limitPerUser,
          :validStartAt,
          :validEndAt,
          :couponStatus,
          NOW(3),
          NOW(3),
          NULL,
          :adminUserId,
          :adminUserId
        )
      `,
      {
        couponId,
        ...this.toDbParams(data),
        adminUserId,
      }
    )

    return this.findById(couponId)
  }

  // 更新优惠券模板
  async updateCoupon(couponId, data, adminUserId) {
    await this.app.mysql.execute(
      `
        UPDATE coupons
        SET
          name = :name,
          coupon_type = :couponType,
          threshold_amount = :thresholdAmount,
          discount_amount = :discountAmount,
          discount_rate = :discountRate,
          total_quantity = :totalQuantity,
          limit_per_user = :limitPerUser,
          valid_start_at = :validStartAt,
          valid_end_at = :validEndAt,
          coupon_status = :couponStatus,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :couponId
          AND deleted_at IS NULL
      `,
      {
        couponId,
        ...this.toDbParams(data),
        adminUserId,
      }
    )

    return this.findById(couponId)
  }

  // 停用优惠券模板
  async disableCoupon(couponId, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE coupons
        SET
          coupon_status = 'disabled',
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :couponId
          AND deleted_at IS NULL
      `,
      { couponId, adminUserId }
    )

    if (result.affectedRows === 0) {
      return null
    }

    return this.findById(couponId)
  }

  // 软删除优惠券模板
  async deleteCoupon(couponId, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE coupons
        SET
          deleted_at = NOW(3),
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :couponId
          AND deleted_at IS NULL
      `,
      { couponId, adminUserId }
    )

    return result.affectedRows > 0
  }

  // 查询小程序用户优惠券列表
  async listAppCoupons(userId, status = '') {
    const conditions = ['uc.user_id = :userId']
    const params = { userId }

    if (status) {
      conditions.push('uc.coupon_status = :status')
      params.status = status
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          uc.id,
          uc.coupon_status AS userCouponStatus,
          uc.received_at AS receivedAt,
          uc.used_at AS usedAt,
          uc.order_id AS orderId,
          c.id AS couponId,
          c.name,
          c.coupon_type AS couponType,
          c.threshold_amount AS thresholdAmount,
          c.discount_amount AS discountAmount,
          c.discount_rate AS discountRate,
          c.valid_start_at AS validStartAt,
          c.valid_end_at AS validEndAt,
          c.coupon_status AS couponStatus
        FROM user_coupons uc
        INNER JOIN coupons c ON c.id = uc.coupon_id
        WHERE ${conditions.join(' AND ')}
          AND c.deleted_at IS NULL
        ORDER BY uc.received_at DESC
      `,
      params
    )

    return {
      list: rows.map(row => this.formatUserCoupon(row)),
    }
  }

  // 查询结算可用优惠券
  async listAvailableAppCoupons(userId, totalAmount) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          uc.id,
          uc.coupon_status AS userCouponStatus,
          uc.received_at AS receivedAt,
          uc.used_at AS usedAt,
          uc.order_id AS orderId,
          c.id AS couponId,
          c.name,
          c.coupon_type AS couponType,
          c.threshold_amount AS thresholdAmount,
          c.discount_amount AS discountAmount,
          c.discount_rate AS discountRate,
          c.valid_start_at AS validStartAt,
          c.valid_end_at AS validEndAt,
          c.coupon_status AS couponStatus
        FROM user_coupons uc
        INNER JOIN coupons c ON c.id = uc.coupon_id
        WHERE uc.user_id = :userId
          AND uc.coupon_status = 'available'
          AND c.coupon_status = 'active'
          AND c.deleted_at IS NULL
          AND c.valid_start_at <= NOW(3)
          AND c.valid_end_at >= NOW(3)
          AND c.threshold_amount <= :totalAmount
        ORDER BY c.threshold_amount DESC, uc.received_at DESC
      `,
      { userId, totalAmount }
    )

    return {
      list: rows.map(row => ({
        ...this.formatUserCoupon(row),
        discountAmount: this.calculateDiscountAmount(row, totalAmount),
      })),
    }
  }

  // 查询用户优惠券并校验是否可用于订单
  async findAvailableUserCoupon(connection, userId, userCouponId, totalAmount) {
    const [rows] = await connection.execute(
      `
        SELECT
          uc.id,
          uc.coupon_status AS userCouponStatus,
          uc.received_at AS receivedAt,
          uc.used_at AS usedAt,
          uc.order_id AS orderId,
          c.id AS couponId,
          c.name,
          c.coupon_type AS couponType,
          c.threshold_amount AS thresholdAmount,
          c.discount_amount AS discountAmount,
          c.discount_rate AS discountRate,
          c.valid_start_at AS validStartAt,
          c.valid_end_at AS validEndAt,
          c.coupon_status AS couponStatus
        FROM user_coupons uc
        INNER JOIN coupons c ON c.id = uc.coupon_id
        WHERE uc.id = :userCouponId
          AND uc.user_id = :userId
          AND c.deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
      `,
      { userId, userCouponId }
    )
    const coupon = rows[0]

    if (!coupon || !this.isCouponAvailable(coupon, totalAmount)) {
      return null
    }

    return {
      ...this.formatUserCoupon(coupon),
      discountAmount: this.calculateDiscountAmount(coupon, totalAmount),
    }
  }

  // 标记用户优惠券已使用
  async markUserCouponUsed(connection, userCouponId, orderId) {
    await connection.execute(
      `
        UPDATE user_coupons
        SET
          coupon_status = 'used',
          used_at = NOW(3),
          order_id = :orderId,
          updated_at = NOW(3)
        WHERE id = :userCouponId
      `,
      { userCouponId, orderId }
    )
    await connection.execute(
      `
        UPDATE coupons c
        INNER JOIN user_coupons uc ON uc.coupon_id = c.id
        SET
          c.used_quantity = c.used_quantity + 1,
          c.updated_at = NOW(3)
        WHERE uc.id = :userCouponId
      `,
      { userCouponId }
    )
  }

  // 构造优惠券查询条件
  buildCouponWhere(filters) {
    const conditions = ['deleted_at IS NULL']
    const params = {}

    if (filters.name) {
      conditions.push('name LIKE :name')
      params.name = `%${filters.name}%`
    }

    if (filters.couponType) {
      conditions.push('coupon_type = :couponType')
      params.couponType = this.toDbCouponType(filters.couponType)
    }

    if (filters.couponStatus) {
      conditions.push('coupon_status = :couponStatus')
      params.couponStatus = this.toDbCouponStatus(filters.couponStatus)
    }

    if (filters.startTime) {
      conditions.push('valid_start_at >= :startTime')
      params.startTime = this.formatDbDateTime(filters.startTime)
    }

    if (filters.endTime) {
      conditions.push('valid_end_at <= :endTime')
      params.endTime = this.formatDbDateTime(filters.endTime)
    }

    return { conditions, params }
  }

  // 转换优惠券写入参数
  toDbParams(data) {
    return {
      name: data.name,
      couponType: this.toDbCouponType(data.couponType),
      thresholdAmount: data.thresholdAmount,
      discountAmount: data.couponType === 'discountAmount' ? data.discountAmount : null,
      discountRate: data.couponType === 'discountRate' ? data.discountRate : null,
      totalQuantity: data.totalQuantity,
      limitPerUser: data.limitPerUser,
      validStartAt: this.formatDbDateTime(data.validStartAt),
      validEndAt: this.formatDbDateTime(data.validEndAt),
      couponStatus: this.toDbCouponStatus(data.couponStatus),
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

  // 格式化优惠券响应
  formatCoupon(coupon) {
    const totalQuantity = Number(coupon.totalQuantity)
    const usedQuantity = Number(coupon.usedQuantity)

    return {
      id: coupon.id,
      name: coupon.name,
      couponType: this.toApiCouponType(coupon.couponType),
      thresholdAmount: Number(coupon.thresholdAmount),
      discountAmount: coupon.discountAmount === null ? null : Number(coupon.discountAmount),
      discountRate: coupon.discountRate === null ? null : Number(coupon.discountRate),
      totalQuantity,
      usedQuantity,
      remainingQuantity: Math.max(totalQuantity - usedQuantity, 0),
      limitPerUser: Number(coupon.limitPerUser),
      validStartAt: this.formatTime(coupon.validStartAt),
      validEndAt: this.formatTime(coupon.validEndAt),
      couponStatus: this.toApiCouponStatus(coupon.couponStatus),
      createdAt: this.formatTime(coupon.createdAt),
      updatedAt: this.formatTime(coupon.updatedAt),
    }
  }

  // 格式化用户优惠券响应
  formatUserCoupon(row) {
    return {
      id: row.id,
      couponId: row.couponId,
      name: row.name,
      couponType: this.toApiCouponType(row.couponType),
      thresholdAmount: Number(row.thresholdAmount),
      discountAmount: row.discountAmount === null ? null : Number(row.discountAmount),
      discountRate: row.discountRate === null ? null : Number(row.discountRate),
      couponStatus: row.userCouponStatus,
      templateStatus: this.toApiCouponStatus(row.couponStatus),
      validStartAt: this.formatTime(row.validStartAt),
      validEndAt: this.formatTime(row.validEndAt),
      receivedAt: this.formatTime(row.receivedAt),
      usedAt: this.formatTime(row.usedAt),
      orderId: row.orderId,
    }
  }

  // 判断用户优惠券是否可用
  isCouponAvailable(row, totalAmount) {
    const now = Date.now()

    return row.userCouponStatus === 'available' &&
      row.couponStatus === 'active' &&
      new Date(row.validStartAt).getTime() <= now &&
      new Date(row.validEndAt).getTime() >= now &&
      Number(row.thresholdAmount) <= totalAmount
  }

  // 计算优惠金额
  calculateDiscountAmount(row, totalAmount) {
    if (this.toApiCouponType(row.couponType) === 'discountRate') {
      const rate = Number(row.discountRate)
      return Number((totalAmount * (10 - rate) / 10).toFixed(2))
    }

    return Math.min(Number(row.discountAmount), totalAmount)
  }

  // 转换接口优惠券类型为数据库类型
  toDbCouponType(type) {
    return COUPON_TYPE_TO_DB[type] || type
  }

  // 转换数据库优惠券类型为接口类型
  toApiCouponType(type) {
    return COUPON_TYPE_TO_API[type] || type
  }

  // 转换接口优惠券状态为数据库状态
  toDbCouponStatus(status) {
    return COUPON_STATUS_TO_DB[status] || status
  }

  // 转换数据库优惠券状态为接口状态
  toApiCouponStatus(status) {
    return COUPON_STATUS_TO_API[status] || status
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
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
}

module.exports = CouponService
