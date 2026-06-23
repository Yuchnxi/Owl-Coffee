const { bindPhone, logout, updateProfile } = require('../../api/auth')
const { uploadFile } = require('../../api/upload')

const GENDER_OPTIONS = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '保密', value: 'secret' },
]

Page({
  data: {
    // 当前用户资料
    user: {},
    // 顶部安全区高度
    statusBarHeight: 0,
    // 页面加载状态
    loading: false,
    // 头像上传状态
    uploading: false,
    // 展示用昵称
    displayNickname: '待补充',
    // 展示用手机号
    displayPhone: '待补充',
    // 展示用性别
    displayGender: '保密',
    // 性别选择器是否显示
    genderPickerVisible: false,
    // 性别选择器默认索引
    genderPickerIndex: 2,
    // 性别选择项
    genderColumns: GENDER_OPTIONS.map(item => item.text),
  },

  // 页面加载时初始化安全区
  onLoad() {
    const systemInfo = wx.getSystemInfoSync()

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0,
    })
  },

  // 页面显示时刷新用户资料
  async onShow() {
    this.setData({ loading: true })

    try {
      const user = await getApp().ensureLogin()
      this.setUser(user || {})
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 保存并格式化用户资料
  setUser(user) {
    this.setData({
      user,
      displayNickname: user.nickname || '待补充',
      displayPhone: user.phoneBound ? this.maskPhone(user.phone) : '待补充',
      displayGender: this.getGenderLabel(user.gender),
      genderPickerIndex: this.getGenderIndex(user.gender),
    })
  },

  // 返回上一页
  handleBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }

    wx.switchTab({
      url: '/pages/mine/index',
    })
  },

  // 上传头像并更新用户资料
  async handleAvatarRead(event) {
    const file = (event.detail || {}).file || {}
    const filePath = file.url || file.path

    if (!filePath) {
      wx.showToast({
        title: '头像文件无效',
        icon: 'none',
      })
      return
    }

    this.setData({ uploading: true })

    try {
      const uploadResult = await uploadFile(filePath, 'avatar')
      const nextUser = await updateProfile({
        nickname: this.data.user.nickname || '',
        avatarUrl: uploadResult.url,
        gender: this.data.user.gender || 'secret',
      })

      getApp().globalData.currentUser = nextUser
      this.setUser(nextUser)
      wx.showToast({
        title: '头像已更新',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '头像上传失败',
        icon: 'none',
      })
    } finally {
      this.setData({ uploading: false })
    }
  },

  // 编辑用户昵称
  handleEditNickname() {
    wx.showModal({
      title: '用户名称',
      editable: true,
      placeholderText: '请输入用户名称',
      content: this.data.user.nickname || '',
      success: async result => {
        if (!result.confirm) return

        await this.submitNickname(result.content || '')
      },
    })
  },

  // 提交用户昵称
  async submitNickname(nickname) {
    const nextNickname = String(nickname || '').trim()

    if (nextNickname.length > 64) {
      wx.showToast({
        title: '用户名称不能超过 64 个字符',
        icon: 'none',
      })
      return
    }

    this.setData({ loading: true })

    try {
      const nextUser = await updateProfile({
        nickname: nextNickname,
        avatarUrl: this.data.user.avatarUrl || '',
        gender: this.data.user.gender || 'secret',
      })

      getApp().globalData.currentUser = nextUser
      this.setUser(nextUser)
      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 打开性别选择器
  handleOpenGenderPicker() {
    this.setData({
      genderPickerVisible: true,
      genderPickerIndex: this.getGenderIndex(this.data.user.gender),
    })
  },

  // 关闭性别选择器
  handleCloseGenderPicker() {
    this.setData({ genderPickerVisible: false })
  },

  // 确认选择性别
  async handleConfirmGender(event) {
    const index = Number((event.detail || {}).index)
    const option = GENDER_OPTIONS[index] || GENDER_OPTIONS[2]

    this.setData({
      loading: true,
      genderPickerVisible: false,
    })

    try {
      const nextUser = await updateProfile({
        nickname: this.data.user.nickname || '',
        avatarUrl: this.data.user.avatarUrl || '',
        gender: option.value,
      })

      getApp().globalData.currentUser = nextUser
      this.setUser(nextUser)
      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 处理微信手机号授权
  async handlePhoneAuthorization(event) {
    const detail = event.detail || {}
    const phoneCode = detail.code

    if (!phoneCode || detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '已取消手机号授权',
        icon: 'none',
      })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await bindPhone(phoneCode)
      const user = {
        ...(this.data.user || {}),
        ...result,
      }

      getApp().globalData.currentUser = user
      this.setUser(user)
      wx.showToast({
        title: '授权成功',
        icon: 'success',
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '授权失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 退出当前登录态
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      success: async result => {
        if (!result.confirm) return

        try {
          await logout()
        } catch (err) {
          // 本地退出优先，服务端 token 失效不阻断用户操作
        }

        getApp().clearLoginState()
        wx.switchTab({
          url: '/pages/mine/index',
        })
      },
    })
  },

  // 手机号脱敏展示
  maskPhone(phone) {
    const value = String(phone || '')

    if (value.length < 7 || value === '待补充') {
      return '待补充'
    }

    return `${value.slice(0, 3)}****${value.slice(-4)}`
  },

  // 获取性别展示文案
  getGenderLabel(gender) {
    const option = GENDER_OPTIONS.find(item => item.value === gender)

    return option ? option.text : '保密'
  },

  // 获取性别选择索引
  getGenderIndex(gender) {
    const index = GENDER_OPTIONS.findIndex(item => item.value === gender)

    return index >= 0 ? index : 2
  },
})
