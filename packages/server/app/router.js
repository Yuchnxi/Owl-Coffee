'use strict'

module.exports = app => {
  const { router, controller, middleware } = app
  const adminAuth = middleware.adminAuth()

  router.get('/', controller.health.index)
  router.get('/api/health', controller.health.index)
  router.get('/api/health/database', controller.health.database)

  router.get('/api/admin/auth/captcha', controller.admin.auth.captcha)
  router.post('/api/admin/auth/login', controller.admin.auth.login)
  router.post('/api/admin/auth/refresh', controller.admin.auth.refresh)
  router.post('/api/admin/auth/logout', adminAuth, controller.admin.auth.logout)
  router.get('/api/admin/auth/me', adminAuth, controller.admin.auth.me)
}
