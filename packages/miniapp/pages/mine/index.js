const { bindPhone } = require('../../api/auth')

Page({
  data: {
    // 当前用户信息
    user: null,
    loading: false,
  },

  // 页面显示时刷新登录状态
  async onShow() {
    this.setData({ loading: true })

    try {
      const user = await getApp().ensureLogin()
      this.setData({ user })
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 处理微信手机号授权
  async handlePhoneAuthorization(event) {
    const phoneCode = event.detail.code || '待补充'

    this.setData({ loading: true })

    try {
      const result = await bindPhone(phoneCode)
      const user = {
        ...(this.data.user || {}),
        ...result,
      }

      getApp().globalData.currentUser = user
      this.setData({ user })
      wx.showToast({
        title: '授权成功',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '授权失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 查看我的订单
  handleOpenOrders() {
    wx.navigateTo({
      url: '/pages/orders/index',
    })
  },
})
