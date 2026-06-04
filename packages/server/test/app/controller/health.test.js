'use strict'

const { app, assert } = require('egg-mock/bootstrap')

describe('test/app/controller/health.test.js', () => {
  it('GET /api/health', async () => {
    const res = await app.httpRequest()
      .get('/api/health')
      .expect(200)

    assert(res.body.code === 0)
    assert(res.body.data.status === 'ok')
  })

  it('GET unknown api', async () => {
    const res = await app.httpRequest()
      .get('/api/unknown')
      .expect(404)

    assert(res.body.code === 404)
    assert(res.body.message === '接口不存在')
  })
})
