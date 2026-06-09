'use strict'

module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next()

      if (ctx.status === 404 && !ctx.body) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: '接口不存在',
          data: {},
        }
      }
    } catch (err) {
      ctx.app.emit('error', err, ctx)

      const status = err.status || 500
      ctx.status = status
      ctx.body = {
        code: status === 500 ? 10000 : status,
        message: status === 500 ? '服务异常' : err.message,
        data: {},
      }
    }
  }
}
