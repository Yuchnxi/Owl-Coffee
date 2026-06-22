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
  getCartVersion,
  saveCartVersion,
} = require('./utils/cart')

App({
  // 购物车同步队列
  cartSyncQueue: Promise.resolve(),

  // 购物车同步代次
  cartSyncGeneration: 0,

  // 登录恢复任务
  loginPromise: null,

  // 是否正在提交订单
  checkoutInProgress: false,

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
    const localVersion = getCartVersion()
    const localItems = getCartItems()
    const remoteCart = await fetchCart()

    if (localVersion !== null && localVersion !== remoteCart.cartVersion) {
      ++this.cartSyncGeneration
      this.saveCartState(remoteCart)
      wx.showToast({
        title: '购物车已同步其他设备的最新状态',
        icon: 'none',
      })
      return remoteCart.list || []
    }

    saveCartVersion(remoteCart.cartVersion)
    const mergedItems = mergeCartItems(localItems, remoteCart.list || [])
    const syncedCart = await this.syncCartItems(mergedItems)

    return syncedCart.list || []
  },

  // 按操作顺序同步购物车
  syncCartItems(items) {
    const syncGeneration = this.cartSyncGeneration
    const payload = items.map(item => ({
      skuId: item.skuId,
      sugarLevel: item.sugarLevel,
      quantity: item.quantity,
    }))

    this.cartSyncQueue = this.cartSyncQueue
      .catch(() => {})
      .then(async () => {
        if (syncGeneration !== this.cartSyncGeneration) {
          return {
            cartVersion: getCartVersion() || 0,
            list: getCartItems(),
          }
        }

        const cartVersion = getCartVersion()

        if (cartVersion === null) {
          const latestCart = await fetchCart()
          this.saveCartState(latestCart)
          return latestCart
        }

        try {
          const result = await syncCart(payload, cartVersion)
          this.saveCartState(result)
          return result
        } catch (err) {
          if (err.code !== 30006 || !err.data) throw err

          ++this.cartSyncGeneration
          this.saveCartState(err.data)
          wx.showToast({
            title: '购物车已在其他设备更新',
            icon: 'none',
          })
          return err.data
        }
      })

    return this.cartSyncQueue
  },

  // 保存服务端购物车快照
  saveCartState(cart) {
    saveCartVersion(cart.cartVersion)
    saveCartItems(cart.list || [])
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
