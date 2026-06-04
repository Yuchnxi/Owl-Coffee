'use strict'

module.exports = () => {
  return async function adminOperationLog(ctx, next) {
    await next()

    if (ctx.status >= 400 || !ctx.state.admin) {
      return
    }

    await ctx.service.adminLog.createOperationLog({
      adminUserId: ctx.state.admin.id,
      module: getModule(ctx.path),
      action: getAction(ctx.method, ctx.path),
      targetId: getTargetId(ctx.params),
      summary: `${ctx.method} ${ctx.path}`,
      ip: ctx.ip,
    })
  }
}

function getModule(path) {
  const parts = path.split('/').filter(Boolean)

  return parts[2] || 'unknown'
}

function getAction(method, path) {
  if (path.endsWith('/disable')) {
    return 'disable'
  }

  if (path.endsWith('/status')) {
    return 'updateStatus'
  }

  if (path.endsWith('/cancel')) {
    return 'cancel'
  }

  if (path.endsWith('/refund')) {
    return 'refund'
  }

  if (path.endsWith('/menus')) {
    return 'updateMenus'
  }

  const map = {
    POST: 'create',
    PUT: 'update',
    DELETE: 'delete',
  }

  return map[method] || method.toLowerCase()
}

function getTargetId(params = {}) {
  const keys = Object.keys(params)

  return keys.length > 0 ? params[keys[0]] : null
}
