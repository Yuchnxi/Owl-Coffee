const { fetchCoupons } = require('../../api/coupon')

Page({
  data: {
    // 优惠券状态筛选项
    tabs: [
      { label: '可用', value: 'available' },
      { label: '已使用', value: 'used' },
      { label: '已过期', value: 'expired' },
    ],
    activeStatus: 'available',

    // 当前优惠券列表
    couponList: [],
    loading: false,
    needLogin: false,
  },

  // 页面显示时加载优惠券
  onShow() {
    this.loadCoupons()
  },

  // 加载我的优惠券
  async loadCoupons() {
    this.setData({
      loading: true,
      needLogin: false,
    })

    try {
      const user = await getApp().restoreLogin()

      if (!user) {
        this.setData({
          needLogin: true,
          couponList: [],
        })
        return
      }

      const data = await fetchCoupons(this.data.activeStatus)

      this.setData({
        couponList: (data.list || data || []).map(item => this.formatCoupon(item)),
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '优惠券加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 切换优惠券筛选状态
  handleTabChange(event) {
    const { status } = event.currentTarget.dataset

    if (!status || status === this.data.activeStatus) return

    this.setData({ activeStatus: status })
    this.loadCoupons()
  },

  // 登录后查看优惠券
  async handleLogin() {
    try {
      await getApp().ensureLogin()
      await this.loadCoupons()
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    }
  },

  // 整理优惠券展示数据
  formatCoupon(coupon) {
    const thresholdAmount = Number(coupon.thresholdAmount) || 0
    const discountText = coupon.couponType === 'discountRate'
      ? `${Number(coupon.discountRate) || 0}折`
      : this.formatPrice(coupon.discountAmount)

    return {
      ...coupon,
      discountText,
      thresholdText: thresholdAmount > 0 ? `满${this.formatPrice(thresholdAmount)}可用` : '无门槛',
      validText: `${this.formatTime(coupon.validStartAt)} 至 ${this.formatTime(coupon.validEndAt)}`,
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
