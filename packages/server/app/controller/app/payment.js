'use strict'

const Controller = require('egg').Controller

const MOCK_PAYMENT_RESULT_LIST = ['success', 'fail']

class AppPaymentController extends Controller {
  // 小程序模拟支付
  async mock() {
    const { ctx } = this
    const { orderId, result } = ctx.request.body || {}

    if (!orderId) {
      ctx.status = 400
      ctx.fail(10001, '订单 ID 不能为空')
      return
    }

    if (!MOCK_PAYMENT_RESULT_LIST.includes(result)) {
      ctx.status = 400
      ctx.fail(10001, '模拟支付结果不正确')
      return
    }

    const payResult = await ctx.service.order.mockPay(orderId, ctx.state.appUser.id, result)

    if (payResult.errorCode) {
      ctx.status = payResult.errorCode === 10002 ? 404 : 409
      ctx.fail(payResult.errorCode, payResult.message, payResult.data)
      return
    }

    ctx.success(payResult)
  }
}

module.exports = AppPaymentController
