const { login, fetchCurrentUser } = require('./api/auth')
const { fetchCart, syncCart } = require('./api/cart')
const {
  getCartItems,
  saveCartItems,
  mergeCartItems,
} = require('./utils/cart')

App({
  globalData: {
    // 当前登录用户
    currentUser: null,
  },

  // 确保用户已完成微信登录
  async ensureLogin() {
    const accessToken = wx.getStorageSync('accessToken')

    if (accessToken) {
      try {
        const user = await fetchCurrentUser()
        this.globalData.currentUser = user
        return user
      } catch (err) {
        wx.removeStorageSync('accessToken')
        wx.removeStorageSync('refreshToken')
      }
    }

    const code = await this.getLoginCode()
    const result = await login(code)

    wx.setStorageSync('accessToken', result.accessToken)
    wx.setStorageSync('refreshToken', result.refreshToken)
    this.globalData.currentUser = result.user
    await this.syncLocalCart()

    return result.user
  },

  // 登录后合并本地与服务端购物车
  async syncLocalCart() {
    const localItems = getCartItems()
    const remoteCart = await fetchCart()
    const mergedItems = mergeCartItems(localItems, remoteCart.list || [])
    const syncedCart = await syncCart(mergedItems.map(item => ({
      skuId: item.skuId,
      sugarLevel: item.sugarLevel,
      quantity: item.quantity,
    })))

    return saveCartItems(syncedCart.list || [])
  },

  // 获取微信登录临时凭证
  getLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success(result) {
          if (result.code) {
            resolve(result.code)
            return
          }

          reject(new Error('微信登录凭证获取失败'))
        },
        fail() {
          reject(new Error('微信登录失败'))
        },
      })
    })
  },
})
