'use strict'

const Service = require('egg').Service

const PRODUCT_STATUS_TO_DB = {
  onSale: 'on_sale',
  offSale: 'off_sale',
}

const PRODUCT_STATUS_TO_API = {
  on_sale: 'onSale',
  off_sale: 'offSale',
}

class ProductService extends Service {
  // 查询后台商品列表
  async listAdminProducts(filters = {}) {
    const { page, pageSize } = this.normalizePagination(filters)
    const { conditions, params } = this.buildAdminProductWhere(filters)
    const offset = (page - 1) * pageSize

    const [countRows] = await this.app.mysql.execute(
      `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
        WHERE ${conditions.join(' AND ')}
      `,
      params
    )

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          p.id,
          p.category_id AS categoryId,
          c.name AS categoryName,
          p.name,
          p.image_url AS imageUrl,
          p.description,
          p.product_status AS productStatus,
          p.sort,
          p.is_recommended AS isRecommended,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt,
          COALESCE(MIN(ps.price), 0) AS minPrice,
          COUNT(ps.id) AS skuCount,
          COALESCE(SUM(ps.stock), 0) AS totalStock,
          COALESCE(SUM(CASE WHEN ps.stock > 0 AND ps.stock <= ps.warning_stock THEN 1 ELSE 0 END), 0) AS lowStockSkuCount
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
        LEFT JOIN product_skus ps ON ps.product_id = p.id AND ps.deleted_at IS NULL
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.id
        ORDER BY p.sort ASC, p.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      params
    )

    let list = rows.map(row => this.formatProductListItem(row))

    if (filters.stockStatus) {
      list = list.filter(item => item.stockStatus === filters.stockStatus)
    }

