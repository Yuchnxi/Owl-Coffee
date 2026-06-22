const { fetchHomeBanners } = require('../../api/home')
const { fetchProducts } = require('../../api/product')

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

    // 首页快捷入口
    quickActions: [
      {
        title: '浏览菜单',
        desc: '查看可点商品',
        icon: '☕',
        url: '/pages/menu/index'
      },
      {
        title: '订单',
        desc: '查看订单状态',
        icon: '🧺',
        url: '/pages/orders/index'
      }
    ],

    // 今日推荐商品列表
    recommendList: [],
    recommendLoading: false
  },

  // 页面加载时查询轮播图与推荐商品
  onLoad() {
    this.loadBanners()
    this.loadRecommendations()
  },

  // 查询首页轮播图，接口暂不可用时保留占位内容
  async loadBanners() {
    try {
      const data = await fetchHomeBanners()
      const bannerList = Array.isArray(data) ? data : data.list

      if (Array.isArray(bannerList) && bannerList.length) {
        this.setData({ bannerList })
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

  // 跳转到指定页面
  handleNavigate(event) {
    const { url } = event.currentTarget.dataset

    if (!url) return

    wx.switchTab({
      url
    })
  },

  // 格式化商品价格文案
  formatPrice(price) {
    const value = Number(price)

    if (!Number.isFinite(value) || value <= 0) return '待补充'

    return `¥${value.toFixed(2).replace(/\.00$/, '')}`
  }
})
