'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/service/role.test.js', () => {
  let originalExecute
  let originalGetConnection

  beforeEach(() => {
    originalExecute = app.mysql.execute
    originalGetConnection = app.mysql.getConnection
  })

  afterEach(() => {
    app.mysql.execute = originalExecute
    app.mysql.getConnection = originalGetConnection
  })

  function mockExecute(results) {
    let index = 0

    app.mysql.execute = async () => {
      const result = results[index]
      index += 1
      return result
    }
  }

  it('findRoleDetail excludes default menu from editable menuIds', async () => {
    const ctx = app.mockContext()
    const now = new Date()

    mockExecute([
      [[{
        id: 'role_admin',
        name: '管理员',
        code: 'admin',
        description: '后台管理员',
        status: 'enabled',
        createdAt: now,
        updatedAt: now,
      }]],
      [[
        {
          id: 'dashboard',
          parentId: null,
          name: '仪表盘',
          path: '/dashboard',
          icon: 'dashboard',
          sort: 10,
          status: 'enabled',
          meta: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'settings',
          parentId: null,
          name: '系统设置',
          path: '/settings',
          icon: 'settings',
          sort: 70,
          status: 'enabled',
          meta: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'menu_management',
          parentId: 'settings',
          name: '菜单管理',
          path: '/settings/menus',
          icon: 'menuManagement',
          sort: 20,
          status: 'enabled',
          meta: null,
          createdAt: now,
          updatedAt: now,
        },
      ]],
    ])

    const role = await ctx.service.role.findRoleDetail('role_admin')

    assert(role.menuIds.includes('menu_management'))
    assert(!role.menuIds.includes('dashboard'))
    assert(role.menus.some(menu => menu.id === 'dashboard'))
    assert(role.menus.find(menu => menu.id === 'settings').children[0].id === 'menu_management')
  })

  it('areMenuIdsValid rejects invalid menu id', async () => {
    const ctx = app.mockContext()

    mockExecute([
      [[{ id: 'orders' }]],
    ])

    const valid = await ctx.service.role.areMenuIdsValid(['orders', 'missing_menu'])

    assert(valid === false)
  })

  it('updateRoleMenus does not insert default dashboard menu', async () => {
    const ctx = app.mockContext()
    const calls = []
    const now = new Date()

    app.mysql.getConnection = async () => ({
      beginTransaction: async () => calls.push({ type: 'begin' }),
      execute: async (sql, params) => {
        calls.push({ type: 'execute', sql, params })
        return [{ affectedRows: 1 }]
      },
      commit: async () => calls.push({ type: 'commit' }),
      rollback: async () => calls.push({ type: 'rollback' }),
      release: () => calls.push({ type: 'release' }),
    })

    mockExecute([
      [[{
        id: 'role_staff',
        name: '店员',
        code: 'staff',
        description: '门店店员',
        status: 'enabled',
        createdAt: now,
        updatedAt: now,
      }]],
      [[
        {
          id: 'dashboard',
          parentId: null,
          name: '仪表盘',
          path: '/dashboard',
          icon: 'dashboard',
          sort: 10,
          status: 'enabled',
          meta: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'orders',
          parentId: null,
          name: '订单管理',
          path: '/orders',
          icon: 'orders',
          sort: 30,
          status: 'enabled',
          meta: null,
          createdAt: now,
          updatedAt: now,
        },
      ]],
    ])

    await ctx.service.role.updateRoleMenus('role_staff', ['dashboard', 'orders'])

    const insertedMenuIds = calls
      .filter(call => call.sql && call.sql.includes('INSERT INTO role_menus'))
      .map(call => call.params.menuId)

    assert.deepStrictEqual(insertedMenuIds, ['orders'])
  })
})
