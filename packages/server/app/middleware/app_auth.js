'use strict'

module.exports = () => {
  return async function appAuth(ctx, next) {
    const token = ctx.getBearerToken()

    if (!token) {
      ctx.status = 401
      ctx.fail(20001, '未登录')
      return
    }

    let payload

    try {
      payload = ctx.service.authToken.verifyAccessToken(token)
    } catch (err) {
      ctx.status = 401
      ctx.fail(20002, 'Token 已过期')
      return
    }

    if (payload.subjectType !== 'app_user') {
      ctx.status = 403
      ctx.fail(20004, '无权限')
      return
    }

    ctx.state.appUser = {
      id: payload.sub,
    }

    await next()
  }
}
