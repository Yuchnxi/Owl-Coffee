const { fetchOrderDetail, fetchOrders } = require('../../api/order')

const STATUS_TEXT_MAP = {
  pendingPayment: '待付款',
  paid: '已支付',
  making: '制作中',
  readyForPickup: '待取餐',
}

const UNFINISHED_STATUS_LIST = ['pendingPayment', 'paid', 'making', 'readyForPickup']

Page({
  data: {
    // 当前未完成订单列表
    orderList: [],
    loading: false,
    needLogin: false,
  },

  // 页面显示时刷新取餐信息
  onShow() {
    this.loadPickupOrders()
  },

  // 加载未完成订单和取餐码
  async loadPickupOrders() {
    this.setData({
      loading: true,
      needLogin: false,
    })

    try {
      const user = await getApp().restoreLogin()

      if (!user) {
        this.setData({
          needLogin: true,
          orderList: [],
        })
        return
      }

      const data = await fetchOrders('all')
      const unfinishedOrders = (data.list || []).filter(order => {
        return UNFINISHED_STATUS_LIST.includes(order.orderStatus)
      })
      const orderList = await Promise.all(unfinishedOrders.map(async order => {
        try {
          const detail = await fetchOrderDetail(order.id)

          return this.formatOrder({ ...order, ...detail })
        } catch (err) {
          return this.formatOrder(order)
        }
      }))

      this.setData({ orderList })
    } catch (err) {
      wx.showToast({
        title: err.message || '取餐信息加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 登录后查看取餐信息
  async handleLogin() {
    try {
      await getApp().ensureLogin()
      await this.loadPickupOrders()
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    }
  },

  // 打开订单详情
  handleOpenDetail(event) {
    const { orderId } = event.currentTarget.dataset

    if (!orderId) return

    wx.navigateTo({
      url: `/pages/order-detail/index?orderId=${orderId}`,
    })
  },

  // 整理取餐订单展示数据
  formatOrder(order) {
    const items = (order.items || []).map(item => item.productName).filter(Boolean)

    return {
      ...order,
      statusText: STATUS_TEXT_MAP[order.orderStatus] || order.orderStatus,
      itemSummary: items.length ? items.join('、') : '商品明细待补充',
      payAmountText: this.formatPrice(order.payAmount),
      createdAtText: this.formatTime(order.createdAt),
    }
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${(Number(price) || 0).toFixed(2)}`
  },

  // 格式化时间
  formatTime(value) {
    if (!value) return ''

    return value.replace('T', ' ').replace(/\.\d{3}Z$/, '')
  },
})
