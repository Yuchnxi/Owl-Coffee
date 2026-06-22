const request = require('../utils/request')

// 查询小程序首页轮播图
function fetchHomeBanners() {
  return request({
    url: '/api/app/banners',
  })
}

module.exports = {
  fetchHomeBanners,
}
