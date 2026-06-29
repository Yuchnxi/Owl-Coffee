const { fetchOrderDetail } = require('../../api/order')

const STATUS_TEXT_MAP = {
  pendingPayment: '待付款',
  paid: '已支付',
  making: '制作中',
  readyForPickup: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

const PAYMENT_STATUS_TEXT_MAP = {
  unpaid: '待支付',
  paid: '已支付',
  refunded: '已退款',
}

Page({
  data: {
    // 当前订单 ID
    orderId: '',
    // 订单详情展示数据
    order: null,
    loading: false,
  },

  // 页面加载时读取订单详情
  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
    this.loadOrderDetail()
  },

  // 加载订单详情
  async loadOrderDetail() {
    if (!this.data.orderId) return

    this.setData({ loading: true })

    try {
      const detail = await fetchOrderDetail(this.data.orderId)

      this.setData({
        order: this.formatOrder(detail),
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '订单详情加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 整理订单详情展示数据
  formatOrder(order) {
    const timeline = [
      { label: '下单', time: order.createdAt },
      { label: '支付', time: order.paidAt },
      { label: '制作', time: order.makingAt },
      { label: '待取餐', time: order.readyAt },
      { label: '完成', time: order.completedAt },
      { label: '取消', time: order.cancelledAt },
      { label: '退款', time: order.refundedAt },
    ].filter(item => item.time)

    return {
      ...order,
      statusText: STATUS_TEXT_MAP[order.orderStatus] || order.orderStatus,
      paymentStatusText: PAYMENT_STATUS_TEXT_MAP[order.paymentStatus] || order.paymentStatus,
      totalAmountText: this.formatPrice(order.totalAmount),
      discountAmountText: `-${this.formatPrice(order.discountAmount)}`,
      payAmountText: this.formatPrice(order.payAmount),
      createdAtText: this.formatTime(order.createdAt),
      timeline: timeline.map(item => ({
        ...item,
        timeText: this.formatTime(item.time),
      })),
      items: (order.items || []).map(item => ({
        ...item,
        specText: [item.temperature, item.cupSize, item.sugarLevel].filter(Boolean).join(' / '),
        unitPriceText: this.formatPrice(item.unitPrice),
        subtotalAmountText: this.formatPrice(item.subtotalAmount),
      })),
    }
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${(Number(price) || 0).toFixed(2)}`
  },

  // 格式化时间
  formatTime(value) {
    if (!value) return '待补充'

    return value.replace('T', ' ').replace(/\.\d{3}Z$/, '')
  },
})
