'use strict'

module.exports = app => {
  const { router, controller, middleware } = app
  const adminAuth = middleware.adminAuth()
  const appAuth = middleware.appAuth()

  router.get('/', controller.health.index)
  router.get('/api/health', controller.health.index)
  router.get('/api/health/database', controller.health.database)

  router.get('/api/admin/auth/captcha', controller.admin.auth.captcha)
  router.post('/api/admin/auth/login', controller.admin.auth.login)
  router.post('/api/admin/auth/refresh', controller.admin.auth.refresh)
  router.post('/api/admin/auth/logout', adminAuth, controller.admin.auth.logout)
  router.get('/api/admin/auth/me', adminAuth, controller.admin.auth.me)

  router.get('/api/admin/dashboard/summary', adminAuth, controller.admin.dashboard.summary)
  router.get('/api/admin/dashboard/sales-trend', adminAuth, controller.admin.dashboard.salesTrend)
  router.get('/api/admin/dashboard/order-status', adminAuth, controller.admin.dashboard.orderStatus)
  router.get('/api/admin/dashboard/recent-orders', adminAuth, controller.admin.dashboard.recentOrders)
  router.get('/api/admin/dashboard/stock-warnings', adminAuth, controller.admin.dashboard.stockWarnings)

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

  router.get('/api/admin/orders', adminAuth, controller.admin.order.index)
  router.post('/api/admin/orders', adminAuth, controller.admin.order.create)
  router.get('/api/admin/orders/:orderId', adminAuth, controller.admin.order.show)
  router.put('/api/admin/orders/:orderId/status', adminAuth, controller.admin.order.updateStatus)
  router.put('/api/admin/orders/:orderId/cancel', adminAuth, controller.admin.order.cancel)
  router.put('/api/admin/orders/:orderId/refund', adminAuth, controller.admin.order.refund)
  router.delete('/api/admin/orders/:orderId', adminAuth, controller.admin.order.destroy)

  router.get('/api/admin/users', adminAuth, controller.admin.user.index)
  router.get('/api/admin/users/:userId', adminAuth, controller.admin.user.show)
  router.put('/api/admin/users/:userId/status', adminAuth, controller.admin.user.updateStatus)

  router.get('/api/admin/coupons', adminAuth, controller.admin.coupon.index)
  router.post('/api/admin/coupons', adminAuth, controller.admin.coupon.create)
  router.put('/api/admin/coupons/:couponId', adminAuth, controller.admin.coupon.update)
  router.put('/api/admin/coupons/:couponId/disable', adminAuth, controller.admin.coupon.disable)
  router.delete('/api/admin/coupons/:couponId', adminAuth, controller.admin.coupon.destroy)

  router.get('/api/admin/roles', adminAuth, controller.admin.role.index)
  router.get('/api/admin/roles/:roleId', adminAuth, controller.admin.role.show)
  router.put('/api/admin/roles/:roleId/menus', adminAuth, controller.admin.role.updateMenus)
  router.get('/api/admin/menus', adminAuth, controller.admin.role.menus)

  router.get('/api/admin/settings/store', adminAuth, controller.admin.setting.store)
  router.put('/api/admin/settings/store', adminAuth, controller.admin.setting.updateStore)
  router.get('/api/admin/settings/account', adminAuth, controller.admin.setting.account)
  router.put('/api/admin/settings/account', adminAuth, controller.admin.setting.updateAccount)

  router.post('/api/app/auth/login', controller.app.auth.login)
  router.post('/api/app/auth/phone', appAuth, controller.app.auth.phone)
  router.get('/api/app/auth/me', appAuth, controller.app.auth.me)

  router.get('/api/app/categories', controller.app.category.index)
  router.get('/api/app/products', controller.app.product.index)
  router.get('/api/app/products/:productId', controller.app.product.show)
  router.get('/api/app/skus/:skuId/availability', controller.app.product.availability)
  router.get('/api/app/cart', appAuth, controller.app.cart.index)
  router.post('/api/app/cart/sync', appAuth, controller.app.cart.sync)
  router.post('/api/app/cart/items', appAuth, controller.app.cart.addItem)
  router.put('/api/app/cart/items/:cartItemId', appAuth, controller.app.cart.updateItem)
  router.delete('/api/app/cart/items/:cartItemId', appAuth, controller.app.cart.deleteItem)
  router.delete('/api/app/cart', appAuth, controller.app.cart.clear)
  router.get('/api/app/coupons', appAuth, controller.app.coupon.index)
  router.get('/api/app/coupons/available', appAuth, controller.app.coupon.available)
  router.post('/api/app/orders', appAuth, controller.app.order.create)
  router.get('/api/app/orders', appAuth, controller.app.order.index)
  router.get('/api/app/orders/:orderId', appAuth, controller.app.order.show)
  router.put('/api/app/orders/:orderId/cancel', appAuth, controller.app.order.cancel)
  router.put('/api/app/orders/:orderId/confirm-pickup', appAuth, controller.app.order.confirmPickup)
  router.post('/api/app/payments/mock', appAuth, controller.app.payment.mock)

  router.get('/api/public/categories', controller.public.category.index)
  router.get('/api/public/products', controller.public.product.index)
  router.get('/api/public/products/recommended', controller.public.product.recommended)
  router.get('/api/public/store', controller.public.content.store)
  router.get('/api/public/miniapp-qrcode', controller.public.content.miniappQrcode)
}
