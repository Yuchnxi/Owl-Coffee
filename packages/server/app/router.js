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

  router.get('/api/admin/products', adminAuth, controller.admin.product.index)
  router.post('/api/admin/products', adminAuth, controller.admin.product.create)
  router.get('/api/admin/products/:productId', adminAuth, controller.admin.product.show)
  router.put('/api/admin/products/:productId', adminAuth, controller.admin.product.update)
  router.put('/api/admin/products/:productId/status', adminAuth, controller.admin.product.updateStatus)
  router.delete('/api/admin/products/:productId', adminAuth, controller.admin.product.destroy)

  router.get('/api/admin/inventory/skus', adminAuth, controller.admin.inventory.skus)
  router.post('/api/admin/inventory/adjustments', adminAuth, controller.admin.inventory.adjust)
  router.get('/api/admin/inventory/adjustments', adminAuth, controller.admin.inventory.adjustments)

  router.get('/api/app/categories', controller.app.category.index)
  router.get('/api/app/products', controller.app.product.index)
  router.get('/api/app/products/:productId', controller.app.product.show)
  router.get('/api/app/skus/:skuId/availability', controller.app.product.availability)

  router.get('/api/public/categories', controller.public.category.index)
  router.get('/api/public/products', controller.public.product.index)
  router.get('/api/public/products/recommended', controller.public.product.recommended)
}
