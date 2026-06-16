'use strict'

const Controller = require('egg').Controller

class AdminSettingController extends Controller {
  // 查询门店设置
  async store() {
    const data = await this.ctx.service.adminSetting.getStoreSetting()

    this.ctx.success(data)
  }

  // 更新门店设置
  async updateStore() {
    const { ctx } = this
    const payload = this.normalizeStorePayload(ctx.request.body || {})
    const errorMessage = this.validateStorePayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const data = await ctx.service.adminSetting.updateStoreSetting(payload, ctx.state.admin.id)

    ctx.success(data)
  }

  // 查询管理员账号设置
  async account() {
    const { ctx } = this
    const data = await ctx.service.adminSetting.getAccountSetting(ctx.state.admin.id)

    if (!data) {
      ctx.status = 404
      ctx.fail(10002, '管理员不存在')
      return
    }

    ctx.success(data)
  }

  // 更新管理员账号设置
  async updateAccount() {
    const { ctx } = this
    const payload = this.normalizeAccountPayload(ctx.request.body || {})
    const errorMessage = this.validateAccountPayload(payload)

    if (errorMessage) {
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const data = await ctx.service.adminSetting.updateAccountSetting(ctx.state.admin.id, payload)

    ctx.success(data)
  }

  // 标准化门店设置请求体
  normalizeStorePayload(body) {
    return {
      storeName: typeof body.storeName === 'string' ? body.storeName.trim() : '',
      address: typeof body.address === 'string' ? body.address.trim() : '',
      businessHours: typeof body.businessHours === 'string' ? body.businessHours.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      pickupNotice: typeof body.pickupNotice === 'string' ? body.pickupNotice.trim() : '',
      mapInfo: body.mapInfo && typeof body.mapInfo === 'object' ? body.mapInfo : { status: '待补充' },
      miniappQrcodeUrl: typeof body.miniappQrcodeUrl === 'string' ? body.miniappQrcodeUrl.trim() : '',
    }
  }

  // 校验门店设置请求体
  validateStorePayload(payload) {
    if (!payload.storeName) {
      return '门店名称不能为空'
    }

    if (!payload.address) {
      return '门店地址不能为空'
    }

    if (!payload.businessHours) {
      return '营业时间不能为空'
    }

    if (!payload.phone) {
      return '联系电话不能为空'
    }

    if (payload.storeName.length > 128) {
      return '门店名称不能超过 128 个字符'
    }

    if (payload.address.length > 255) {
      return '门店地址不能超过 255 个字符'
    }

    if (payload.businessHours.length > 128) {
      return '营业时间不能超过 128 个字符'
    }

    if (payload.phone.length > 32) {
      return '联系电话不能超过 32 个字符'
    }

    if (payload.pickupNotice.length > 500) {
      return '取餐说明不能超过 500 个字符'
    }

    return ''
  }

  // 标准化管理员账号设置请求体
  normalizeAccountPayload(body) {
    return {
      adminName: typeof body.adminName === 'string' ? body.adminName.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '',
      newPassword: typeof body.newPassword === 'string' ? body.newPassword : '',
      confirmPassword: typeof body.confirmPassword === 'string' ? body.confirmPassword : '',
    }
  }

  // 校验管理员账号设置请求体
  validateAccountPayload(payload) {
    if (!payload.adminName) {
      return '管理员名称不能为空'
    }

    if (payload.adminName.length > 64) {
      return '管理员名称不能超过 64 个字符'
    }

    if (payload.phone.length > 32) {
      return '手机号不能超过 32 个字符'
    }

    if (payload.avatarUrl.length > 512) {
      return '头像地址不能超过 512 个字符'
    }

    if (payload.newPassword || payload.confirmPassword) {
      if (payload.newPassword.length < 6) {
        return '新密码不能少于 6 位'
      }

      if (payload.newPassword !== payload.confirmPassword) {
        return '两次输入的新密码不一致'
      }
    }

    return ''
  }
}

module.exports = AdminSettingController
