const {
  login,
  refreshAccessToken,
  fetchCurrentUser,
} = require('./api/auth')
const { fetchCart, syncCart } = require('./api/cart')
const {
  getCartItems,
  saveCartItems,
  mergeCartItems,
} = require('./utils/cart')

App({
  // 购物车同步队列
  cartSyncQueue: Promise.resolve(),

  // 登录恢复任务
  loginPromise: null,

  globalData: {
    // 当前登录用户
    currentUser: null,
  },

  // 确保用户已完成微信登录
  ensureLogin() {
    if (!this.loginPromise) {
      this.loginPromise = this.resolveLogin().finally(() => {
        this.loginPromise = null
      })
    }

    return this.loginPromise
  },

  // 恢复或创建小程序登录态
  async resolveLogin() {
    const accessToken = wx.getStorageSync('accessToken')

    if (accessToken) {
      try {
        const user = await fetchCurrentUser()
        this.globalData.currentUser = user
        return user
      } catch (err) {
        if (err.statusCode !== 401) {
          throw err
        }

        const user = await this.tryRefreshLogin()

        if (user) return user
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

  // 尝试刷新登录凭证
  async tryRefreshLogin() {
    const refreshToken = wx.getStorageSync('refreshToken')

    if (!refreshToken) {
      wx.removeStorageSync('accessToken')
      return null
    }

    try {
      const result = await refreshAccessToken(refreshToken)

      wx.setStorageSync('accessToken', result.accessToken)
      wx.setStorageSync('refreshToken', result.refreshToken)

      const user = await fetchCurrentUser()
      this.globalData.currentUser = user
      return user
    } catch (err) {
      if (err.statusCode !== 401) {
        throw err
      }

      wx.removeStorageSync('accessToken')
      wx.removeStorageSync('refreshToken')
      return null
    }
  },

  // 登录后合并本地与服务端购物车
  async syncLocalCart() {
    const localItems = getCartItems()
    const remoteCart = await fetchCart()
    const mergedItems = mergeCartItems(localItems, remoteCart.list || [])
    const syncedCart = await this.syncCartItems(mergedItems)

    return saveCartItems(syncedCart.list || [])
  },

  // 按操作顺序同步购物车
  syncCartItems(items) {
    const payload = items.map(item => ({
      skuId: item.skuId,
      sugarLevel: item.sugarLevel,
      quantity: item.quantity,
    }))

    this.cartSyncQueue = this.cartSyncQueue
      .catch(() => {})
      .then(() => syncCart(payload))

    return this.cartSyncQueue
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
