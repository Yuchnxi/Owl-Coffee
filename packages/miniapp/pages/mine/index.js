Page({
  data: {
    // 当前用户信息
    user: {},
    loading: false,

    // 我的页概览数据
    summaryList: [
      { key: 'orders', value: '--', label: '累计订单' },
      { key: 'coupon', value: '待补充', label: '优惠券' },
      { key: 'pickup', value: '--', label: '取餐码' },
    ],

    // 我的页服务列表
    menuList: [
      { key: 'orders', title: '我的订单', iconUrl: '/assets/iconfont/png/icon-order-list.png' },
      { key: 'pickup', title: '取餐信息', iconUrl: '/assets/iconfont/png/pickupInfo.png' },
      { key: 'service', title: '联系客服', iconUrl: '/assets/iconfont/png/icon-customer-service.png', badge: '待补充' },
      { key: 'settings', title: '设置', iconUrl: '/assets/iconfont/png/icon-settings.png' },
    ],
  },

  // 页面显示时刷新登录状态
  async onShow() {
    this.setData({ loading: true })

    try {
      const user = await getApp().restoreLogin()
      this.setData({ user: user || {} })
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 查看我的订单
  handleOpenOrders() {
    wx.switchTab({
      url: '/pages/orders/index',
    })
  },

  // 打开个人资料页面
  async handleOpenProfile() {
    try {
      await getApp().ensureLogin()
      wx.navigateTo({
        url: '/pages/profile/index',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    }
  },

  // 处理我的页功能点击
  handleMenuTap(event) {
    const { key } = event.currentTarget.dataset

    if (key === 'orders' || key === 'pickup') {
      this.handleOpenOrders()
      return
    }

    if (key === 'settings') {
      this.handleOpenProfile()
      return
    }

    wx.showToast({
      title: '待补充',
      icon: 'none',
    })
  },
})
