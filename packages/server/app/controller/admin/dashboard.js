'use strict'

const Controller = require('egg').Controller

class AdminDashboardController extends Controller {
  // 查询后台经营统计
  async summary() {
    const data = await this.ctx.service.dashboard.getSummary()

    this.ctx.success(data)
  }

  // 查询后台销售趋势
  async salesTrend() {
    const { ctx } = this
    const days = Number(ctx.query.days) || 7

    if (days < 1 || days > 30) {
      ctx.status = 400
      ctx.fail(10001, '统计天数范围为 1 到 30 天')
      return
    }

    const data = await ctx.service.dashboard.getSalesTrend(days)

    ctx.success(data)
  }

  // 查询后台订单状态分布
  async orderStatus() {
    const data = await this.ctx.service.dashboard.getOrderStatus()

    this.ctx.success(data)
  }

  // 查询后台最近订单
  async recentOrders() {
    const data = await this.ctx.service.dashboard.getRecentOrders(this.ctx.query.limit)

    this.ctx.success(data)
  }

  // 查询后台库存预警
  async stockWarnings() {
    const data = await this.ctx.service.dashboard.getStockWarnings(this.ctx.query.limit)

    this.ctx.success(data)
  }
}

module.exports = AdminDashboardController
