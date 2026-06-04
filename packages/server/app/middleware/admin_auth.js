'use strict'

module.exports = () => {
  return async function adminAuth(ctx, next) {
    const token = ctx.getBearerToken()

    if (!token) {
      ctx.status = 401
      ctx.fail(20001, '未登录')
      return
    }

    try {
      const payload = ctx.service.authToken.verifyAccessToken(token)

      if (payload.subjectType !== 'admin') {
        ctx.status = 403
        ctx.fail(20004, '无权限')
        return
      }

      ctx.state.admin = {
        id: payload.sub,
        roleId: payload.roleId,
      }

      await next()
    } catch (err) {
      ctx.status = 401
      ctx.fail(20002, 'Token 已过期')
    }
  }
}
