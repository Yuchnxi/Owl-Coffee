const { bindPhone } = require('../../api/auth')
const { createOrder, mockPay } = require('../../api/order')
const {
  getCartItems,
  saveCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../../utils/cart')

Page({
  // 当前购物车同步版本
  cartSyncVersion: 0,

  data: {
    // 购物车商品列表
    cartItems: [],
    totalCount: 0,
    totalAmountText: '¥0.00',
    loading: false,
    submitting: false,

    // 当前用户授权状态
    user: null,
    phoneBound: false,
    remark: '',
  },

  // 页面显示时刷新购物车与登录状态
  async onShow() {
    this.refreshCart(getCartItems())
    await this.loadUserAndSyncCart()
  },

  // 登录并同步购物车
  async loadUserAndSyncCart() {
    this.setData({ loading: true })

    try {
      const app = getApp()
      const user = await app.ensureLogin()
      const cartItems = await app.syncLocalCart()

      this.setData({
        user,
        phoneBound: Boolean(user.phoneBound),
      })
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

  // 处理微信手机号授权
  async handlePhoneAuthorization(event) {
    const phoneCode = (event.detail || {}).code

    if (!phoneCode) {
      wx.showToast({
        title: '已取消手机号授权',
        icon: 'none',
      })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await bindPhone(phoneCode)
      const user = {
        ...(this.data.user || {}),
        ...result,
      }

      getApp().globalData.currentUser = user
      this.setData({
        user,
        phoneBound: Boolean(result.phoneBound),
      })
      wx.showToast({
        title: '手机号授权成功',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '手机号授权失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 更新购物车商品数量
  async handleQuantityChange(event) {
    if (this.data.submitting) return

    const { key } = event.currentTarget.dataset
    const quantity = Number(event.detail) || 1
    const items = updateCartItemQuantity(key, quantity)

    this.refreshCart(items)
    await this.syncCurrentCart(items)
  },

  // 删除购物车商品
  async handleRemoveItem(event) {
    if (this.data.submitting) return

    const items = removeCartItem(event.currentTarget.dataset.key)

    this.refreshCart(items)
    await this.syncCurrentCart(items)
  },

  // 更新订单备注
  handleRemarkInput(event) {
    this.setData({
      remark: event.detail.value || '',
    })
  },

  // 提交订单并完成模拟支付
  async handleSubmitOrder() {
    if (!this.data.cartItems.length || this.data.submitting) return

    if (!this.data.phoneBound) {
      wx.showToast({
        title: '请先授权手机号',
        icon: 'none',
      })
      return
    }

    this.setData({ submitting: true })

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

      clearCart()
      ++this.cartSyncVersion
      this.refreshCart([])

      wx.showModal({
        title: '支付成功',
        content: `取餐码：${payment.pickupCode || '生成中'}`,
        showCancel: false,
        confirmText: '查看订单',
        confirmColor: '#e97416',
        success: () => {
          wx.navigateTo({
            url: `/pages/orders/index?orderId=${order.id}`,
          })
        },
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '订单提交失败',
        icon: 'none',
      })
    } finally {
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

  // 同步当前购物车到服务端
  async syncCurrentCart(items, refreshAfterSync = true) {
    const syncVersion = ++this.cartSyncVersion

    try {
      const result = await getApp().syncCartItems(items)

      if (refreshAfterSync && syncVersion === this.cartSyncVersion) {
        this.refreshCart(saveCartItems(result.list || []))
      }
    } catch (err) {
      wx.showToast({
        title: err.message || '购物车同步失败',
        icon: 'none',
      })
    }
  },

  // 格式化价格文案
  formatPrice(price) {
    const value = Number(price) || 0

    return `¥${value.toFixed(2)}`
  },
})
