'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/service/order.test.js', () => {
  let originalGetConnection

  beforeEach(() => {
    originalGetConnection = app.mysql.getConnection
  })

  afterEach(() => {
    app.mysql.getConnection = originalGetConnection
  })

  function createPendingOrder(overrides = {}) {
    return {
      id: 'order_001',
      orderNo: 'OC202606150001',
      userId: 'user_001',
      orderStatus: 'pending_payment',
      paymentStatus: 'unpaid',
      paymentMethod: 'mock',
      totalAmount: 40,
      discountAmount: 0,
      payAmount: 40,
      userCouponId: null,
      pickupCode: null,
      ...overrides,
    }
  }

  function createSku(overrides = {}) {
    return {
      skuId: 'sku_001',
      productId: 'prod_001',
      skuCode: 'OC-SKU-001',
      temperature: 'hot',
      cupSize: 'medium',
      sugarLevel: 'normal',
      price: 20,
      stock: 5,
      skuStatus: 'enabled',
      productName: '待补充',
      imageUrl: null,
      productStatus: 'on_sale',
      ...overrides,
    }
  }

  function createMockConnection({ order, items, skus }) {
    const calls = []
    let cartVersion = 0
    const connection = {
      calls,
      beginTransaction: async () => calls.push({ type: 'begin' }),
      commit: async () => calls.push({ type: 'commit' }),
      rollback: async () => calls.push({ type: 'rollback' }),
      release: () => calls.push({ type: 'release' }),
      execute: async (sql, params = {}) => {
        calls.push({ type: 'execute', sql, params })

        if (sql.includes('UPDATE users SET cart_version')) {
          cartVersion += 1
          return [{ affectedRows: 1 }]
        }

        if (sql.includes('SELECT cart_version') && sql.includes('FOR UPDATE')) {
          return [[{ cartVersion }]]
        }

        if (sql.includes('FROM orders') && sql.includes('FOR UPDATE')) {
          return [[order]]
        }

        if (sql.includes('FROM order_items') && sql.includes('FOR UPDATE')) {
          return [items]
        }

        if (sql.includes('FROM product_skus ps') && sql.includes('FOR UPDATE')) {
          return [skus]
        }

        return [{ affectedRows: 1 }]
      },
    }

    app.mysql.getConnection = async () => connection

    return connection
  }

  function findExecuteCall(calls, keyword, predicate = () => true) {
    return calls.find(call => call.type === 'execute' && call.sql.includes(keyword) && predicate(call))
  }

  function hasExecuteCall(calls, keyword, predicate = () => true) {
    return Boolean(findExecuteCall(calls, keyword, predicate))
  }

  it('mockPay success deducts stock and writes order payment logs', async () => {
    const ctx = app.mockContext()
    ctx.service.cart.listCart = async () => ({ cartVersion: 1, list: [] })
    const connection = createMockConnection({
      order: createPendingOrder(),
      items: [
        {
          skuId: 'sku_001',
          sugarLevel: '半糖',
          quantity: 2,
        },
      ],
      skus: [createSku({ stock: 5 })],
    })

    const result = await ctx.service.order.mockPay('order_001', 'user_001', 'success')

    assert(result.orderId === 'order_001')
    assert(result.orderStatus === 'paid')
    assert(result.paymentStatus === 'paid')
    assert(result.pickupCode)
    assert(result.cart.cartVersion === 1)
    assert(hasExecuteCall(connection.calls, 'UPDATE product_skus', call => call.params.afterStock === 3))
    assert(hasExecuteCall(connection.calls, 'INSERT INTO inventory_logs', call => {
      return call.params.changeQuantity === -2 && call.params.beforeStock === 5 && call.params.afterStock === 3
    }))
    assert(hasExecuteCall(connection.calls, 'INSERT INTO payment_records', call => {
      return call.params.paymentStatus === 'success' && call.params.amount === 40
    }))
    assert(hasExecuteCall(connection.calls, 'UPDATE orders', call => {
      return call.params.orderId === 'order_001' && call.params.pickupCode === result.pickupCode
    }))
    assert(hasExecuteCall(connection.calls, 'UPDATE users', call => {
      return call.params.userId === 'user_001' && call.params.payAmount === 40
    }))
    assert(hasExecuteCall(connection.calls, 'UPDATE cart_items', call => {
      return call.sql.includes('GREATEST') &&
        call.params.userId === 'user_001' &&
        call.params.skuId === 'sku_001' &&
        call.params.sugarLevel === '半糖' &&
        call.params.quantity === 2
    }))
    assert(hasExecuteCall(connection.calls, 'DELETE FROM cart_items', call => {
      return call.params.userId === 'user_001' &&
        call.params.skuId === 'sku_001' &&
        call.params.sugarLevel === '半糖'
    }))
    assert(hasExecuteCall(connection.calls, 'cart_version = cart_version + 1'))
    assert(connection.calls.some(call => call.type === 'commit'))
    assert(!connection.calls.some(call => call.type === 'rollback'))
  })

  it('mockPay returns stock error and rolls back when stock is insufficient', async () => {
    const ctx = app.mockContext()
    const connection = createMockConnection({
      order: createPendingOrder(),
      items: [
        {
          skuId: 'sku_001',
          quantity: 2,
        },
      ],
      skus: [createSku({ stock: 1 })],
    })

    const result = await ctx.service.order.mockPay('order_001', 'user_001', 'success')

    assert(result.errorCode === 50001)
    assert(result.message === '库存不足')
    assert(result.data.skuId === 'sku_001')
    assert(result.data.availableStock === 1)
    assert(connection.calls.some(call => call.type === 'rollback'))
    assert(!connection.calls.some(call => call.type === 'commit'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE product_skus'))
    assert(!hasExecuteCall(connection.calls, 'INSERT INTO inventory_logs'))
    assert(!hasExecuteCall(connection.calls, 'INSERT INTO payment_records'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE orders'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE cart_items'))
  })

  it('mockPay fail keeps order unpaid and does not deduct stock', async () => {
    const ctx = app.mockContext()
    const connection = createMockConnection({
      order: createPendingOrder(),
      items: [],
      skus: [],
    })

    const result = await ctx.service.order.mockPay('order_001', 'user_001', 'fail')

    assert(result.orderId === 'order_001')
    assert(result.orderStatus === 'pendingPayment')
    assert(result.paymentStatus === 'unpaid')
    assert(result.pickupCode === null)
    assert(hasExecuteCall(connection.calls, 'INSERT INTO payment_records', call => {
      return call.params.paymentStatus === 'fail' && call.params.amount === 40
    }))
    assert(!hasExecuteCall(connection.calls, 'FROM order_items'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE product_skus'))
    assert(!hasExecuteCall(connection.calls, 'INSERT INTO inventory_logs'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE orders'))
    assert(!hasExecuteCall(connection.calls, 'UPDATE cart_items'))
    assert(connection.calls.some(call => call.type === 'commit'))
    assert(!connection.calls.some(call => call.type === 'rollback'))
  })
})
