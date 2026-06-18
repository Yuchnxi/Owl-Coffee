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

class InventoryService extends Service {
  // 查询 SKU 库存列表
  async listSkus(filters = {}) {
    const conditions = ['ps.deleted_at IS NULL', 'p.deleted_at IS NULL']
    const params = {}

    if (filters.productName) {
      conditions.push('p.name LIKE :productName')
      params.productName = `%${filters.productName}%`
    }

    if (filters.skuKeyword) {
      conditions.push(
        '(ps.sku_code LIKE :skuKeyword OR ps.temperature LIKE :skuKeyword OR ps.cup_size LIKE :skuKeyword)'
      )
      params.skuKeyword = `%${filters.skuKeyword}%`
    }

    if (filters.productStatus) {
      conditions.push('p.product_status = :productStatus')
      params.productStatus = this.toDbProductStatus(filters.productStatus)
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.sku_code AS skuCode,
          ps.temperature,
          ps.cup_size AS cupSize,
          ps.stock,
          ps.warning_stock AS warningStock,
          ps.sku_status AS skuStatus,
          ps.updated_at AS updatedAt,
          p.id AS productId,
          p.name AS productName,
          p.product_status AS productStatus
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.sort ASC, p.created_at DESC, ps.created_at ASC, ps.id ASC
      `,
      params
    )

    let list = rows.map(row => this.formatSkuInventory(row))

    if (filters.stockStatus) {
      list = list.filter(item => item.stockStatus === filters.stockStatus)
    }

    return { list }
  }

  // 查询库存调整记录
  async listAdjustments(filters = {}) {
    const conditions = ['1 = 1']
    const params = {}

    if (filters.skuId) {
      conditions.push('il.sku_id = :skuId')
      params.skuId = filters.skuId
    }

    if (filters.changeType) {
      conditions.push('il.change_type = :changeType')
      params.changeType = filters.changeType
    }

    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          il.id,
          il.sku_id AS skuId,
          ps.sku_code AS skuCode,
          p.name AS productName,
          il.change_type AS changeType,
          il.change_quantity AS changeQuantity,
          il.before_stock AS beforeStock,
          il.after_stock AS afterStock,
          il.related_order_id AS relatedOrderId,
          il.reason,
          il.created_at AS createdAt,
          il.created_by AS createdBy
        FROM inventory_logs il
        LEFT JOIN product_skus ps ON ps.id = il.sku_id
        LEFT JOIN products p ON p.id = ps.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY il.created_at DESC
      `,
      params
    )

    return {
      list: rows.map(row => this.formatInventoryLog(row)),
    }
  }

  // 查询 SKU 库存基础信息
  async findSkuForUpdate(skuId, connection = this.app.mysql) {
    const [rows] = await connection.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.stock,
          ps.warning_stock AS warningStock,
          ps.deleted_at AS deletedAt,
          p.id AS productId,
          p.name AS productName
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.id = :skuId
          AND ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
        LIMIT 1
      `,
      { skuId }
    )

    return rows[0] || null
  }

  // 调整 SKU 库存
  async adjustStock(data, adminUserId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()

      const sku = await this.findSkuForUpdate(data.skuId, connection)

      if (!sku) {
        await connection.rollback()
        return null
      }

      const beforeStock = Number(sku.stock)
      const afterStock = this.calculateAfterStock(beforeStock, data.adjustType, data.quantity)

      if (afterStock < 0) {
        await connection.rollback()
        return {
          errorCode: 50001,
          message: '库存不足',
          data: {
            skuId: data.skuId,
            availableStock: beforeStock,
          },
        }
      }

      const changeQuantity = afterStock - beforeStock
      const logId = this.service.authToken.createId('inv')

      await connection.execute(
        `
          UPDATE product_skus
          SET
            stock = :afterStock,
            updated_at = NOW(3),
            updated_by = :adminUserId
          WHERE id = :skuId
            AND deleted_at IS NULL
        `,
        {
          skuId: data.skuId,
          afterStock,
          adminUserId,
        }
      )

      await connection.execute(
        `
          INSERT INTO inventory_logs (
            id,
            sku_id,
            change_type,
            change_quantity,
            before_stock,
            after_stock,
            related_order_id,
            reason,
            created_at,
            created_by
          )
          VALUES (
            :logId,
            :skuId,
            :changeType,
            :changeQuantity,
            :beforeStock,
            :afterStock,
            NULL,
            :reason,
            NOW(3),
            :adminUserId
          )
        `,
        {
          logId,
          skuId: data.skuId,
          changeType: data.adjustType,
          changeQuantity,
          beforeStock,
          afterStock,
          reason: data.reason || null,
          adminUserId,
        }
      )

      await connection.commit()

      return {
        skuId: data.skuId,
        beforeStock,
        afterStock,
        changeQuantity,
      }
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 计算调整后库存
  calculateAfterStock(beforeStock, adjustType, quantity) {
    if (adjustType === 'in') {
      return beforeStock + quantity
    }

    if (adjustType === 'out') {
      return beforeStock - quantity
    }

    return quantity
  }

  // 格式化 SKU 库存响应
  formatSkuInventory(row) {
    return {
      skuId: row.skuId,
      skuCode: row.skuCode,
      productId: row.productId,
      productName: row.productName,
      specText: `${row.temperature} / ${row.cupSize}`,
      temperature: row.temperature,
      cupSize: row.cupSize,
      stock: Number(row.stock),
      warningStock: Number(row.warningStock),
      stockStatus: this.getStockStatus(Number(row.stock), Number(row.warningStock)),
      skuStatus: row.skuStatus,
      productStatus: this.toApiProductStatus(row.productStatus),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 格式化库存流水响应
  formatInventoryLog(row) {
    return {
      id: row.id,
      skuId: row.skuId,
      skuCode: row.skuCode,
      productName: row.productName,
      changeType: row.changeType,
      changeQuantity: Number(row.changeQuantity),
      beforeStock: Number(row.beforeStock),
      afterStock: Number(row.afterStock),
      relatedOrderId: row.relatedOrderId,
      reason: row.reason,
      createdAt: this.formatTime(row.createdAt),
      createdBy: row.createdBy,
    }
  }

  // 计算库存状态
  getStockStatus(stock, warningStock) {
    if (stock <= 0) {
      return 'soldOut'
    }

    if (stock <= warningStock) {
      return 'lowStock'
    }

    return 'normal'
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

module.exports = InventoryService
