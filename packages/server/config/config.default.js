'use strict'

const path = require('path')

module.exports = appInfo => {
  require('dotenv').config({
    path: path.join(appInfo.baseDir, '.env'),
  })

  const config = {}

  config.keys = process.env.APP_KEYS || 'owl-coffee-server-dev-key'

  config.middleware = ['errorHandler']

  config.security = {
    csrf: {
      enable: false,
    },
  }

  config.cluster = {
    listen: {
      port: Number(process.env.SERVER_PORT) || 7001,
      hostname: '0.0.0.0',
    },
  }

  config.jwt = {
    secret: process.env.JWT_SECRET || '待补充',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '2h',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  }

  config.database = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || '待补充',
    user: process.env.MYSQL_USER || '待补充',
    password: process.env.MYSQL_PASSWORD || '待补充',
  }

  return config
}
