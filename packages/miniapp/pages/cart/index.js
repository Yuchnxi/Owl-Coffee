const { createOrder, mockPay } = require('../../api/order')
const { fetchAvailableCoupons } = require('../../api/coupon')
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
    totalAmount: 0,
    payableAmount: 0,
    totalAmountText: '¥0.00',
    discountAmountText: '-¥0.00',
    payableAmountText: '¥0.00',
    loading: false,
    submitting: false,
    needLogin: false,
    buyNowMode: false,

    // 当前订单备注编辑状态
    remark: '',
    remarkDraft: '',
    remarkVisible: false,

    // 结算可用优惠券列表
    availableCoupons: [],
    selectedCoupon: null,
    couponPanelVisible: false,
    couponLoading: false,
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

  // 仅恢复已有登录状态，不同步立即下单商品
  async loadUserOnly() {
    this.setData({
      loading: true,
      needLogin: false,
    })

    try {
      const user = await getApp().restoreLogin()

      this.setData({ needLogin: !user })
      if (user) {
        await this.loadAvailableCoupons()
      }
    } catch (err) {
      wx.showToast({
        title: err.message || '登录状态恢复失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 恢复已有登录并同步购物车
  async loadUserAndSyncCart() {
    this.setData({
      loading: true,
      needLogin: false,
    })

    try {
      const app = getApp()

      const user = await app.restoreLogin()

      if (!user) {
        this.setData({ needLogin: true })
        return
      }

      const cartItems = await app.syncLocalCart()

      this.refreshCart(cartItems)
      await this.loadAvailableCoupons()
    } catch (err) {
      wx.showToast({
        title: err.message || '登录状态恢复失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 打开优惠券选择面板
  async handleCouponTap() {
    if (this.data.needLogin) {
      wx.showToast({
        title: '登录后选择优惠券',
        icon: 'none',
      })
      return
    }

    await this.loadAvailableCoupons()
    this.setData({ couponPanelVisible: true })
  },

  // 关闭优惠券选择面板
  handleCloseCouponPanel() {
    this.setData({ couponPanelVisible: false })
  },

  // 选择结算优惠券
  handleSelectCoupon(event) {
    const { couponId } = event.currentTarget.dataset
    const selectedCoupon = this.data.availableCoupons.find(item => item.id === couponId) || null

    this.setData({
      selectedCoupon,
      couponPanelVisible: false,
    })
    this.updateAmountSummary()
  },

  // 不使用优惠券
  handleClearCoupon() {
    this.setData({
      selectedCoupon: null,
      couponPanelVisible: false,
    })
    this.updateAmountSummary()
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
      this.loadAvailableCoupons()
      return
    }

    const items = updateCartItemQuantity(key, Number(event.detail) || 1)

    this.refreshCart(items)
    this.syncCartSilently(items)
    this.loadAvailableCoupons()
  },

  // 删除购物车中的单个商品
  handleRemoveItem(event) {
    if (this.data.submitting) return

    const { key } = event.currentTarget.dataset
    if (this.data.buyNowMode) {
      const items = this.data.cartItems.filter(item => item.key !== key)

      saveBuyNowItems(items)
      this.refreshCart(items)
      this.loadAvailableCoupons()
      return
    }

    const items = removeCartItem(key)

    this.refreshCart(items)
    this.syncCartSilently(items)
    this.loadAvailableCoupons()
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

    const loggedIn = await this.ensureSubmitLogin()

    if (!loggedIn) return

    this.setData({ submitting: true })
    getApp().checkoutInProgress = true

    try {
      const order = await createOrder({
        items: this.data.cartItems.map(item => ({
          skuId: item.skuId,
          sugarLevel: item.sugarLevel,
          quantity: item.quantity,
        })),
        couponUserId: this.data.selectedCoupon ? this.data.selectedCoupon.id : null,
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

  // 提交订单前由用户确认是否登录
  async ensureSubmitLogin() {
    if (wx.getStorageSync('accessToken') && getApp().globalData.currentUser) {
      return true
    }

    const confirmed = await this.confirmLogin()

    if (!confirmed) return false

    this.setData({ loading: true })

    try {
      await getApp().ensureLogin()
      this.setData({ needLogin: false })
      return true
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
      return false
    } finally {
      this.setData({ loading: false })
    }
  },

  // 弹出登录确认框
  confirmLogin() {
    return new Promise(resolve => {
      wx.showModal({
        title: '登录后提交订单',
        content: '当前已退出登录，确认登录并继续提交订单？',
        confirmText: '登录提交',
        confirmColor: '#e97416',
        success: result => resolve(Boolean(result.confirm)),
        fail: () => resolve(false),
      })
    })
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
      totalAmount,
      totalAmountText: this.formatPrice(totalAmount),
    })
    this.updateAmountSummary()
  },

  // 加载当前金额可用优惠券
  async loadAvailableCoupons() {
    if (!wx.getStorageSync('accessToken') || !this.data.totalAmount) {
      this.setData({
        availableCoupons: [],
        selectedCoupon: null,
      })
      this.updateAmountSummary()
      return
    }

    this.setData({ couponLoading: true })

    try {
      const data = await fetchAvailableCoupons(this.data.totalAmount)
      const availableCoupons = (data.list || data || []).map(item => this.formatCoupon(item))
      const selectedCoupon = availableCoupons.find(item => {
        return this.data.selectedCoupon && item.id === this.data.selectedCoupon.id
      }) || null

      this.setData({
        availableCoupons,
        selectedCoupon,
      })
      this.updateAmountSummary()
    } catch (err) {
      this.setData({
        availableCoupons: [],
        selectedCoupon: null,
      })
      this.updateAmountSummary()
    } finally {
      this.setData({ couponLoading: false })
    }
  },

  // 更新优惠和应付金额展示
  updateAmountSummary() {
    const totalAmount = Number(this.data.totalAmount) || 0
    const discountAmount = this.data.selectedCoupon ? Number(this.data.selectedCoupon.discountAmount) || 0 : 0
    const payableAmount = Math.max(totalAmount - discountAmount, 0)

    this.setData({
      payableAmount,
      discountAmountText: `-${this.formatPrice(discountAmount)}`,
      payableAmountText: this.formatPrice(payableAmount),
    })
  },

  // 整理优惠券展示数据
  formatCoupon(coupon) {
    const thresholdAmount = Number(coupon.thresholdAmount) || 0
    const discountAmount = Number(coupon.discountAmount) || 0
    const discountText = coupon.couponType === 'discountRate'
      ? `${Number(coupon.discountRate) || 0}折`
      : this.formatPrice(discountAmount)

    return {
      ...coupon,
      thresholdText: thresholdAmount > 0 ? `满${this.formatPrice(thresholdAmount)}可用` : '无门槛',
      discountAmount,
      discountText,
      validEndText: this.formatTime(coupon.validEndAt),
    }
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

  // 格式化日期展示
  formatTime(value) {
    if (!value) return '有效期待补充'

    return value.replace('T', ' ').replace(/\.\d{3}Z$/, '')
  },
})
