Page({
  data: {
    // 首页轮播图列表，后续由接口返回
    bannerList: [
      {
        id: 'home-hero',
        kicker: 'Owl Coffee',
        title: '醒来，喝一杯好咖啡',
        imageUrl: '/assets/home/home-hero.jpg'
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
    recommendList: [
      {
        id: 'recommend-coffee',
        name: '推荐咖啡',
        imageUrl: '/assets/home/recommend-coffee.jpg'
      },
      {
        id: 'season-drink',
        name: '季节饮品',
        imageUrl: '/assets/home/recommend-season.jpg'
      }
    ]
  },

  // 跳转到指定页面
  handleNavigate(event) {
    const { url } = event.currentTarget.dataset

    if (!url) return

    wx.switchTab({
      url
    })
  }
})
