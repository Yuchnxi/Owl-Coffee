'use strict'

module.exports = {
  success(data = {}) {
    this.body = {
      code: 0,
      message: 'success',
      data,
    }
  },

  fail(code = 10000, message = 'fail', data = {}) {
    this.body = {
      code,
      message,
      data,
    }
  },
}
