const { createOrder, mockPay } = require('../../api/order')
const {
  getCartItems,
  getBuyNowItems,
  saveBuyNowItems,
  clearBuyNowItems,
  updateCartItemQuantity,
  removeCartItem,
} = require('../../utils/cart')

Page({
  data: {
    // 购物车商品列表
    cartItems: [],
    totalCount: 0,
    totalAmountText: '¥0.00',
    discountAmountText: '-¥0.00',
    loading: false,
    submitting: false,
    buyNowMode: false,

    // 当前订单备注编辑状态
    remark: '',
    remarkDraft: '',
    remarkVisible: false,
  },

  // 页面加载时记录订单来源
  onLoad(options = {}) {
    this.setData({
      buyNowMode: options.mode === 'buyNow',
    })
  },

  // 页面显示时刷新购物车与登录状态
  async onShow() {
    if (this.data.buyNowMode) {
      this.refreshCart(getBuyNowItems())
      await this.loadUserOnly()
      return
    }

    this.refreshCart(getCartItems())
    await this.loadUserAndSyncCart()
  },

  // 仅确认登录状态，不同步立即下单商品
  async loadUserOnly() {
    this.setData({ loading: true })

    try {
      await getApp().ensureLogin()
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 登录并同步购物车
  async loadUserAndSyncCart() {
    this.setData({ loading: true })

    try {
      const app = getApp()
      await app.ensureLogin()
      const cartItems = await app.syncLocalCart()

      this.refreshCart(cartItems)
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 展示暂无可用优惠提示
  handleCouponTap() {
    wx.showToast({
      title: '暂无可用优惠',
      icon: 'none',
    })
  },

  // 更新购物车商品数量
  handleQuantityChange(event) {
    if (this.data.submitting) return

    const { key } = event.currentTarget.dataset
    if (this.data.buyNowMode) {
      const items = this.data.cartItems.map(item => {
        if (item.key !== key) return item

        return {
          ...item,
          quantity: Math.min(Math.max(Number(event.detail) || 1, 1), item.stock || 1),
        }
      })

      saveBuyNowItems(items)
      this.refreshCart(items)
      return
    }

    const items = updateCartItemQuantity(key, Number(event.detail) || 1)

    this.refreshCart(items)
    this.syncCartSilently(items)
  },

  // 删除购物车中的单个商品
  handleRemoveItem(event) {
    if (this.data.submitting) return

    const { key } = event.currentTarget.dataset
    if (this.data.buyNowMode) {
      const items = this.data.cartItems.filter(item => item.key !== key)

      saveBuyNowItems(items)
      this.refreshCart(items)
      return
    }

    const items = removeCartItem(key)

    this.refreshCart(items)
    this.syncCartSilently(items)
  },

  // 打开订单备注编辑层
  handleOpenRemark() {
    this.setData({
      remarkDraft: this.data.remark,
      remarkVisible: true,
    })
  },

  // 更新订单备注草稿
  handleRemarkInput(event) {
    this.setData({ remarkDraft: event.detail.value || '' })
  },

  // 关闭订单备注编辑层
  handleCloseRemark() {
    this.setData({ remarkVisible: false })
  },

  // 保存订单备注
  handleSaveRemark() {
    this.setData({
      remark: this.data.remarkDraft.trim(),
      remarkVisible: false,
    })
  },

  // 阻止编辑面板点击冒泡
  handlePreventTap() {},

  // 提交订单并完成模拟支付
  async handleSubmitOrder() {
    if (!this.data.cartItems.length || this.data.submitting) return

    this.setData({ submitting: true })
    getApp().checkoutInProgress = true

    try {
      const order = await createOrder({
        items: this.data.cartItems.map(item => ({
          skuId: item.skuId,
          sugarLevel: item.sugarLevel,
          quantity: item.quantity,
        })),
        remark: this.data.remark,
      })
      const payment = await mockPay(order.id, 'success')

      if (this.data.buyNowMode) {
        clearBuyNowItems()
      } else {
        getApp().saveCartState(payment.cart || { cartVersion: 0, list: [] })
        this.refreshCart((payment.cart || {}).list || [])
      }

      wx.switchTab({
        url: '/pages/orders/index',
        success: () => {
          wx.showModal({
            title: '支付成功',
            content: `取餐码：${payment.pickupCode || '生成中'}`,
            showCancel: false,
            confirmText: '确认',
            confirmColor: '#e97416',
          })
        },
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '订单提交失败',
        icon: 'none',
      })
    } finally {
      getApp().checkoutInProgress = false
      this.setData({ submitting: false })
    }
  },

  // 返回菜单继续选购
  handleGoMenu() {
    wx.switchTab({
      url: '/pages/menu/index',
    })
  },

  // 刷新购物车展示数据
  refreshCart(items) {
    const cartItems = items.map(item => ({
      ...item,
      key: item.key || `${item.skuId}__${item.sugarLevel || '不另外加糖'}`,
      priceText: this.formatPrice(item.price),
      subtotalText: this.formatPrice(Number(item.price) * Number(item.quantity)),
      specText: item.specText || [item.temperature, item.cupSize, item.sugarLevel].filter(Boolean).join(' / '),
    }))
    const totalCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0)
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity)
    }, 0)

    this.setData({
      cartItems,
      totalCount,
      totalAmountText: this.formatPrice(totalAmount),
    })
  },

  // 已登录时静默同步购物车
  async syncCartSilently(items) {
    if (!wx.getStorageSync('accessToken')) return

    try {
      const result = await getApp().syncCartItems(items)
      this.refreshCart(result.list || [])
    } catch (err) {
      // 保留本地购物车，后续进入页面时再次同步
    }
  },

  // 格式化价格文案
  formatPrice(price) {
    const value = Number(price) || 0

    return `¥${value.toFixed(2)}`
  },
})
