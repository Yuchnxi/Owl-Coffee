'use strict'

const Service = require('egg').Service

const ORDER_STATUS_TO_DB = {
  pendingPayment: 'pending_payment',
  paid: 'paid',
  making: 'making',
  readyForPickup: 'ready_for_pickup',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
}

const ORDER_STATUS_TO_API = {
  pending_payment: 'pendingPayment',
  paid: 'paid',
  making: 'making',
  ready_for_pickup: 'readyForPickup',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
}

class OrderService extends Service {
  // 查询后台订单列表
  async listAdminOrders(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildOrderWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          order_no AS orderNo,
          user_name AS userName,
          phone,
          total_amount AS totalAmount,
          discount_amount AS discountAmount,
          pay_amount AS payAmount,
          order_status AS orderStatus,
          payment_status AS paymentStatus,
          payment_method AS paymentMethod,
          order_source AS orderSource,
          created_at AS createdAt
        FROM orders
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    return {
      list: rows.map(row => this.formatOrderListItem(row)),
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询后台订单详情
  async findAdminOrderDetail(orderId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          order_no AS orderNo,
          user_id AS userId,
          user_name AS userName,
          phone,
          order_source AS orderSource,
          order_status AS orderStatus,
          payment_status AS paymentStatus,
          payment_method AS paymentMethod,
          total_amount AS totalAmount,
          discount_amount AS discountAmount,
          pay_amount AS payAmount,
          user_coupon_id AS userCouponId,
          pickup_code AS pickupCode,
          remark,
          paid_at AS paidAt,
          making_at AS makingAt,
          ready_at AS readyAt,
          completed_at AS completedAt,
          cancelled_at AS cancelledAt,
          refunded_at AS refundedAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM orders
        WHERE id = :orderId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { orderId }
    )

    const order = rows[0]

    if (!order) {
      return null
    }

    const [items] = await this.app.mysql.execute(
      `
        SELECT
          id,
          product_id AS productId,
          sku_id AS skuId,
          product_name AS productName,
          image_url AS imageUrl,
          temperature,
          cup_size AS cupSize,
          sugar_level AS sugarLevel,
          unit_price AS unitPrice,
          quantity,
          subtotal_amount AS subtotalAmount,
          created_at AS createdAt
        FROM order_items
        WHERE order_id = :orderId
        ORDER BY created_at ASC, id ASC
      `,
      { orderId }
    )

    return {
      ...this.formatOrderDetail(order),
      items: items.map(item => this.formatOrderItem(item)),
    }
  }

  // 后台补单并扣减库存
  async createAdminOrder(data, adminUserId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()

      const skuRows = await this.lockSkus(connection, data.items.map(item => item.skuId))
      const skuMap = new Map(skuRows.map(sku => [sku.skuId, sku]))
      const normalizedItems = []

      for (const item of data.items) {
        const sku = skuMap.get(item.skuId)

        if (!sku) {
          await connection.rollback()
          return {
            errorCode: 10002,
            message: 'SKU 不存在',
            data: { skuId: item.skuId },
          }
        }

        if (sku.productStatus !== 'on_sale' || sku.skuStatus !== 'enabled') {
          await connection.rollback()
          return {
            errorCode: 30002,
            message: 'SKU 不可售',
            data: { skuId: item.skuId },
          }
        }

        if (Number(sku.stock) < item.quantity) {
          await connection.rollback()
          return {
            errorCode: 50001,
            message: '库存不足',
            data: {
              skuId: item.skuId,
              availableStock: Number(sku.stock),
            },
          }
        }

        normalizedItems.push({
          ...sku,
          quantity: item.quantity,
          subtotalAmount: Number(sku.price) * item.quantity,
        })
      }

      const orderId = this.service.authToken.createId('order')
      const orderNo = this.createOrderNo()
      const pickupCode = this.createPickupCode()
      const totalAmount = normalizedItems.reduce((sum, item) => sum + item.subtotalAmount, 0)
      const discountAmount = Math.min(data.discountAmount, totalAmount)
      const payAmount = Math.max(totalAmount - discountAmount, 0)

      await connection.execute(
        `
          INSERT INTO orders (
            id,
            order_no,
            user_id,
            user_name,
            phone,
            order_source,
            order_status,
            payment_status,
            payment_method,
            total_amount,
            discount_amount,
            pay_amount,
            user_coupon_id,
            pickup_code,
            remark,
            paid_at,
            making_at,
            ready_at,
            completed_at,
            cancelled_at,
            refunded_at,
            created_at,
            updated_at,
            deleted_at,
            created_by,
            updated_by
          )
          VALUES (
            :orderId,
            :orderNo,
            NULL,
            :userName,
            :phone,
            'admin',
            'paid',
            'paid',
            'mock',
            :totalAmount,
            :discountAmount,
            :payAmount,
            NULL,
            :pickupCode,
            :remark,
            NOW(3),
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NOW(3),
            NOW(3),
            NULL,
            :adminUserId,
            :adminUserId
          )
        `,
        {
          orderId,
          orderNo,
          userName: data.userName || null,
          phone: data.phone || null,
          totalAmount,
          discountAmount,
          payAmount,
          pickupCode,
          remark: data.remark || null,
          adminUserId,
        }
      )

      for (const item of normalizedItems) {
        await this.insertOrderItem(connection, orderId, item)
        await this.deductSkuStock(connection, orderId, item, adminUserId)
      }

      await connection.commit()

      return this.findAdminOrderDetail(orderId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 更新订单状态
  async updateOrderStatus(orderId, orderStatus, adminUserId) {
    const dbStatus = this.toDbOrderStatus(orderStatus)
    const timeField = this.getStatusTimeField(dbStatus)
    const timeSql = timeField ? `, ${timeField} = NOW(3)` : ''

    await this.app.mysql.execute(
      `
        UPDATE orders
        SET
          order_status = :dbStatus,
          updated_at = NOW(3),
          updated_by = :adminUserId
          ${timeSql}
        WHERE id = :orderId
          AND deleted_at IS NULL
      `,
      { orderId, dbStatus, adminUserId }
    )

    return this.findAdminOrderDetail(orderId)
  }

  // 取消订单
  async cancelOrder(orderId, adminUserId) {
    return this.updateOrderStatus(orderId, 'cancelled', adminUserId)
  }

  // 标记退款
  async refundOrder(orderId, adminUserId) {
    await this.app.mysql.execute(
      `
        UPDATE orders
        SET
          order_status = 'refunded',
          payment_status = 'refunded',
          refunded_at = NOW(3),
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :orderId
          AND deleted_at IS NULL
      `,
      { orderId, adminUserId }
    )

    return this.findAdminOrderDetail(orderId)
  }

  // 软删除订单
  async deleteOrder(orderId, adminUserId) {
    const [result] = await this.app.mysql.execute(
      `
        UPDATE orders
        SET
          deleted_at = NOW(3),
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :orderId
          AND deleted_at IS NULL
      `,
      { orderId, adminUserId }
    )

    return result.affectedRows > 0
  }

  // 锁定 SKU 并读取商品快照
  async lockSkus(connection, skuIds) {
    const placeholders = skuIds.map((_, index) => `:skuId${index}`)
    const params = {}

    skuIds.forEach((skuId, index) => {
      params[`skuId${index}`] = skuId
    })

    const [rows] = await connection.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.product_id AS productId,
          ps.sku_code AS skuCode,
          ps.temperature,
          ps.cup_size AS cupSize,
          ps.sugar_level AS sugarLevel,
          ps.price,
          ps.stock,
          ps.sku_status AS skuStatus,
          p.name AS productName,
          p.image_url AS imageUrl,
          p.product_status AS productStatus
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.id IN (${placeholders.join(', ')})
          AND ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
        FOR UPDATE
      `,
      params
    )

    return rows
  }

  // 写入订单明细
  async insertOrderItem(connection, orderId, item) {
    await connection.execute(
      `
        INSERT INTO order_items (
          id,
          order_id,
          product_id,
          sku_id,
          product_name,
          image_url,
          temperature,
          cup_size,
          sugar_level,
          unit_price,
          quantity,
          subtotal_amount,
          created_at
        )
        VALUES (
          :id,
          :orderId,
          :productId,
          :skuId,
          :productName,
          :imageUrl,
          :temperature,
          :cupSize,
          :sugarLevel,
          :unitPrice,
          :quantity,
          :subtotalAmount,
          NOW(3)
        )
      `,
      {
        id: this.service.authToken.createId('item'),
        orderId,
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        imageUrl: item.imageUrl,
        temperature: item.temperature,
        cupSize: item.cupSize,
        sugarLevel: item.sugarLevel,
        unitPrice: Number(item.price),
        quantity: item.quantity,
        subtotalAmount: item.subtotalAmount,
      }
    )
  }

  // 扣减 SKU 库存并记录流水
  async deductSkuStock(connection, orderId, item, adminUserId) {
    const beforeStock = Number(item.stock)
    const afterStock = beforeStock - item.quantity

    await connection.execute(
      `
        UPDATE product_skus
        SET
          stock = :afterStock,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :skuId
      `,
      {
        skuId: item.skuId,
        afterStock,
        adminUserId,
      }
    )

    await connection.execute(
      `
        INSERT INTO inventory_logs (
          id,
          sku_id,
          change_type,
          change_quantity,
          before_stock,
          after_stock,
          related_order_id,
          reason,
          created_at,
          created_by
        )
        VALUES (
          :id,
          :skuId,
          'order_deduct',
          :changeQuantity,
          :beforeStock,
          :afterStock,
          :orderId,
          '后台补单扣减库存',
          NOW(3),
          :adminUserId
        )
      `,
      {
        id: this.service.authToken.createId('inv'),
        skuId: item.skuId,
        changeQuantity: -item.quantity,
        beforeStock,
        afterStock,
        orderId,
        adminUserId,
      }
    )
  }

  // 构造订单查询条件
  buildOrderWhere(filters) {
    const conditions = ['deleted_at IS NULL']
    const params = {}

    if (filters.orderNo) {
      conditions.push('order_no LIKE :orderNo')
      params.orderNo = `%${filters.orderNo}%`
    }

    if (filters.userKeyword) {
      conditions.push('(user_name LIKE :userKeyword OR phone LIKE :userKeyword)')
      params.userKeyword = `%${filters.userKeyword}%`
    }

    if (filters.orderStatus) {
      conditions.push('order_status = :orderStatus')
      params.orderStatus = this.toDbOrderStatus(filters.orderStatus)
    }

    if (filters.paymentStatus) {
      conditions.push('payment_status = :paymentStatus')
      params.paymentStatus = filters.paymentStatus
    }

    if (filters.orderSource) {
      conditions.push('order_source = :orderSource')
      params.orderSource = filters.orderSource
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

  // 生成展示订单号
  createOrderNo() {
    const now = new Date()
    const pad = value => String(value).padStart(2, '0')
    const date = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('')
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

    return `OC${date}${suffix}`
  }

  // 生成取餐码
  createPickupCode() {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // 获取状态时间字段
  getStatusTimeField(dbStatus) {
    const map = {
      paid: 'paid_at',
      making: 'making_at',
      ready_for_pickup: 'ready_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at',
      refunded: 'refunded_at',
    }

    return map[dbStatus] || ''
  }

  // 格式化订单列表项
  formatOrderListItem(order) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      userName: order.userName,
      phone: order.phone,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      payAmount: Number(order.payAmount),
      orderStatus: this.toApiOrderStatus(order.orderStatus),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderSource: order.orderSource,
      createdAt: this.formatTime(order.createdAt),
    }
  }

  // 格式化订单详情
  formatOrderDetail(order) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      userName: order.userName,
      phone: order.phone,
      orderSource: order.orderSource,
      orderStatus: this.toApiOrderStatus(order.orderStatus),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      payAmount: Number(order.payAmount),
      userCouponId: order.userCouponId,
      pickupCode: order.pickupCode,
      remark: order.remark,
      paidAt: this.formatTime(order.paidAt),
      makingAt: this.formatTime(order.makingAt),
      readyAt: this.formatTime(order.readyAt),
      completedAt: this.formatTime(order.completedAt),
      cancelledAt: this.formatTime(order.cancelledAt),
      refundedAt: this.formatTime(order.refundedAt),
      createdAt: this.formatTime(order.createdAt),
      updatedAt: this.formatTime(order.updatedAt),
    }
  }

  // 格式化订单明细
  formatOrderItem(item) {
    return {
      id: item.id,
      productId: item.productId,
      skuId: item.skuId,
      productName: item.productName,
      imageUrl: item.imageUrl,
      temperature: item.temperature,
      cupSize: item.cupSize,
      sugarLevel: item.sugarLevel,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      subtotalAmount: Number(item.subtotalAmount),
      createdAt: this.formatTime(item.createdAt),
    }
  }

  // 转换接口订单状态为数据库状态
  toDbOrderStatus(status) {
    return ORDER_STATUS_TO_DB[status] || status
  }

  // 转换数据库订单状态为接口状态
  toApiOrderStatus(status) {
    return ORDER_STATUS_TO_API[status] || status
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = OrderService
