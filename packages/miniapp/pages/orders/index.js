const { fetchOrderDetail, fetchOrders, mockPay } = require('../../api/order')

const STATUS_TEXT_MAP = {
  pendingPayment: '待付款',
  paid: '已支付',
  making: '制作中',
  readyForPickup: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

const STATUS_CLASS_MAP = {
  completed: 'completed',
  cancelled: 'muted',
  refunded: 'muted',
}

Page({
  // 当前订单请求版本
  requestVersion: 0,

  data: {
    // 订单状态筛选项
    statusTabs: [
      { label: '全部', value: 'all' },
      { label: '待付款', value: 'pendingPayment' },
      { label: '制作中', value: 'making' },
      { label: '已完成', value: 'completed' },
    ],
    activeStatus: 'all',

    // 当前用户订单列表
    orderList: [],
    loading: false,
    payingOrderId: '',
  },

  // 页面显示时加载订单
  onShow() {
    this.loadOrders()
  },

  // 按当前状态加载订单及商品明细
  async loadOrders() {
    const requestVersion = ++this.requestVersion

    this.setData({
      loading: true,
      orderList: [],
    })

    try {
      await getApp().ensureLogin()
      const data = await fetchOrders(this.data.activeStatus)
      const orderList = await Promise.all((data.list || []).map(async order => {
        try {
          const detail = await fetchOrderDetail(order.id)

          return this.formatOrder({ ...order, ...detail })
        } catch (err) {
          return this.formatOrder(order)
        }
      }))

      if (requestVersion !== this.requestVersion) return

      this.setData({
        orderList,
      })
    } catch (err) {
      if (requestVersion !== this.requestVersion) return

      wx.showToast({
        title: err.message || '订单加载失败',
        icon: 'none',
      })
    } finally {
      if (requestVersion === this.requestVersion) {
        this.setData({ loading: false })
      }
    }
  },

  // 切换订单状态筛选
  handleStatusChange(event) {
    const { status } = event.currentTarget.dataset

    if (!status || status === this.data.activeStatus) return

    this.setData({ activeStatus: status })
    this.loadOrders()
  },

  // 模拟支付当前待付款订单
  async handleMockPay(event) {
    const { orderId } = event.currentTarget.dataset

    if (!orderId || this.data.payingOrderId) return

    this.setData({ payingOrderId: orderId })

    try {
      const payment = await mockPay(orderId)

      wx.showToast({
        title: payment.pickupCode ? `取餐码 ${payment.pickupCode}` : '支付成功',
        icon: 'success',
      })
      await this.loadOrders()
    } catch (err) {
      wx.showToast({
        title: err.message || '模拟支付失败',
        icon: 'none',
      })
    } finally {
      this.setData({ payingOrderId: '' })
    }
  },

  // 再来一单并返回点单页
  handleOrderAgain() {
    wx.switchTab({
      url: '/pages/menu/index',
    })
  },

  // 返回菜单继续点单
  handleGoMenu() {
    wx.switchTab({
      url: '/pages/menu/index',
    })
  },

  // 整理订单卡片展示数据
  formatOrder(order) {
    const items = (order.items || []).map(item => ({
      ...item,
      specText: [item.temperature, item.cupSize, item.sugarLevel].filter(Boolean).join(' / '),
    }))

    return {
      ...order,
      items,
      statusText: STATUS_TEXT_MAP[order.orderStatus] || order.orderStatus,
      statusClass: STATUS_CLASS_MAP[order.orderStatus] || 'accent',
      amountText: this.formatPrice(order.payAmount),
      createdAtText: this.formatTime(order.createdAt),
      isPendingPayment: order.orderStatus === 'pendingPayment',
      isCompleted: order.orderStatus === 'completed',
    }
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
