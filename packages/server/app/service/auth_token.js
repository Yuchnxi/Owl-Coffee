'use strict'

const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const Service = require('egg').Service

class AuthTokenService extends Service {
  // 生成后台 accessToken
  createAdminAccessToken(adminUser) {
    const { jwt: jwtConfig } = this.config

    return jwt.sign(
      {
        subjectType: 'admin',
        roleId: adminUser.roleId,
      },
      jwtConfig.secret,
      {
        subject: adminUser.id,
        expiresIn: jwtConfig.accessTokenExpiresIn,
      }
    )
  }

  // 生成小程序 accessToken
  createAppAccessToken(user) {
    const { jwt: jwtConfig } = this.config

    return jwt.sign(
      {
        subjectType: 'app_user',
      },
      jwtConfig.secret,
      {
        subject: user.id,
        expiresIn: jwtConfig.accessTokenExpiresIn,
      }
    )
  }

  // 校验 accessToken 并返回载荷
  verifyAccessToken(token) {
    return jwt.verify(token, this.config.jwt.secret)
  }

  // 生成 refreshToken 明文
  createRefreshToken() {
    return crypto.randomBytes(48).toString('hex')
  }

  // 计算 refreshToken 哈希
  hashRefreshToken(refreshToken) {
    return crypto.createHash('sha256').update(refreshToken).digest('hex')
  }

  // 生成服务端资源 ID
  createId(prefix) {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
  }
}

module.exports = AuthTokenService
