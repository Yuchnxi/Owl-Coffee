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

  router.get('/api/admin/categories', adminAuth, controller.admin.category.index)
  router.post('/api/admin/categories', adminAuth, controller.admin.category.create)
  router.put('/api/admin/categories/:categoryId', adminAuth, controller.admin.category.update)
  router.delete('/api/admin/categories/:categoryId', adminAuth, controller.admin.category.destroy)

  router.get('/api/app/categories', controller.app.category.index)
  router.get('/api/public/categories', controller.public.category.index)
}
