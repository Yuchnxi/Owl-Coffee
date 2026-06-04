'use strict'

const Controller = require('egg').Controller

const PRODUCT_STATUS_LIST = ['onSale', 'offSale']
const SKU_STATUS_LIST = ['enabled', 'disabled']
const STOCK_STATUS_LIST = ['normal', 'lowStock', 'soldOut']

class AdminProductController extends Controller {
  // 查询后台商品列表
  async index() {
    const { ctx } = this
    const { productStatus, stockStatus } = ctx.query

    if (productStatus && !PRODUCT_STATUS_LIST.includes(productStatus)) {
      ctx.status = 400
      ctx.fail(10001, '商品状态不正确')
      return
    }

    if (stockStatus && !STOCK_STATUS_LIST.includes(stockStatus)) {
      ctx.status = 400
      ctx.fail(10001, '库存状态不正确')
      return
    }

    const result = await ctx.service.product.listAdminProducts(ctx.query)

    ctx.success(result)
  }

  // 查询后台商品详情
  async show() {
    const { ctx } = this
    const product = await ctx.service.product.findAdminProductDetail(ctx.params.productId)

    if (!product) {
      ctx.status = 404
      ctx.fail(10002, '商品不存在')
      return
    }

    ctx.success(product)
  }

  // 新增商品和 SKU
  async create() {
    const { ctx } = this
    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = await this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const product = await ctx.service.product.createProduct(payload, ctx.state.admin.id)

    ctx.success(product)
  }

  // 编辑商品和 SKU
  async update() {
    const { ctx } = this
    const { productId } = ctx.params
    const product = await ctx.service.product.findProductBase(productId)

    if (!product) {
      ctx.status = 404
      ctx.fail(10002, '商品不存在')
      return
    }

    const payload = this.normalizePayload(ctx.request.body || {})
    const errorMessage = await this.validatePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const updatedProduct = await ctx.service.product.updateProduct(productId, payload, ctx.state.admin.id)

    ctx.success(updatedProduct)
  }

  // 更新商品上下架状态
  async updateStatus() {
    const { ctx } = this
    const { productId } = ctx.params
    const { productStatus } = ctx.request.body || {}
    const product = await ctx.service.product.findProductBase(productId)

    if (!product) {
      ctx.status = 404
      ctx.fail(10002, '商品不存在')
      return
    }

    if (!PRODUCT_STATUS_LIST.includes(productStatus)) {
      ctx.status = 400
      ctx.fail(10001, '商品状态不正确')
      return
    }

    const updatedProduct = await ctx.service.product.updateProductStatus(
      productId,
      productStatus,
      ctx.state.admin.id
    )

    ctx.success(updatedProduct)
  }

  // 删除商品和 SKU
  async destroy() {
    const { ctx } = this
    const { productId } = ctx.params
    const product = await ctx.service.product.findProductBase(productId)

    if (!product) {
      ctx.status = 404
      ctx.fail(10002, '商品不存在')
      return
    }

    await ctx.service.product.deleteProduct(productId, ctx.state.admin.id)

    ctx.success({})
  }

  // 标准化商品请求体
  normalizePayload(body) {
    return {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      categoryId: body.categoryId || '',
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      productStatus: body.productStatus || 'offSale',
      sort: Number.isInteger(Number(body.sort)) ? Number(body.sort) : 0,
      isRecommended: Boolean(body.isRecommended),
      skus: Array.isArray(body.skus) ? body.skus.map(sku => this.normalizeSku(sku)) : [],
    }
  }

  // 标准化 SKU 请求体
  normalizeSku(sku) {
    return {
      temperature: typeof sku.temperature === 'string' ? sku.temperature.trim() : '',
      cupSize: typeof sku.cupSize === 'string' ? sku.cupSize.trim() : '',
      sugarLevel: typeof sku.sugarLevel === 'string' ? sku.sugarLevel.trim() : '',
      price: Number(sku.price),
      stock: Number.isInteger(Number(sku.stock)) ? Number(sku.stock) : -1,
      warningStock: Number.isInteger(Number(sku.warningStock)) ? Number(sku.warningStock) : -1,
      skuStatus: sku.skuStatus || 'enabled',
    }
  }

  // 校验商品请求体
  async validatePayload(payload) {
    if (!payload.name) {
      return '商品名称不能为空'
    }

    if (payload.name.length > 128) {
      return '商品名称不能超过 128 个字符'
    }

    if (!payload.categoryId) {
      return '商品分类不能为空'
    }

    const category = await this.ctx.service.category.findById(payload.categoryId)

    if (!category) {
      return '商品分类不存在'
    }

    if (!PRODUCT_STATUS_LIST.includes(payload.productStatus)) {
      return '商品状态不正确'
    }

    if (payload.sort < 0) {
      return '排序不能小于 0'
    }

    if (payload.skus.length === 0) {
      return '至少需要一个 SKU'
    }

    for (const sku of payload.skus) {
      const skuError = this.validateSku(sku)

      if (skuError) {
        return skuError
      }
    }

    return ''
  }

  // 校验 SKU 请求体
  validateSku(sku) {
    if (!sku.temperature || !sku.cupSize || !sku.sugarLevel) {
      return 'SKU 温度、杯型和糖度不能为空'
    }

    if (!Number.isFinite(sku.price) || sku.price < 0) {
      return 'SKU 价格不能小于 0'
    }

    if (sku.stock < 0) {
      return 'SKU 库存不能小于 0'
    }

    if (sku.warningStock < 0) {
      return 'SKU 预警库存不能小于 0'
    }

    if (!SKU_STATUS_LIST.includes(sku.skuStatus)) {
      return 'SKU 状态不正确'
    }

    return ''
  }
}

module.exports = AdminProductController
