const CART_STORAGE_KEY = 'localCartItems'
const CART_CLEAR_PENDING_KEY = 'pendingCartClearUserId'

// 读取本地购物车
function getCartItems() {
  const items = wx.getStorageSync(CART_STORAGE_KEY)

  return Array.isArray(items) ? items : []
}

// 保存本地购物车
function saveCartItems(items) {
  const safeItems = Array.isArray(items) ? items : []

  wx.setStorageSync(CART_STORAGE_KEY, safeItems)
  return safeItems
}

// 合并本地与服务端购物车，相同商品以本地编辑结果为准
function mergeCartItems(localItems, remoteItems) {
  const itemMap = new Map()

  for (const item of remoteItems) {
    const key = createItemKey(item.skuId, item.sugarLevel)

    itemMap.set(key, {
      ...item,
      key,
      quantity: Number(item.quantity) || 0,
    })
  }

  for (const item of localItems) {
    const key = createItemKey(item.skuId, item.sugarLevel)

    itemMap.set(key, {
      ...(itemMap.get(key) || {}),
      ...item,
      key,
      quantity: Number(item.quantity) || 0,
    })
  }

  return Array.from(itemMap.values()).filter(item => item.quantity > 0)
}

// 加入本地购物车，相同 SKU 和糖度自动合并
function addCartItem(item) {
  const items = getCartItems()
  const itemKey = createItemKey(item.skuId, item.sugarLevel)
  const itemIndex = items.findIndex(current => current.key === itemKey)
  const stock = Math.max(Number(item.stock) || 0, 0)
  const quantity = Math.max(Number(item.quantity) || 1, 1)

  if (itemIndex >= 0) {
    const currentItem = items[itemIndex]
    const nextQuantity = Math.min(currentItem.quantity + quantity, stock)

    items[itemIndex] = {
      ...currentItem,
      ...item,
      key: itemKey,
      quantity: nextQuantity,
      stock,
    }
  } else {
    items.unshift({
      ...item,
      key: itemKey,
      quantity: Math.min(quantity, stock),
      stock,
    })
  }

  return saveCartItems(items)
}

// 更新本地购物车商品数量
function updateCartItemQuantity(key, quantity) {
  const items = getCartItems().map(item => {
    if (item.key !== key) return item

    return {
      ...item,
      quantity: Math.min(Math.max(Number(quantity) || 1, 1), item.stock || 1),
    }
  })

  return saveCartItems(items)
}

// 删除本地购物车商品
function removeCartItem(key) {
  return saveCartItems(getCartItems().filter(item => item.key !== key))
}

// 清空本地购物车
function clearCart() {
  return saveCartItems([])
}

// 标记指定用户的服务端购物车等待清空
function markCartClearPending(userId) {
  wx.setStorageSync(CART_CLEAR_PENDING_KEY, userId || true)
}

// 读取等待清空购物车的用户标识
function getPendingCartClearUserId() {
  return wx.getStorageSync(CART_CLEAR_PENDING_KEY)
}

// 清除购物车待清空标记
function clearCartClearPending() {
  wx.removeStorageSync(CART_CLEAR_PENDING_KEY)
}

// 生成本地购物车商品唯一标识
function createItemKey(skuId, sugarLevel) {
  return `${skuId}__${sugarLevel || '不另外加糖'}`
}

module.exports = {
  getCartItems,
  saveCartItems,
  mergeCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  markCartClearPending,
  getPendingCartClearUserId,
  clearCartClearPending,
}
