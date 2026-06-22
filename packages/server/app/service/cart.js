'use strict'

const Service = require('egg').Service

class CartService extends Service {
  // 查询购物车
  async listCart(userId) {
    const [userRows] = await this.app.mysql.execute(
      'SELECT cart_version AS cartVersion FROM users WHERE id = :userId LIMIT 1',
      { userId }
    )
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          ci.id,
          ci.sku_id AS skuId,
          ci.sugar_level AS sugarLevel,
          ci.quantity,
          ci.created_at AS createdAt,
          ci.updated_at AS updatedAt,
          ps.sku_code AS skuCode,
          ps.temperature,
          ps.cup_size AS cupSize,
          ps.price,
          ps.stock,
          ps.sku_status AS skuStatus,
          p.id AS productId,
          p.name AS productName,
          p.image_url AS imageUrl,
          p.product_status AS productStatus,
          p.deleted_at AS productDeletedAt,
          ps.deleted_at AS skuDeletedAt
        FROM cart_items ci
        LEFT JOIN product_skus ps ON ps.id = ci.sku_id
        LEFT JOIN products p ON p.id = ps.product_id
        WHERE ci.user_id = :userId
        ORDER BY ci.updated_at DESC, ci.created_at DESC
      `,
      { userId }
    )

    return {
      cartVersion: Number((userRows[0] || {}).cartVersion) || 0,
      list: rows.map(row => this.formatCartItem(row)),
    }
  }

  // 同步购物车
  async syncCart(userId, items, cartVersion) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      const currentVersion = await this.lockCartVersion(connection, userId)

      if (currentVersion !== cartVersion) {
        await connection.rollback()
        return {
          conflict: true,
          cart: await this.listCart(userId),
        }
      }

      await connection.execute('DELETE FROM cart_items WHERE user_id = :userId', { userId })

      for (const item of items) {
        await this.upsertCartItem(connection, userId, item.skuId, item.quantity, item.sugarLevel)
      }

      await this.incrementCartVersion(connection, userId)

      await connection.commit()
      return this.listCart(userId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 锁定并读取购物车版本
  async lockCartVersion(connection, userId) {
    const [rows] = await connection.execute(
      'SELECT cart_version AS cartVersion FROM users WHERE id = :userId LIMIT 1 FOR UPDATE',
      { userId }
    )

    return Number((rows[0] || {}).cartVersion) || 0
  }

  // 递增购物车版本
  async incrementCartVersion(connection, userId) {
    await connection.execute(
      'UPDATE users SET cart_version = cart_version + 1 WHERE id = :userId',
      { userId }
    )

    return this.lockCartVersion(connection, userId)
  }

  // 加入购物车
  async addItem(userId, skuId, quantity, sugarLevel) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      await this.lockCartVersion(connection, userId)
      await this.upsertCartItem(connection, userId, skuId, quantity, sugarLevel, true)
      await this.incrementCartVersion(connection, userId)
      await connection.commit()

      return this.listCart(userId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 更新购物车项数量
  async updateItem(userId, cartItemId, quantity) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      await this.lockCartVersion(connection, userId)
      const [result] = await connection.execute(
        `
          UPDATE cart_items
          SET quantity = :quantity, updated_at = NOW(3)
          WHERE id = :cartItemId
            AND user_id = :userId
        `,
        { userId, cartItemId, quantity }
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return null
      }

      await this.incrementCartVersion(connection, userId)
      await connection.commit()
      return this.listCart(userId)
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 删除购物车项
  async deleteItem(userId, cartItemId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      await this.lockCartVersion(connection, userId)
      const [result] = await connection.execute(
        `
          DELETE FROM cart_items
          WHERE id = :cartItemId
            AND user_id = :userId
        `,
        { userId, cartItemId }
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return false
      }

      await this.incrementCartVersion(connection, userId)
      await connection.commit()
      return true
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 清空购物车
  async clearCart(userId) {
    const connection = await this.app.mysql.getConnection()

    try {
      await connection.beginTransaction()
      await this.lockCartVersion(connection, userId)
      await connection.execute('DELETE FROM cart_items WHERE user_id = :userId', { userId })
      await this.incrementCartVersion(connection, userId)
      await connection.commit()
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  // 校验 SKU 是否存在
  async findSku(skuId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          ps.id AS skuId,
          ps.sku_status AS skuStatus,
          ps.deleted_at AS skuDeletedAt,
          p.product_status AS productStatus,
          p.deleted_at AS productDeletedAt
        FROM product_skus ps
        INNER JOIN products p ON p.id = ps.product_id
        WHERE ps.id = :skuId
        LIMIT 1
      `,
      { skuId }
    )

    return rows[0] || null
  }

  // 写入或增加购物车项
  async upsertCartItem(connection, userId, skuId, quantity, sugarLevel = '不另外加糖', increment = false) {
    const id = this.service.authToken.createId('cart')

    if (increment) {
      await connection.execute(
        `
          INSERT INTO cart_items (id, user_id, sku_id, sugar_level, quantity, created_at, updated_at)
          VALUES (:id, :userId, :skuId, :sugarLevel, :quantity, NOW(3), NOW(3))
          ON DUPLICATE KEY UPDATE
            quantity = quantity + VALUES(quantity),
            updated_at = NOW(3)
        `,
        { id, userId, skuId, sugarLevel, quantity }
      )
      return
    }

    await connection.execute(
      `
        INSERT INTO cart_items (id, user_id, sku_id, sugar_level, quantity, created_at, updated_at)
        VALUES (:id, :userId, :skuId, :sugarLevel, :quantity, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
          quantity = VALUES(quantity),
          updated_at = NOW(3)
      `,
      { id, userId, skuId, sugarLevel, quantity }
    )
  }

  // 格式化购物车项
  formatCartItem(row) {
    const available = !row.productDeletedAt &&
      !row.skuDeletedAt &&
      row.productStatus === 'on_sale' &&
      row.skuStatus === 'enabled' &&
      Number(row.stock) > 0

    return {
      id: row.id,
      skuId: row.skuId,
      quantity: Number(row.quantity),
      productId: row.productId,
      productName: row.productName,
      imageUrl: row.imageUrl,
      skuCode: row.skuCode,
      temperature: row.temperature,
      cupSize: row.cupSize,
      sugarLevel: row.sugarLevel,
      specText: `${row.temperature || '待补充'} / ${row.cupSize || '待补充'} / ${row.sugarLevel || '不另外加糖'}`,
      price: row.price === null ? null : Number(row.price),
      stock: row.stock === null ? 0 : Number(row.stock),
      available,
      subtotalAmount: row.price === null ? 0 : Number(row.price) * Number(row.quantity),
      createdAt: this.formatTime(row.createdAt),
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = CartService
