'use strict'

module.exports = app => {
  const { router, controller } = app

  router.get('/', controller.health.index)
  router.get('/api/health', controller.health.index)
}