    return {
      list,
      pagination: this.formatPagination(page, pageSize, Number(countRows[0].total)),
    }
  }

  // 查询公开商品列表
  async listPublicProducts(filters = {}, onlyRecommended = false) {
    const conditions = [
      'p.deleted_at IS NULL',
      "p.product_status = 'on_sale'",
      'c.deleted_at IS NULL',
      "c.status = 'enabled'",
    ]
    const params = {}

    if (filters.categoryId) {
      conditions.push('p.category_id = :categoryId')
      params.categoryId = filters.categoryId
    }

    if (filters.keyword) {
      conditions.push('p.name LIKE :keyword')
      params.keyword = `%${filters.keyword}%`
    }

    if (onlyRecommended) {
      conditions.push('p.is_recommended = 1')
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          p.id,
          p.category_id AS categoryId,
          c.name AS categoryName,
          p.name,
          p.image_url AS imageUrl,
          p.description,
          p.product_status AS productStatus,
          p.sort,
          p.is_recommended AS isRecommended,
          COALESCE(MIN(ps.price), 0) AS minPrice,
          COUNT(ps.id) AS skuCount,
          COALESCE(SUM(ps.stock), 0) AS totalStock
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_skus ps
          ON ps.product_id = p.id
          AND ps.deleted_at IS NULL
          AND ps.sku_status = 'enabled'
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.id
        ORDER BY p.sort ASC, p.created_at DESC
      `,
      params
    )

    return rows.map(row => this.formatPublicProductItem(row))
  }

  // 查询后台商品详情
  async findAdminProductDetail(productId) {
    const product = await this.findProductBase(productId)

    if (!product) {
      return null
    }

    const skus = await this.listProductSkus(productId, false)

    return {
      ...this.formatProductDetail(product),
      skus,
    }
  }

  // 查询公开商品详情
  async findPublicProductDetail(productId) {
    const product = await this.findProductBase(productId)

    if (!product || product.productStatus !== 'on_sale') {
      return null
    }

    const skus = await this.listProductSkus(productId, true)

    return {
      ...this.formatProductDetail(product),
      saleStatus: this.getSaleStatus(skus),
      skus,
    }
  }

  // 根据 ID 查询商品基础信息
  async findProductBase(productId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          p.id,
          p.category_id AS categoryId,
          c.name AS categoryName,
          p.name,
          p.image_url AS imageUrl,
          p.description,
          p.product_status AS productStatus,
          p.sort,
          p.is_recommended AS isRecommended,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
        WHERE p.id = :productId
          AND p.deleted_at IS NULL
        LIMIT 1
      `,
      { productId }
    )

    return rows[0] || null
  }

  // 查询商品 SKU
  async listProductSkus(productId, onlyEnabled) {
    const conditions = ['product_id = :productId', 'deleted_at IS NULL']

    if (onlyEnabled) {
      conditions.push("sku_status = 'enabled'")
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          sku_code AS skuCode,
          temperature,
          cup_size AS cupSize,
          price,
          stock,
          warning_stock AS warningStock,
          sku_status AS skuStatus,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM product_skus
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at ASC, id ASC
      `,
      { productId }
    )

    return rows.map(row => this.formatSku(row))
  }

  // 创建商品和 SKU
  async createProduct(data, adminUserId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()

      const productId = this.service.authToken.createId('prod')
      await connection.execute(
        `
          INSERT INTO products (
            id,
            category_id,
            name,
            image_url,
            description,
            product_status,
            sort,
            is_recommended,
            created_at,
            updated_at,
            deleted_at,
            created_by,
            updated_by
          )
          VALUES (
            :productId,
            :categoryId,
            :name,
            :imageUrl,
            :description,
            :productStatus,
            :sort,
            :isRecommended,
            NOW(3),
            NOW(3),
            NULL,
            :adminUserId,
            :adminUserId
          )
        `,
        {
          productId,
          categoryId: data.categoryId,
          name: data.name,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
          productStatus: this.toDbProductStatus(data.productStatus),
          sort: data.sort,
          isRecommended: data.isRecommended ? 1 : 0,
          adminUserId,
        }
      )

      await this.insertSkus(connection, productId, data.skus, adminUserId)
      await connection.commit()

      return this.findAdminProductDetail(productId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 更新商品和 SKU
  async updateProduct(productId, data, adminUserId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()

      await connection.execute(
        `
          UPDATE products
          SET
            category_id = :categoryId,
            name = :name,
            image_url = :imageUrl,
            description = :description,
            product_status = :productStatus,
            sort = :sort,
            is_recommended = :isRecommended,
            updated_at = NOW(3),
            updated_by = :adminUserId
          WHERE id = :productId
            AND deleted_at IS NULL
        `,
        {
          productId,
          categoryId: data.categoryId,
          name: data.name,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
          productStatus: this.toDbProductStatus(data.productStatus),
          sort: data.sort,
          isRecommended: data.isRecommended ? 1 : 0,
          adminUserId,
        }
      )

      await connection.execute(
        `
          UPDATE product_skus
          SET
            deleted_at = NOW(3),
            updated_at = NOW(3),
            updated_by = :adminUserId
          WHERE product_id = :productId
            AND deleted_at IS NULL
        `,
        { productId, adminUserId }
      )

      await this.insertSkus(connection, productId, data.skus, adminUserId)
      await connection.commit()

      return this.findAdminProductDetail(productId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 更新商品上下架状态
  async updateProductStatus(productId, productStatus, adminUserId) {
    await this.app.mysql.execute(
      `
        UPDATE products
        SET
          product_status = :productStatus,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :productId
          AND deleted_at IS NULL
      `,
      {
        productId,
        productStatus: this.toDbProductStatus(productStatus),
        adminUserId,
      }
    )

    return this.findAdminProductDetail(productId)
  }

  // 软删除商品和 SKU
  async deleteProduct(productId, adminUserId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()

      await connection.execute(
        `
          UPDATE products
          SET
            deleted_at = NOW(3),
            updated_at = NOW(3),
            updated_by = :adminUserId
          WHERE id = :productId
            AND deleted_at IS NULL
        `,
        { productId, adminUserId }
      )

      await connection.execute(
        `
          UPDATE product_skus
          SET
            deleted_at = NOW(3),
            updated_at = NOW(3),
            updated_by = :adminUserId
          WHERE product_id = :productId
            AND deleted_at IS NULL
        `,
        { productId, adminUserId }
      )

      await connection.commit()
      return true
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 查询 SKU 可售状态
  async getSkuAvailability(skuId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.price,
          ps.stock,
          ps.sku_status AS skuStatus,
          p.product_status AS productStatus
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.id = :skuId
          AND ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
        LIMIT 1
      `,
      { skuId }
    )

    const sku = rows[0]

    if (!sku) {
      return null
    }

    return {
      skuId: sku.skuId,
      available: sku.productStatus === 'on_sale' && sku.skuStatus === 'enabled' && Number(sku.stock) > 0,
      stock: Number(sku.stock),
      price: Number(sku.price),
    }
  }

  // 批量插入 SKU
  async insertSkus(connection, productId, skus, adminUserId) {
    for (const sku of skus) {
      const skuId = this.service.authToken.createId('sku')
      const skuCode = this.createSkuCode()

      await connection.execute(
        `
          INSERT INTO product_skus (
            id,
            product_id,
            sku_code,
            temperature,
            cup_size,
            price,
            stock,
            warning_stock,
            sku_status,
            created_at,
            updated_at,
            deleted_at,
            created_by,
            updated_by
          )
          VALUES (
            :skuId,
            :productId,
            :skuCode,
            :temperature,
            :cupSize,
            :price,
            :stock,
            :warningStock,
            :skuStatus,
            NOW(3),
            NOW(3),
            NULL,
            :adminUserId,
            :adminUserId
          )
        `,
        {
          skuId,
          productId,
          skuCode,
          temperature: sku.temperature,
          cupSize: sku.cupSize,
          price: sku.price,
          stock: sku.stock,
          warningStock: sku.warningStock,
          skuStatus: sku.skuStatus,
          adminUserId,
        }
      )
    }
  }

  // 生成 SKU 编码
  createSkuCode() {
    const suffix = this.service.authToken.createId('sku').replace('sku_', '').toUpperCase()
    return `OC-SKU-${suffix}`
  }

  // 构造后台商品查询条件
  buildAdminProductWhere(filters) {
    const conditions = ['p.deleted_at IS NULL']
    const params = {}

    if (filters.name) {
      conditions.push('p.name LIKE :name')
      params.name = `%${filters.name}%`
    }

    if (filters.categoryId) {
      conditions.push('p.category_id = :categoryId')
      params.categoryId = filters.categoryId
    }

    if (filters.productStatus) {
      conditions.push('p.product_status = :productStatus')
      params.productStatus = this.toDbProductStatus(filters.productStatus)
    }

    return { conditions, params }
  }

  // 标准化分页参数
  normalizePagination(filters) {
    const page = Math.max(Number(filters.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100)

    return { page, pageSize }
  }

  // 格式化分页响应
  formatPagination(page, pageSize, total) {
    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // 格式化后台商品列表项
  formatProductListItem(row) {
    const skuCount = Number(row.skuCount)
    const totalStock = Number(row.totalStock)
    const lowStockSkuCount = Number(row.lowStockSkuCount)

    return {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      imageUrl: row.imageUrl,
      description: row.description,
      minPrice: Number(row.minPrice),
      skuCount,
      totalStock,
      productStatus: this.toApiProductStatus(row.productStatus),
      stockStatus: this.getStockStatus(skuCount, totalStock, lowStockSkuCount),
      sort: Number(row.sort),
      isRecommended: Boolean(row.isRecommended),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 格式化公开商品列表项
  formatPublicProductItem(row) {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      imageUrl: row.imageUrl,
      description: row.description,
      minPrice: Number(row.minPrice),
      saleStatus: Number(row.totalStock) > 0 ? 'available' : 'soldOut',
    }
  }

  // 格式化商品详情
  formatProductDetail(product) {
    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      description: product.description,
      productStatus: this.toApiProductStatus(product.productStatus),
      sort: Number(product.sort),
      isRecommended: Boolean(product.isRecommended),
      createdAt: this.formatTime(product.createdAt),
      updatedAt: this.formatTime(product.updatedAt),
    }
  }

  // 格式化 SKU
  formatSku(row) {
    return {
      id: row.id,
      skuCode: row.skuCode,
      temperature: row.temperature,
      cupSize: row.cupSize,
      price: Number(row.price),
      stock: Number(row.stock),
      warningStock: Number(row.warningStock),
      skuStatus: row.skuStatus,
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 获取库存状态
  getStockStatus(skuCount, totalStock, lowStockSkuCount) {
    if (skuCount === 0 || totalStock <= 0) {
      return 'soldOut'
    }

    if (lowStockSkuCount > 0) {
      return 'lowStock'
    }

    return 'normal'
  }

  // 获取公开销售状态
  getSaleStatus(skus) {
    return skus.some(sku => sku.skuStatus === 'enabled' && sku.stock > 0) ? 'available' : 'soldOut'
  }

  // 转换接口商品状态为数据库状态
  toDbProductStatus(status) {
    return PRODUCT_STATUS_TO_DB[status] || 'off_sale'
  }

  // 转换数据库商品状态为接口状态
  toApiProductStatus(status) {
    return PRODUCT_STATUS_TO_API[status] || 'offSale'
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = ProductService
