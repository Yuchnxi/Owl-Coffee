'use strict'

const Service = require('egg').Service

class AppAuthService extends Service {
  // 小程序演示登录，真实微信 openid 换取待补充
  async login(code) {
    const openid = `mock_${code}`
    let user = await this.findUserByOpenid(openid)

    if (!user) {
      user = await this.createUser(openid)
    }

    const accessToken = this.service.authToken.createAppAccessToken(user)
    const refreshToken = this.service.authToken.createRefreshToken()

    await this.saveRefreshToken(user.id, refreshToken)

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200,
      user: this.formatLoginUser(user),
    }
  }

  // 查询当前小程序用户
  async findUserById(userId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          openid,
          phone,
          phone_bound AS phoneBound,
          user_status AS userStatus,
          nickname,
          avatar_url AS avatarUrl,
          gender
        FROM users
        WHERE id = :userId
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { userId }
    )

    return rows[0] || null
  }

  // 根据 openid 查询小程序用户
  async findUserByOpenid(openid) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          openid,
          phone,
          phone_bound AS phoneBound,
          user_status AS userStatus,
          nickname,
          avatar_url AS avatarUrl,
          gender
        FROM users
        WHERE openid = :openid
          AND deleted_at IS NULL
        LIMIT 1
      `,
      { openid }
    )

    return rows[0] || null
  }

  // 创建演示小程序用户
  async createUser(openid) {
    const id = this.service.authToken.createId('user')

    await this.app.mysql.execute(
      `
        INSERT INTO users (
          id,
          openid,
          unionid,
          nickname,
          avatar_url,
          gender,
          phone,
          phone_bound,
          user_status,
          order_count,
          total_consume_amount,
          last_order_at,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by
        )
        VALUES (
          :id,
          :openid,
          NULL,
          NULL,
          NULL,
          'secret',
          NULL,
          0,
          'normal',
          0,
          0.00,
          NULL,
          NOW(3),
          NOW(3),
          NULL,
          NULL,
          NULL
        )
      `,
      { id, openid }
    )

    return this.findUserById(id)
  }

  // 绑定微信授权手机号
  async bindPhone(userId, phoneCode) {
    const phone = await this.fetchWechatPhoneNumber(phoneCode)

    await this.app.mysql.execute(
      `
        UPDATE users
        SET
          phone = :phone,
          phone_bound = 1,
          updated_at = NOW(3),
          updated_by = :userId
        WHERE id = :userId
          AND deleted_at IS NULL
      `,
      { userId, phone }
    )

    return this.findUserById(userId)
  }

  // 通过微信手机号授权 code 换取真实手机号
  async fetchWechatPhoneNumber(phoneCode) {
    const accessToken = await this.getWechatAccessToken()
    const response = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: phoneCode }),
      }
    )
    const data = await response.json()

    if (data.errcode) {
      this.throwHttpError(400, `微信手机号授权失败：${data.errmsg || data.errcode}`)
    }

    const phoneInfo = data.phone_info || {}
    const phone = phoneInfo.purePhoneNumber || phoneInfo.phoneNumber

    if (!phone) {
      this.throwHttpError(400, '微信手机号授权未返回手机号')
    }

    return phone
  }

  // 获取并缓存微信接口调用凭证
  async getWechatAccessToken() {
    const { appId, appSecret } = this.config.wechatMiniapp

    if (!appId || !appSecret || appId === '待补充' || appSecret === '待补充') {
      this.throwHttpError(400, '请先配置微信小程序 appId 和 appSecret')
    }

    const cache = this.app.wechatMiniappAccessToken

    if (cache && cache.expiresAt > Date.now() + 60 * 1000) {
      return cache.accessToken
    }

    const url = 'https://api.weixin.qq.com/cgi-bin/token'
      + `?grant_type=client_credential&appid=${encodeURIComponent(appId)}`
      + `&secret=${encodeURIComponent(appSecret)}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.errcode) {
      this.throwHttpError(400, `微信 access_token 获取失败：${data.errmsg || data.errcode}`)
    }

    if (!data.access_token) {
      this.throwHttpError(400, '微信 access_token 获取失败')
    }

    this.app.wechatMiniappAccessToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (Number(data.expires_in) || 7200) * 1000,
    }

    return data.access_token
  }

  // 更新小程序用户资料
  async updateProfile(userId, data = {}) {
    await this.app.mysql.execute(
      `
        UPDATE users
        SET
          nickname = :nickname,
          avatar_url = :avatarUrl,
          gender = COALESCE(NULLIF(:gender, ''), gender),
          updated_at = NOW(3),
          updated_by = :userId
        WHERE id = :userId
          AND deleted_at IS NULL
      `,
      {
        userId,
        nickname: data.nickname || null,
        avatarUrl: data.avatarUrl || null,
        gender: data.gender || '',
      }
    )

    return this.findUserById(userId)
  }

  // 废弃当前小程序用户所有 refreshToken
  async logout(userId) {
    await this.app.mysql.execute(
      `
        UPDATE auth_refresh_tokens
        SET revoked_at = NOW(3)
        WHERE subject_id = :userId
          AND subject_type = 'app_user'
          AND revoked_at IS NULL
      `,
      { userId }
    )
  }

  // 抛出带 HTTP 状态码的业务错误
  throwHttpError(status, message) {
    const error = new Error(message)

    error.status = status
    throw error
  }

  // 保存小程序 refreshToken 哈希
  async saveRefreshToken(userId, refreshToken) {
    const id = this.service.authToken.createId('token')
    const refreshTokenHash = this.service.authToken.hashRefreshToken(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.app.mysql.execute(
      `
        INSERT INTO auth_refresh_tokens (
          id,
          subject_id,
          subject_type,
          refresh_token_hash,
          expires_at,
          revoked_at,
          created_at
        )
        VALUES (
          :id,
          :subjectId,
          'app_user',
          :refreshTokenHash,
          :expiresAt,
          NULL,
          NOW(3)
        )
      `,
      {
        id,
        subjectId: userId,
        refreshTokenHash,
        expiresAt,
      }
    )
  }

  // 根据小程序 refreshToken 重新签发 token
  async refresh(refreshToken) {
    const refreshTokenHash = this.service.authToken.hashRefreshToken(refreshToken)
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, subject_id AS subjectId
        FROM auth_refresh_tokens
        WHERE refresh_token_hash = :refreshTokenHash
          AND subject_type = 'app_user'
          AND revoked_at IS NULL
          AND expires_at > NOW(3)
        LIMIT 1
      `,
      { refreshTokenHash }
    )

    const tokenRecord = rows[0]

    if (!tokenRecord) {
      return null
    }

    const user = await this.findUserById(tokenRecord.subjectId)

    if (!user || user.userStatus !== 'normal') {
      return null
    }

    await this.app.mysql.execute(
      'UPDATE auth_refresh_tokens SET revoked_at = NOW(3) WHERE id = :id',
      { id: tokenRecord.id }
    )

    const accessToken = this.service.authToken.createAppAccessToken(user)
    const nextRefreshToken = this.service.authToken.createRefreshToken()

    await this.saveRefreshToken(user.id, nextRefreshToken)

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: 7200,
    }
  }

  // 格式化登录用户响应
  formatLoginUser(user) {
    return {
      id: user.id,
      openidBound: Boolean(user.openid),
      phoneBound: Boolean(user.phoneBound),
    }
  }

  // 格式化当前用户响应
  formatCurrentUser(user) {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender || 'secret',
      phone: user.phone,
      phoneBound: Boolean(user.phoneBound),
      userStatus: user.userStatus,
    }
  }
}

module.exports = AppAuthService
