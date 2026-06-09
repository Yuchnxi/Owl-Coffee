'use strict'

const bcrypt = require('bcryptjs')
const Service = require('egg').Service

class AdminSettingService extends Service {
  // 查询门店设置
  async getStoreSetting() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          id,
          store_name AS storeName,
          address,
          business_hours AS businessHours,
          phone,
          pickup_notice AS pickupNotice,
          map_info AS mapInfo,
          miniapp_qrcode_url AS miniappQrcodeUrl,
          updated_at AS updatedAt
        FROM store_settings
        ORDER BY created_at ASC
        LIMIT 1
      `
    )

    return this.formatStoreSetting(rows[0] || null)
  }

  // 更新门店设置
  async updateStoreSetting(data, adminUserId) {
    const current = await this.getStoreSetting()

    if (!current.id) {
      const id = 'store_default'
      await this.app.mysql.execute(
        `
          INSERT INTO store_settings (
            id,
            store_name,
            address,
            business_hours,
            phone,
            pickup_notice,
            map_info,
            miniapp_qrcode_url,
            created_at,
            updated_at,
            updated_by
          )
          VALUES (
            :id,
            :storeName,
            :address,
            :businessHours,
            :phone,
            :pickupNotice,
            :mapInfo,
            :miniappQrcodeUrl,
            NOW(3),
            NOW(3),
            :adminUserId
          )
        `,
        {
          id,
          ...this.toStoreParams(data),
          adminUserId,
        }
      )

      return this.getStoreSetting()
    }

    await this.app.mysql.execute(
      `
        UPDATE store_settings
        SET
          store_name = :storeName,
          address = :address,
          business_hours = :businessHours,
          phone = :phone,
          pickup_notice = :pickupNotice,
          map_info = :mapInfo,
          miniapp_qrcode_url = :miniappQrcodeUrl,
          updated_at = NOW(3),
          updated_by = :adminUserId
        WHERE id = :id
      `,
      {
        id: current.id,
        ...this.toStoreParams(data),
        adminUserId,
      }
    )

    return this.getStoreSetting()
  }

  // 查询管理员账号设置
  async getAccountSetting(adminUserId) {
    const adminUser = await this.service.adminAuth.findAdminById(adminUserId)

    if (!adminUser) {
      return null
    }

    return this.formatAccountSetting(adminUser)
  }

  // 更新管理员账号设置
  async updateAccountSetting(adminUserId, data) {
    const params = {
      adminUserId,
      adminName: data.adminName,
      phone: data.phone || null,
    }
    let passwordSql = ''

    if (data.newPassword) {
      params.passwordHash = await bcrypt.hash(data.newPassword, 10)
      passwordSql = ', password_hash = :passwordHash'
    }

    await this.app.mysql.execute(
      `
        UPDATE admin_users
        SET
          name = :adminName,
          phone = :phone,
          updated_at = NOW(3),
          updated_by = :adminUserId
          ${passwordSql}
        WHERE id = :adminUserId
          AND deleted_at IS NULL
      `,
      params
    )

    return this.getAccountSetting(adminUserId)
  }

  // 转换门店设置参数
  toStoreParams(data) {
    return {
      storeName: data.storeName,
      address: data.address,
      businessHours: data.businessHours,
      phone: data.phone,
      pickupNotice: data.pickupNotice || null,
      mapInfo: JSON.stringify(data.mapInfo || { status: '待补充' }),
      miniappQrcodeUrl: data.miniappQrcodeUrl || null,
    }
  }

  // 格式化门店设置
  formatStoreSetting(row) {
    if (!row) {
      return {
        id: null,
        storeName: '待补充',
        address: '待补充',
        businessHours: '待补充',
        phone: '待补充',
        pickupNotice: '待补充',
        mapInfo: { status: '待补充' },
        miniappQrcodeUrl: null,
        updatedAt: null,
      }
    }

    return {
      id: row.id,
      storeName: row.storeName,
      address: row.address,
      businessHours: row.businessHours,
      phone: row.phone,
      pickupNotice: row.pickupNotice,
      mapInfo: this.parseJson(row.mapInfo) || { status: '待补充' },
      miniappQrcodeUrl: row.miniappQrcodeUrl,
      updatedAt: this.formatTime(row.updatedAt),
    }
  }

  // 格式化管理员账号设置
  formatAccountSetting(adminUser) {
    return {
      id: adminUser.id,
      adminName: adminUser.name,
      phone: adminUser.phone || null,
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

  // 格式化时间字段
  formatTime(value) {
    if (!value) {
      return null
    }

    return new Date(value).toISOString()
  }
}

module.exports = AdminSettingService
