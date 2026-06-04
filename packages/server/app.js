'use strict'

const mysql = require('mysql2/promise')

class AppBootHook {
  constructor(app) {
    this.app = app
  }

  async configWillLoad() {
    const { database } = this.app.config

    this.app.mysql = mysql.createPool({
      host: database.host,
      port: database.port,
      database: database.database,
      user: database.user,
      password: database.password,
      waitForConnections: true,
      connectionLimit: database.connectionLimit,
      namedPlaceholders: true,
      timezone: '+08:00',
    })
  }

  async didReady() {
    this.app.logger.info('Owl Coffee 服务端已启动')
  }

  async beforeClose() {
    if (this.app.mysql) {
      await this.app.mysql.end()
    }
  }
}

module.exports = AppBootHook
