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
          avatar_url AS avatarUrl
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
          avatar_url AS avatarUrl
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

  // 绑定演示手机号
  async bindPhone(userId, phoneCode) {
    const phone = phoneCode === '待补充' ? '待补充' : phoneCode

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
      phone: user.phone,
      phoneBound: Boolean(user.phoneBound),
      userStatus: user.userStatus,
    }
  }
}

module.exports = AppAuthService
