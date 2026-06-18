const {
  fetchCategories,
  fetchProducts,
  fetchProductDetail,
  fetchSkuAvailability,
} = require('../../api/product')
const { addCartItem } = require('../../api/cart')

Page({
  data: {
    // 分类与商品筛选状态
    categoryList: [{ id: '', name: '全部' }],
    activeCategoryIndex: 0,
    activeCategoryId: '',
    keyword: '',

    // 商品列表状态
    productList: [],
    loading: false,
    pageError: '',

    // 商品详情弹层状态
    detailVisible: false,
    detailLoading: false,
    currentProduct: null,
    skuList: [],
    specGroups: {
      temperature: [],
      cupSize: [],
    },
    selectedSpecs: {
      temperature: '',
      cupSize: '',
    },
    sugarOptions: ['不另外加糖', '3分糖', '半糖', '全糖'],
    selectedSugarLevel: '不另外加糖',
    selectedSku: null,
    selectedSkuPriceText: '待补充',
    quantity: 1,
    addLoading: false,
    cartNoticeVisible: false,
  },

  // 页面加载时初始化分类和商品
  onLoad() {
    this.loadInitialData()
  },

  // 页面显示时保留当前筛选并刷新商品
  onShow() {
    if (this.data.categoryList.length > 1 || this.data.productList.length) {
      this.loadProducts()
    }
  },

  // 初始化分类和商品列表
  async loadInitialData() {
    this.setData({
      loading: true,
      pageError: '',
    })

    try {
      const categoryData = await fetchCategories()
      const categoryList = [
        { id: '', name: '全部' },
        ...((categoryData.list || []).map(item => ({
          id: item.id,
          name: item.name,
        }))),
      ]

      this.setData({ categoryList })
      await this.loadProducts(false)
    } catch (err) {
      this.setData({
        productList: [],
        pageError: err.message || '菜单加载失败',
      })
      wx.showToast({
        title: err.message || '菜单加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 查询商品列表
  async loadProducts(showLoading = true) {
    if (showLoading) {
      this.setData({
        loading: true,
        pageError: '',
      })
    }

    try {
      const data = await fetchProducts({
        categoryId: this.data.activeCategoryId,
        keyword: this.data.keyword,
      })

      this.setData({
        productList: (data.list || []).map(item => ({
          ...item,
          priceText: this.formatPrice(item.minPrice),
          isSoldOut: item.saleStatus === 'soldOut',
        })),
        pageError: '',
      })
    } catch (err) {
      this.setData({
        productList: [],
        pageError: err.message || '商品加载失败',
      })
      wx.showToast({
        title: err.message || '商品加载失败',
        icon: 'none',
      })
    } finally {
      if (showLoading) {
        this.setData({ loading: false })
      }
    }
  },

  // 切换商品分类
  handleCategoryChange(event) {
    const activeCategoryIndex = event.detail
    const category = this.data.categoryList[activeCategoryIndex] || { id: '' }

    this.setData({
      activeCategoryIndex,
      activeCategoryId: category.id,
      cartNoticeVisible: false,
    })
    this.loadProducts()
  },

  // 更新搜索关键词
  handleKeywordChange(event) {
    this.setData({
      keyword: typeof event.detail === 'string' ? event.detail : event.detail.value,
    })
  },

  // 提交搜索
  handleSearch(event) {
    this.setData({
      keyword: (typeof event.detail === 'string' ? event.detail : event.detail.value) || this.data.keyword,
      cartNoticeVisible: false,
    })
    this.loadProducts()
  },

  // 清空搜索
  handleSearchClear() {
    this.setData({
      keyword: '',
      cartNoticeVisible: false,
    })
    this.loadProducts()
  },

  // 打开商品规格弹层
  async handleOpenProduct(event) {
    const { productId, disabled } = event.currentTarget.dataset

    if (disabled) {
      wx.showToast({
        title: '商品已售罄',
        icon: 'none',
      })
      return
    }

    this.setData({
      detailVisible: true,
      detailLoading: true,
      currentProduct: null,
      skuList: [],
      selectedSku: null,
      selectedSkuPriceText: '待补充',
      selectedSugarLevel: '不另外加糖',
      quantity: 1,
    })

    try {
      const product = await fetchProductDetail(productId)
      const skuList = product.skus || []
      const selectedSku = this.findFirstAvailableSku(skuList)
      const selectedSpecs = selectedSku
        ? this.getSkuSpecs(selectedSku)
        : { temperature: '', cupSize: '' }

      this.setData({
        currentProduct: {
          ...product,
          priceText: this.formatPrice(product.minPrice),
        },
        skuList,
        selectedSpecs,
        selectedSku,
        selectedSkuPriceText: selectedSku ? this.formatPrice(selectedSku.price) : '待补充',
        selectedSugarLevel: '不另外加糖',
        quantity: 1,
      })
      this.refreshSpecGroups()
    } catch (err) {
      this.setData({ detailVisible: false })
      wx.showToast({
        title: err.message || '商品详情加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ detailLoading: false })
    }
  },

  // 关闭商品规格弹层
  handleCloseDetail() {
    this.setData({
      detailVisible: false,
      currentProduct: null,
      skuList: [],
      selectedSku: null,
      selectedSkuPriceText: '待补充',
      selectedSugarLevel: '不另外加糖',
      quantity: 1,
      addLoading: false,
    })
  },

  // 阻止弹层内容点击冒泡
  handlePreventTap() {},

  // 预览商品图片
  handlePreviewImage(event) {
    const { url } = event.currentTarget.dataset

    if (!url) return

    wx.previewImage({
      current: url,
      urls: [url],
    })
  },

  // 选择规格值
  handleSelectSpec(event) {
    const { type, value, disabled } = event.currentTarget.dataset

    if (disabled) return

    const selectedSpecs = {
      ...this.data.selectedSpecs,
      [type]: value,
    }
    const selectedSku = this.findSkuBySpecs(selectedSpecs)

    this.setData({
      selectedSpecs,
      selectedSku,
      selectedSkuPriceText: selectedSku ? this.formatPrice(selectedSku.price) : '待补充',
      quantity: selectedSku ? Math.min(this.data.quantity, selectedSku.stock || 1) : 1,
    })
    this.refreshSpecGroups()
  },

  // 选择糖度偏好
  handleSelectSugar(event) {
    const { value } = event.currentTarget.dataset

    this.setData({
      selectedSugarLevel: value,
    })
  },

  // 更新购买数量
  handleQuantityChange(event) {
    this.setData({
      quantity: Number(event.detail) || 1,
    })
  },

  // 加入购物车
  async handleAddCart() {
    const token = wx.getStorageSync('accessToken')

    if (!token) {
      wx.showToast({
        title: '请先授权登录后加入购物车',
        icon: 'none',
      })
      return
    }

    if (!this.data.selectedSku) {
      wx.showToast({
        title: '请选择可售规格',
        icon: 'none',
      })
      return
    }

    this.setData({ addLoading: true })

    try {
      const availability = await fetchSkuAvailability(this.data.selectedSku.id)

      if (!availability.available) {
        wx.showToast({
          title: '该规格暂不可售',
          icon: 'none',
        })
        this.updateSkuStock(availability)
        return
      }

      if (availability.stock < this.data.quantity) {
        wx.showToast({
          title: '库存不足，请调整数量',
          icon: 'none',
        })
        this.updateSkuStock(availability)
        return
      }

      await addCartItem({
        skuId: this.data.selectedSku.id,
        quantity: this.data.quantity,
        sugarLevel: this.data.selectedSugarLevel,
      })

      wx.showToast({
        title: '已加入购物车',
        icon: 'success',
      })
      this.setData({
        detailVisible: false,
        cartNoticeVisible: true,
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '加入购物车失败',
        icon: 'none',
      })
    } finally {
      this.setData({ addLoading: false })
    }
  },

  // 跳转购物车
  handleGoCart() {
    wx.switchTab({
      url: '/pages/cart/index',
    })
  },

  // 刷新规格组选项
  refreshSpecGroups() {
    this.setData({
      specGroups: {
        temperature: this.buildSpecOptions('temperature'),
        cupSize: this.buildSpecOptions('cupSize'),
      },
    })
  },

  // 构建单组规格选项
  buildSpecOptions(type) {
    const values = []

    for (const sku of this.data.skuList) {
      const value = sku[type]
      if (value && !values.includes(value)) {
        values.push(value)
      }
    }

    return values.map(value => ({
      value,
      active: this.data.selectedSpecs[type] === value,
      disabled: !this.hasAvailableSkuForSpec(type, value),
    }))
  },

  // 判断规格值是否存在可售 SKU
  hasAvailableSkuForSpec(type, value) {
    const selectedSpecs = {
      ...this.data.selectedSpecs,
      [type]: value,
    }

    return this.data.skuList.some(sku => {
      const skuSpecs = this.getSkuSpecs(sku)
      const matched = Object.keys(selectedSpecs).every(key => {
        return !selectedSpecs[key] || skuSpecs[key] === selectedSpecs[key]
      })

      return matched && this.isSkuAvailable(sku)
    })
  },

  // 根据规格查找 SKU
  findSkuBySpecs(selectedSpecs) {
    return this.data.skuList.find(sku => {
      const skuSpecs = this.getSkuSpecs(sku)

      return this.isSkuAvailable(sku)
        && skuSpecs.temperature === selectedSpecs.temperature
        && skuSpecs.cupSize === selectedSpecs.cupSize
    }) || null
  },

  // 查找第一个可售 SKU
  findFirstAvailableSku(skuList) {
    return skuList.find(sku => this.isSkuAvailable(sku)) || null
  },

  // 获取 SKU 规格
  getSkuSpecs(sku) {
    return {
      temperature: sku.temperature || '',
      cupSize: sku.cupSize || '',
    }
  },

  // 判断 SKU 是否可售
  isSkuAvailable(sku) {
    return sku && sku.skuStatus === 'enabled' && Number(sku.stock) > 0
  },

  // 使用可售状态更新当前 SKU 库存
  updateSkuStock(availability) {
    const skuList = this.data.skuList.map(sku => {
      if (sku.id !== availability.skuId) return sku

      return {
        ...sku,
        stock: Number(availability.stock),
        price: Number(availability.price),
      }
    })
    const selectedSku = this.findSkuBySpecsFromList(this.data.selectedSpecs, skuList)

    this.setData({
      skuList,
      selectedSku,
      selectedSkuPriceText: selectedSku ? this.formatPrice(selectedSku.price) : '待补充',
      quantity: selectedSku ? Math.min(this.data.quantity, selectedSku.stock || 1) : 1,
    })
    this.refreshSpecGroups()
  },

  // 从指定列表按规格查找 SKU
  findSkuBySpecsFromList(selectedSpecs, skuList) {
    return skuList.find(sku => {
      const skuSpecs = this.getSkuSpecs(sku)

      return this.isSkuAvailable(sku)
        && skuSpecs.temperature === selectedSpecs.temperature
        && skuSpecs.cupSize === selectedSpecs.cupSize
    }) || null
  },

  // 格式化价格文案
  formatPrice(price) {
    const value = Number(price)

    if (!Number.isFinite(value) || value <= 0) {
      return '待补充'
    }

    return `¥${value.toFixed(2).replace(/\.00$/, '')}`
  },
})
