'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/service/menu.test.js', () => {
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

  it('listMenuTree builds parent child menu tree', async () => {
    const ctx = app.mockContext()
    const now = new Date()

    app.mysql.execute = async () => [[
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
    ]]

    const result = await ctx.service.menu.listMenuTree()

    assert(result.list.length === 1)
    assert(result.list[0].id === 'settings')
    assert(result.list[0].children[0].id === 'menu_management')
  })

  it('deleteMenu soft deletes menu and removes role bindings', async () => {
    const ctx = app.mockContext()
    const calls = []

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

    const deleted = await ctx.service.menu.deleteMenu('menu_management')

    assert(deleted === true)
    assert(calls.some(call => call.sql && call.sql.includes('UPDATE menus')))
    assert(calls.some(call => call.sql && call.sql.includes('DELETE FROM role_menus')))
    assert(calls.some(call => call.type === 'commit'))
  })

  it('isDescendantOf detects descendant menu', async () => {
    const ctx = app.mockContext()

    app.mysql.execute = async () => [[
      { id: 'settings', parentId: null },
      { id: 'menu_management', parentId: 'settings' },
      { id: 'menu_detail', parentId: 'menu_management' },
    ]]

    const result = await ctx.service.menu.isDescendantOf('menu_detail', 'settings')
    const unrelated = await ctx.service.menu.isDescendantOf('settings', 'menu_detail')

    assert(result === true)
    assert(unrelated === false)
  })

  it('isDescendantOf handles existing menu cycle', async () => {
    const ctx = app.mockContext()

    app.mysql.execute = async () => [[
      { id: 'menu_a', parentId: 'menu_b' },
      { id: 'menu_b', parentId: 'menu_a' },
      { id: 'settings', parentId: null },
    ]]

    const result = await ctx.service.menu.isDescendantOf('menu_a', 'settings')

    assert(result === false)
  })
})
