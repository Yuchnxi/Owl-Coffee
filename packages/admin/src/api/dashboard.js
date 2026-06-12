import { get } from '../utils/request'

// 获取仪表盘经营统计
export function fetchDashboardSummary() {
  return get('/api/admin/dashboard/summary')
}

// 获取近 7 日销售趋势
export function fetchSalesTrend(days = 7) {
  return get('/api/admin/dashboard/sales-trend', {
    params: {
      days
    }
  })
}

// 获取订单状态分布
export function fetchOrderStatus() {
  return get('/api/admin/dashboard/order-status')
}

// 获取最近订单
export function fetchRecentOrders(limit = 5) {
  return get('/api/admin/dashboard/recent-orders', {
    params: {
      limit
    }
  })
}

// 获取库存预警
export function fetchStockWarnings(limit = 5) {
  return get('/api/admin/dashboard/stock-warnings', {
    params: {
      limit
    }
  })
}
