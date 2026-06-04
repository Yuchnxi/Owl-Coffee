'use strict'

const Service = require('egg').Service

class PublicContentService extends Service {
  // 查询门店公开信息
  async getStore() {
    const store = await this.findStoreSetting()

    return {
      storeName: store.storeName,
      address: store.address,
      businessHours: store.businessHours,
      phone: store.phone,
      pickupNotice: store.pickupNotice,
      mapInfo: this.parseJson(store.mapInfo) || { status: '待补充' },
    }
  }

  // 查询小程序二维码信息
  async getMiniappQrcode() {
    const store = await this.findStoreSetting()

    return {
      qrcodeUrl: store.miniappQrcodeUrl || '待补充',
      title: '小程序点单',
      description: '扫码进入 Owl Coffee 小程序，二维码待补充',
    }
  }

  // 查询默认门店配置
  async findStoreSetting() {
    const [rows] = await this.app.mysql.execute(
      `
        SELECT
          store_name AS storeName,
          address,
          business_hours AS businessHours,
          phone,
          pickup_notice AS pickupNotice,
          map_info AS mapInfo,
          miniapp_qrcode_url AS miniappQrcodeUrl
        FROM store_settings
        ORDER BY created_at ASC
        LIMIT 1
      `
    )

    return rows[0] || {
      storeName: '待补充',
      address: '待补充',
      businessHours: '待补充',
      phone: '待补充',
      pickupNotice: '待补充',
      mapInfo: { status: '待补充' },
      miniappQrcodeUrl: null,
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

module.exports = PublicContentService
