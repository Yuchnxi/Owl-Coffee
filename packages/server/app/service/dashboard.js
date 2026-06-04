'use strict'

const Service = require('egg').Service

const ORDER_STATUS_TO_API = {
  pending_payment: 'pendingPayment',
  paid: 'paid',
  making: 'making',
  ready_for_pickup: 'readyForPickup',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
}

class DashboardService extends Service {
  // 查询后台经营统计
  async getSummary() {
    const [salesRows] = await this.app.mysql.execute(
      `
        SELECT
          COALESCE(SUM(pay_amount), 0) AS todaySalesAmount,
          COUNT(*) AS todayOrderCount
        FROM orders
        WHERE deleted_at IS NULL
          AND payment_status = 'paid'
          AND paid_at >= CURDATE()
          AND paid_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      `
    )
    const [pendingRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS pendingOrderCount
        FROM orders
        WHERE deleted_at IS NULL
          AND order_status IN ('paid', 'making', 'ready_for_pickup')
      `
    )
    const [stockRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS stockWarningCount
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND ps.sku_status = 'enabled'
          AND p.product_status = 'on_sale'
          AND ps.stock <= ps.warning_stock
      `
    )
    const [userRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS newUserCount
        FROM users
        WHERE deleted_at IS NULL
          AND created_at >= CURDATE()
          AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      `
    )

    return {
      todaySalesAmount: Number(salesRows[0].todaySalesAmount),
      todayOrderCount: Number(salesRows[0].todayOrderCount),
      pendingOrderCount: Number(pendingRows[0].pendingOrderCount),
      stockWarningCount: Number(stockRows[0].stockWarningCount),
      newUserCount: Number(userRows[0].newUserCount),
    }
  }

  // 查询销售趋势
  async getSalesTrend(days = 7) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          DATE(paid_at) AS date,
          COALESCE(SUM(pay_amount), 0) AS amount,
          COUNT(*) AS orderCount
        FROM orders
        WHERE deleted_at IS NULL
          AND payment_status = 'paid'
          AND paid_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
          AND paid_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY DATE(paid_at)
      `,
      { days: days - 1 }
    )
    const rowMap = new Map(rows.map(row => [this.formatDate(row.date), row]))

    return {
      list: this.createDateRange(days).map(date => {
        const row = rowMap.get(date)

        return {
          date,
          amount: row ? Number(row.amount) : 0,
          orderCount: row ? Number(row.orderCount) : 0,
        }
      }),
    }
  }

  // 查询订单状态分布
  async getOrderStatus() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          order_status AS orderStatus,
          COUNT(*) AS count
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY order_status
      `
    )

    return {
      list: rows.map(row => ({
        orderStatus: this.toApiOrderStatus(row.orderStatus),
        count: Number(row.count),
      })),
    }
  }

  // 查询最近订单
  async getRecentOrders(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20)
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          order_no AS orderNo,
          user_name AS userName,
          phone,
          pay_amount AS payAmount,
          order_status AS orderStatus,
          payment_status AS paymentStatus,
          created_at AS createdAt
        FROM orders
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `
    )

    return {
      list: rows.map(row => this.formatRecentOrder(row)),
    }
  }

  // 查询库存预警
  async getStockWarnings(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.sku_code AS skuCode,
          ps.temperature,
          ps.cup_size AS cupSize,
          ps.sugar_level AS sugarLevel,
          ps.stock,
          ps.warning_stock AS warningStock,
          p.id AS productId,
          p.name AS productName
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND ps.sku_status = 'enabled'
          AND p.product_status = 'on_sale'
          AND ps.stock <= ps.warning_stock
        ORDER BY ps.stock ASC, ps.updated_at DESC
        LIMIT ${safeLimit}
      `
    )

    return {
      list: rows.map(row => this.formatStockWarning(row)),
    }
  }

  // 生成日期区间
  createDateRange(days) {
    const list = []
    const start = new Date()

    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - days + 1)

    for (let index = 0; index < days; index++) {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      list.push(this.formatDate(date))
    }

    return list
  }

  // 格式化最近订单
  formatRecentOrder(order) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      userName: order.userName,
      phone: order.phone,
      payAmount: Number(order.payAmount),
      orderStatus: this.toApiOrderStatus(order.orderStatus),
      paymentStatus: order.paymentStatus,
      createdAt: this.formatTime(order.createdAt),
    }
  }

  // 格式化库存预警项
  formatStockWarning(row) {
    const stock = Number(row.stock)
    const warningStock = Number(row.warningStock)

    return {
      skuId: row.skuId,
      skuCode: row.skuCode,
      productId: row.productId,
      productName: row.productName,
      specText: `${row.temperature} / ${row.cupSize} / ${row.sugarLevel}`,
      stock,
      warningStock,
      stockStatus: stock <= 0 ? 'soldOut' : 'lowStock',
    }
  }

  // 转换数据库订单状态为接口状态
  toApiOrderStatus(status) {
    return ORDER_STATUS_TO_API[status] || status
  }

  // 格式化日期字段
  formatDate(value) {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = DashboardService
