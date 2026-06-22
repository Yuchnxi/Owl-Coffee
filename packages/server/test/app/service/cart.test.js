'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/service/cart.test.js', () => {
  let originalGetConnection

  beforeEach(() => {
    originalGetConnection = app.mysql.getConnection
  })

  afterEach(() => {
    app.mysql.getConnection = originalGetConnection
  })

  // 创建购物车事务模拟连接
  function createConnection(cartVersion) {
    const calls = []
    const connection = {
      calls,
      beginTransaction: async () => calls.push({ type: 'begin' }),
      commit: async () => calls.push({ type: 'commit' }),
      rollback: async () => calls.push({ type: 'rollback' }),
      release: () => calls.push({ type: 'release' }),
      execute: async (sql, params = {}) => {
        calls.push({ type: 'execute', sql, params })

        if (sql.includes('SELECT cart_version')) {
          return [[{ cartVersion }]]
        }

        return [{ affectedRows: 1 }]
      },
    }

    app.mysql.getConnection = async () => connection
    return connection
  }

  it('syncCart rejects an expired cart version', async () => {
    const ctx = app.mockContext()
    const connection = createConnection(3)
    ctx.service.cart.listCart = async () => ({ cartVersion: 3, list: [] })

    const result = await ctx.service.cart.syncCart('user_001', [], 2)

    assert(result.conflict === true)
    assert(result.cart.cartVersion === 3)
    assert(connection.calls.some(call => call.type === 'rollback'))
    assert(!connection.calls.some(call => call.type === 'commit'))
    assert(!connection.calls.some(call => call.sql && call.sql.includes('DELETE FROM cart_items')))
  })

  it('syncCart increments the current cart version', async () => {
    const ctx = app.mockContext()
    const connection = createConnection(3)
    ctx.service.cart.listCart = async () => ({ cartVersion: 4, list: [] })

    const result = await ctx.service.cart.syncCart('user_001', [], 3)

    assert(result.cartVersion === 4)
    assert(connection.calls.some(call => call.sql && call.sql.includes('DELETE FROM cart_items')))
    assert(connection.calls.some(call => call.sql && call.sql.includes('cart_version = cart_version + 1')))
    assert(connection.calls.some(call => call.type === 'commit'))
    assert(!connection.calls.some(call => call.type === 'rollback'))
  })
})
