'use strict'

const bcrypt = require('bcryptjs')
const Service = require('egg').Service

class AdminAuthService extends Service {
  // 根据账号查询后台用户
  async findAdminByAccount(account) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          au.id,
          au.account,
          au.password_hash AS passwordHash,
          au.name,
          au.role_id AS roleId,
          au.status,
          r.name AS roleName
        FROM admin_users au
        LEFT JOIN roles r ON r.id = au.role_id AND r.deleted_at IS NULL
        WHERE au.account = :account
          AND au.deleted_at IS NULL
        LIMIT 1
      `,
      { account }
    )

    return rows[0] || null
  }

  // 校验后台账号密码
  async verifyPassword(adminUser, password) {
    if (!adminUser || adminUser.passwordHash === '待部署初始化') {
      return false
    }

    return bcrypt.compare(password, adminUser.passwordHash)
  }

  // 保存 refreshToken 哈希
  async saveRefreshToken(adminUserId, refreshToken) {
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
          'admin',
          :refreshTokenHash,
          :expiresAt,
          NULL,
          NOW(3)
        )
      `,
      {
        id,
        subjectId: adminUserId,
        refreshTokenHash,
        expiresAt,
      }
    )
  }

  // 后台登录并返回 token
  async login(account, password) {
    const adminUser = await this.findAdminByAccount(account)

    if (!adminUser || adminUser.status !== 'enabled') {
      return null
    }

    const passwordValid = await this.verifyPassword(adminUser, password)

    if (!passwordValid) {
      return null
    }

    const accessToken = this.service.authToken.createAdminAccessToken(adminUser)
    const refreshToken = this.service.authToken.createRefreshToken()

    await this.saveRefreshToken(adminUser.id, refreshToken)

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET last_login_at = NOW(3), updated_at = NOW(3)
        WHERE id = :id
      `,
      { id: adminUser.id }
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200,
      user: this.formatAdminUser(adminUser),
    }
  }

  // 根据后台用户 ID 查询当前用户
  async findAdminById(adminUserId) {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          au.id,
          au.account,
          au.name,
          au.role_id AS roleId,
          au.status,
          r.name AS roleName
        FROM admin_users au
        LEFT JOIN roles r ON r.id = au.role_id AND r.deleted_at IS NULL
        WHERE au.id = :adminUserId
          AND au.deleted_at IS NULL
        LIMIT 1
      `,
      { adminUserId }
    )

    return rows[0] || null
  }

  // 查询后台用户菜单权限
  async listMenus(roleId) {
    const menus = await this.service.role.listRoleMenus(roleId)

    return this.service.role.buildMenuTree(menus).map(menu => this.formatMenu(menu))
  }

  // 格式化后台菜单响应
  formatMenu(menu) {
    return {
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      path: menu.path,
      icon: menu.icon,
      sort: menu.sort,
      meta: menu.meta,
      children: Array.isArray(menu.children) ? menu.children.map(child => this.formatMenu(child)) : [],
    }
  }

  // 根据 refreshToken 重新签发 token
  async refresh(refreshToken) {
    const refreshTokenHash = this.service.authToken.hashRefreshToken(refreshToken)
    const [rows] = await this.app.mysql.execute(
      `
        SELECT id, subject_id AS subjectId
        FROM auth_refresh_tokens
        WHERE refresh_token_hash = :refreshTokenHash
          AND subject_type = 'admin'
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

    const adminUser = await this.findAdminById(tokenRecord.subjectId)

    if (!adminUser || adminUser.status !== 'enabled') {
      return null
    }

    await this.app.mysql.execute(
      'UPDATE auth_refresh_tokens SET revoked_at = NOW(3) WHERE id = :id',
      { id: tokenRecord.id }
    )

    const accessToken = this.service.authToken.createAdminAccessToken(adminUser)
    const nextRefreshToken = this.service.authToken.createRefreshToken()

    await this.saveRefreshToken(adminUser.id, nextRefreshToken)

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: 7200,
    }
  }

  // 格式化后台用户响应
  formatAdminUser(adminUser) {
    return {
      id: adminUser.id,
      name: adminUser.name,
      roleId: adminUser.roleId,
      roleName: adminUser.roleName,
    }
  }

  // 解析 JSON 字段
  parseJson(value) {
    if (!value) {
      return null
    }

    if (typeof value === 'object') {
      return value
    }

    try {
      return JSON.parse(value)
    } catch (err) {
      return null
    }
  }
}

module.exports = AdminAuthService
