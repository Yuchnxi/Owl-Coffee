'use strict'

module.exports = app => {
  const { router, controller, middleware } = app
  const adminAuth = middleware.adminAuth()
  const adminOperationLog = middleware.adminOperationLog()
  const appAuth = middleware.appAuth()

  // 健康检查
  router.get('/', controller.health.index)
  router.get('/api/health', controller.health.index)
  router.get('/api/health/database', controller.health.database)

  // 后台鉴权
  router.get('/api/admin/auth/captcha', controller.admin.auth.captcha)
  router.post('/api/admin/auth/login', controller.admin.auth.login)
  router.post('/api/admin/auth/refresh', controller.admin.auth.refresh)
  router.post('/api/admin/auth/logout', adminAuth, adminOperationLog, controller.admin.auth.logout)
  router.get('/api/admin/auth/me', adminAuth, controller.admin.auth.me)

  // 后台文件上传
  router.post('/api/admin/uploads', adminAuth, adminOperationLog, controller.admin.upload.create)

  // 后台仪表盘
  router.get('/api/admin/dashboard/summary', adminAuth, controller.admin.dashboard.summary)
  router.get('/api/admin/dashboard/sales-trend', adminAuth, controller.admin.dashboard.salesTrend)
  router.get('/api/admin/dashboard/order-status', adminAuth, controller.admin.dashboard.orderStatus)
  router.get('/api/admin/dashboard/recent-orders', adminAuth, controller.admin.dashboard.recentOrders)
  router.get('/api/admin/dashboard/stock-warnings', adminAuth, controller.admin.dashboard.stockWarnings)

  // 后台商品分类
  router.get('/api/admin/categories', adminAuth, controller.admin.category.index)
  router.post('/api/admin/categories', adminAuth, adminOperationLog, controller.admin.category.create)
  router.put('/api/admin/categories/:categoryId', adminAuth, adminOperationLog, controller.admin.category.update)
  router.delete('/api/admin/categories/:categoryId', adminAuth, adminOperationLog, controller.admin.category.destroy)

  // 后台商品与 SKU
  router.get('/api/admin/products', adminAuth, controller.admin.product.index)
  router.post('/api/admin/products', adminAuth, adminOperationLog, controller.admin.product.create)
  router.get('/api/admin/products/:productId', adminAuth, controller.admin.product.show)
  router.put('/api/admin/products/:productId', adminAuth, adminOperationLog, controller.admin.product.update)
  router.put('/api/admin/products/:productId/status', adminAuth, adminOperationLog, controller.admin.product.updateStatus)
  router.delete('/api/admin/products/:productId', adminAuth, adminOperationLog, controller.admin.product.destroy)

  // 后台库存管理
  router.get('/api/admin/inventory/skus', adminAuth, controller.admin.inventory.skus)
  router.post('/api/admin/inventory/adjustments', adminAuth, adminOperationLog, controller.admin.inventory.adjust)
  router.get('/api/admin/inventory/adjustments', adminAuth, controller.admin.inventory.adjustments)

  // 后台订单管理
  router.get('/api/admin/orders', adminAuth, controller.admin.order.index)
  router.post('/api/admin/orders', adminAuth, adminOperationLog, controller.admin.order.create)
  router.get('/api/admin/orders/:orderId', adminAuth, controller.admin.order.show)
  router.put('/api/admin/orders/:orderId/status', adminAuth, adminOperationLog, controller.admin.order.updateStatus)
  router.put('/api/admin/orders/:orderId/cancel', adminAuth, adminOperationLog, controller.admin.order.cancel)
  router.put('/api/admin/orders/:orderId/refund', adminAuth, adminOperationLog, controller.admin.order.refund)
  router.delete('/api/admin/orders/:orderId', adminAuth, adminOperationLog, controller.admin.order.destroy)

  // 后台用户管理
  router.get('/api/admin/users', adminAuth, controller.admin.user.index)
  router.get('/api/admin/users/:userId', adminAuth, controller.admin.user.show)
  router.put('/api/admin/users/:userId/status', adminAuth, adminOperationLog, controller.admin.user.updateStatus)

  // 后台优惠券管理
  router.get('/api/admin/coupons', adminAuth, controller.admin.coupon.index)
  router.post('/api/admin/coupons', adminAuth, adminOperationLog, controller.admin.coupon.create)
  router.put('/api/admin/coupons/:couponId', adminAuth, adminOperationLog, controller.admin.coupon.update)
  router.put('/api/admin/coupons/:couponId/disable', adminAuth, adminOperationLog, controller.admin.coupon.disable)
  router.delete('/api/admin/coupons/:couponId', adminAuth, adminOperationLog, controller.admin.coupon.destroy)

  // 后台角色与菜单
  router.get('/api/admin/roles', adminAuth, controller.admin.role.index)
  router.get('/api/admin/roles/:roleId', adminAuth, controller.admin.role.show)
  router.put('/api/admin/roles/:roleId/menus', adminAuth, adminOperationLog, controller.admin.role.updateMenus)
  router.get('/api/admin/menus', adminAuth, controller.admin.role.menus)

  // 后台日志查询
  router.get('/api/admin/logs/login', adminAuth, controller.admin.log.loginLogs)
  router.get('/api/admin/logs/operation', adminAuth, controller.admin.log.operationLogs)

  // 后台系统设置
  router.get('/api/admin/settings/store', adminAuth, controller.admin.setting.store)
  router.put('/api/admin/settings/store', adminAuth, adminOperationLog, controller.admin.setting.updateStore)
  router.get('/api/admin/settings/account', adminAuth, controller.admin.setting.account)
  router.put('/api/admin/settings/account', adminAuth, adminOperationLog, controller.admin.setting.updateAccount)

  // 小程序鉴权
  router.post('/api/app/auth/login', controller.app.auth.login)
  router.post('/api/app/auth/phone', appAuth, controller.app.auth.phone)
  router.get('/api/app/auth/me', appAuth, controller.app.auth.me)

  // 小程序商品浏览
  router.get('/api/app/categories', controller.app.category.index)
  router.get('/api/app/products', controller.app.product.index)
  router.get('/api/app/products/:productId', controller.app.product.show)
  router.get('/api/app/skus/:skuId/availability', controller.app.product.availability)

  // 小程序购物车
  router.get('/api/app/cart', appAuth, controller.app.cart.index)
  router.post('/api/app/cart/sync', appAuth, controller.app.cart.sync)
  router.post('/api/app/cart/items', appAuth, controller.app.cart.addItem)
  router.put('/api/app/cart/items/:cartItemId', appAuth, controller.app.cart.updateItem)
  router.delete('/api/app/cart/items/:cartItemId', appAuth, controller.app.cart.deleteItem)
  router.delete('/api/app/cart', appAuth, controller.app.cart.clear)

  // 小程序优惠券
  router.get('/api/app/coupons', appAuth, controller.app.coupon.index)
  router.get('/api/app/coupons/available', appAuth, controller.app.coupon.available)

  // 小程序订单与模拟支付
  router.post('/api/app/orders', appAuth, controller.app.order.create)
  router.get('/api/app/orders', appAuth, controller.app.order.index)
  router.get('/api/app/orders/:orderId', appAuth, controller.app.order.show)
  router.put('/api/app/orders/:orderId/cancel', appAuth, controller.app.order.cancel)
  router.put('/api/app/orders/:orderId/confirm-pickup', appAuth, controller.app.order.confirmPickup)
  router.post('/api/app/payments/mock', appAuth, controller.app.payment.mock)

  // 官网公开展示
  router.get('/api/public/categories', controller.public.category.index)
  router.get('/api/public/products', controller.public.product.index)
  router.get('/api/public/products/recommended', controller.public.product.recommended)
  router.get('/api/public/store', controller.public.content.store)
  router.get('/api/public/miniapp-qrcode', controller.public.content.miniappQrcode)
}
