'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/service/admin_user.test.js', () => {
  let originalExecute

  beforeEach(() => {
    originalExecute = app.mysql.execute
  })

  afterEach(() => {
    app.mysql.execute = originalExecute
  })

  function mockExecute(results) {
    let index = 0

    app.mysql.execute = async () => {
      const result = results[index]
      index += 1
      return result
    }
  }

  function mockAdminRow(overrides = {}) {
    return {
      id: 'admin_001',
      account: 'admin',
      name: '管理员',
      phone: null,
      avatarUrl: null,
      roleId: 'role_admin',
      roleName: '管理员',
      roleCode: 'admin',
      status: 'enabled',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    }
  }

  it('createAdminUser returns conflict when account exists', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[{ id: 'role_staff', name: '店员', code: 'staff', status: 'enabled' }]],
      [[{ id: 'admin_exists' }]],
    ])

    const result = await ctx.service.adminUser.createAdminUser({
      account: 'staff01',
      name: '店员',
      phone: '',
      roleId: 'role_staff',
      password: '123456',
      status: 'enabled',
    }, 'admin_001')

    assert(result.conflict === true)
    assert(result.error === '登录账号已存在')
  })

  it('updateAdminUserStatus rejects disabling current account', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[mockAdminRow()]],
    ])

    const result = await ctx.service.adminUser.updateAdminUserStatus('admin_001', 'disabled', 'admin_001')

    assert(result.error === '不能禁用当前登录账号')
  })

  it('deleteAdminUser rejects deleting last enabled admin', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[mockAdminRow()]],
      [[{ total: 0 }]],
    ])

    const result = await ctx.service.adminUser.deleteAdminUser('admin_001', 'admin_002')

    assert(result.error === '至少需要保留一个启用状态的管理员账号')
  })

  it('updateAdminUser rejects changing last enabled admin to staff', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[mockAdminRow()]],
      [[{ id: 'role_staff', name: '店员', code: 'staff', status: 'enabled' }]],
      [[{ total: 0 }]],
    ])

    const result = await ctx.service.adminUser.updateAdminUser('admin_001', {
      name: '管理员',
      phone: '',
      roleId: 'role_staff',
    }, 'admin_002')

    assert(result.error === '至少需要保留一个启用状态的管理员账号')
  })

  it('resetAdminUserPassword returns notFound for missing account', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[]],
    ])

    const result = await ctx.service.adminUser.resetAdminUserPassword('admin_missing', '123456', 'admin_001')

    assert(result.notFound === true)
  })
})
