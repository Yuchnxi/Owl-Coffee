'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/controller/admin_auth.test.js', () => {
  it('GET /api/admin/auth/captcha', async () => {
    const res = await app.httpRequest()
      .get('/api/admin/auth/captcha')
      .expect(200)

    assert(res.body.code === 0)
    assert(res.body.data.captchaId === 'captcha_dev')
  })

  it('GET /api/admin/auth/me without token', async () => {
    const res = await app.httpRequest()
      .get('/api/admin/auth/me')
      .expect(401)

    assert(res.body.code === 20001)
    assert(res.body.message === '未登录')
  })

  it('POST /api/app/auth/refresh without refreshToken', async () => {
    const res = await app.httpRequest()
      .post('/api/app/auth/refresh')
      .send({})
      .expect(400)

    assert(res.body.code === 10001)
    assert(res.body.message === 'refreshToken 不能为空')
  })
})
