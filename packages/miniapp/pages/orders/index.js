const { fetchOrders } = require('../../api/order')

const STATUS_TEXT_MAP = {
  pendingPayment: '待付款',
  paid: '已支付',
  making: '制作中',
  readyForPickup: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

Page({
  data: {
    // 当前用户订单列表
    orderList: [],
    loading: false,
  },

  // 页面显示时加载订单
  async onShow() {
    this.setData({ loading: true })

    try {
      await getApp().ensureLogin()
      const data = await fetchOrders()

      this.setData({
        orderList: (data.list || []).map(order => ({
          ...order,
          statusText: STATUS_TEXT_MAP[order.orderStatus] || order.orderStatus,
          amountText: this.formatPrice(order.payAmount),
          createdAtText: this.formatTime(order.createdAt),
        })),
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '订单加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 返回菜单继续点单
  handleGoMenu() {
    wx.switchTab({
      url: '/pages/menu/index',
    })
  },

  // 格式化价格文案
  formatPrice(price) {
    return `¥${(Number(price) || 0).toFixed(2)}`
  },

  // 格式化下单时间
  formatTime(value) {
    if (!value) return ''

    return value.replace('T', ' ').replace(/\.\d{3}Z$/, '')
  },
})
