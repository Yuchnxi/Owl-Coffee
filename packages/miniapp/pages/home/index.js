const { fetchHomeBanners } = require('../../api/home')
const { fetchOrderDetail, fetchOrders } = require('../../api/order')
const { fetchProducts } = require('../../api/product')

const ORDER_STATUS_TEXT_MAP = {
  pendingPayment: '待付款',
  paid: '已支付',
  making: '制作中',
  readyForPickup: '待取餐',
}

const CURRENT_ORDER_STATUS_LIST = ['readyForPickup', 'making', 'paid', 'pendingPayment']
const CURRENT_ORDER_PRIORITY_MAP = {
  readyForPickup: 1,
  making: 2,
  paid: 3,
  pendingPayment: 4,
}

Page({
  data: {
    // 首页轮播图列表
    bannerList: [
      {
        id: 'banner-placeholder',
        kicker: 'Owl Coffee',
        title: '轮播图待补充',
        imageUrl: ''
      }
    ],

    // 今日推荐商品列表
    recommendList: [],
    recommendLoading: false,

    // 当前取餐订单
    currentOrder: null,
    currentOrderLoading: false
  },

  // 页面加载时查询轮播图与推荐商品
  onLoad() {
    this.loadBanners()
    this.loadRecommendations()
  },

  // 页面显示时刷新当前取餐信息
  onShow() {
    this.loadCurrentOrder()
  },

  // 查询首页轮播图，接口暂不可用时保留占位内容
  async loadBanners() {
    try {
      const data = await fetchHomeBanners()
      const bannerList = Array.isArray(data) ? data : data.list

      if (Array.isArray(bannerList) && bannerList.length) {
        this.setData({
          bannerList: bannerList.map(item => ({
            ...item,
            kicker: item.kicker || 'Owl Coffee',
            title: item.title || '待补充'
          }))
        })
      }
    } catch (err) {
      // 轮播图接口待开发，当前保留占位内容
    }
  },

  // 使用菜单前三个商品作为今日推荐
  async loadRecommendations() {
    this.setData({ recommendLoading: true })

    try {
      const data = await fetchProducts()
      const recommendList = (data.list || []).slice(0, 3).map(item => ({
        ...item,
        desc: item.description,
        priceText: this.formatPrice(item.minPrice)
      }))

      this.setData({ recommendList })
    } catch (err) {
      this.setData({ recommendList: [] })
    } finally {
      this.setData({ recommendLoading: false })
    }
  },

  // 查询当前未完成订单
  async loadCurrentOrder() {
    this.setData({ currentOrderLoading: true })

    try {
      const user = await getApp().restoreLogin()

      if (!user) {
        this.setData({ currentOrder: null })
        return
      }

      const data = await fetchOrders('all')
      const currentOrder = (data.list || [])
        .filter(order => CURRENT_ORDER_STATUS_LIST.includes(order.orderStatus))
        .sort((prev, next) => {
          return CURRENT_ORDER_PRIORITY_MAP[prev.orderStatus] - CURRENT_ORDER_PRIORITY_MAP[next.orderStatus]
        })[0]

      if (!currentOrder) {
        this.setData({ currentOrder: null })
        return
      }

      let detail = currentOrder

      try {
        const orderDetail = await fetchOrderDetail(currentOrder.id)

        detail = {
          ...currentOrder,
          ...orderDetail
        }
      } catch (err) {
        detail = currentOrder
      }

      this.setData({
        currentOrder: this.formatCurrentOrder(detail)
      })
    } catch (err) {
      this.setData({ currentOrder: null })
    } finally {
      this.setData({ currentOrderLoading: false })
    }
  },

  // 跳转到指定页面
  handleNavigate(event) {
    const { url } = event.currentTarget.dataset

    if (!url) return

    wx.switchTab({
      url
    })
  },

  // 处理轮播图点击跳转
  handleBannerTap(event) {
    const { linkType, linkUrl } = event.currentTarget.dataset

    if (!linkType || linkType === 'none' || !linkUrl) return

    if (linkType === 'page') {
      const tabPages = ['/pages/home/index', '/pages/menu/index', '/pages/orders/index', '/pages/mine/index']
      const navigate = tabPages.includes(linkUrl) ? wx.switchTab : wx.navigateTo

      navigate({ url: linkUrl })
      return
    }

    wx.showToast({
      title: '网页跳转待补充',
      icon: 'none'
    })
  },

  // 打开当前订单详情
  handleOpenCurrentOrder() {
    if (!this.data.currentOrder || !this.data.currentOrder.id) return

    wx.navigateTo({
      url: `/pages/order-detail/index?orderId=${this.data.currentOrder.id}`
    })
  },

  // 整理当前取餐展示数据
  formatCurrentOrder(order) {
    const itemNames = (order.items || []).map(item => item.productName).filter(Boolean)

    return {
      ...order,
      statusText: ORDER_STATUS_TEXT_MAP[order.orderStatus] || order.orderStatus,
      pickupCodeText: order.pickupCode || '支付完成后生成',
      itemSummary: itemNames.length ? itemNames.join('、') : '商品明细待补充',
      amountText: this.formatPrice(order.payAmount)
    }
  },

  // 格式化商品价格文案
  formatPrice(price) {
    const value = Number(price)

    if (!Number.isFinite(value) || value <= 0) return '待补充'

    return `¥${value.toFixed(2).replace(/\.00$/, '')}`
  }
})
