'use strict'

class AppBootHook {
  constructor(app) {
    this.app = app
  }

  async didReady() {
    this.app.logger.info('Owl Coffee 服务端已启动')
  }
}

module.exports = AppBootHook
