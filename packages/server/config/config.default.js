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

  config.multipart = {
    mode: 'stream',
    fileSize: '5mb',
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
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  }

  config.cos = {
    secretId: process.env.TENCENT_COS_SECRET_ID || '',
    secretKey: process.env.TENCENT_COS_SECRET_KEY || '',
    bucket: process.env.TENCENT_COS_BUCKET || '',
    region: process.env.TENCENT_COS_REGION || '',
    publicBaseUrl: process.env.TENCENT_COS_PUBLIC_BASE_URL || '',
  }

  config.wechatMiniapp = {
    appId: process.env.WECHAT_MINIAPP_APP_ID || '',
    appSecret: process.env.WECHAT_MINIAPP_APP_SECRET || '',
    mockLogin: process.env.WECHAT_MINIAPP_MOCK_LOGIN === 'true',
  }

  return config
}
