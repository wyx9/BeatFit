const api = require('../../utils/api')
const features = require('../../config/features')

Page({
  data: {
    statusBarHeight: 0,
    userInfo: {},
    ENABLE_LEADERBOARD: features.ENABLE_LEADERBOARD,
    ENABLE_WORKOUT_RECORDS: features.ENABLE_WORKOUT_RECORDS,
    ENABLE_ACHIEVEMENTS: features.ENABLE_ACHIEVEMENTS
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 优先从服务器加载，失败则用本地缓存
  async loadUserInfo() {
    try {
      const data = await api.getProfile()
      if (data.user) {
        this.setData({ userInfo: data.user })
        api.setUserInfo(data.user)  // 同步到本地缓存
        return
      }
    } catch(e) {}
    // 服务器不可用时用本地缓存
    const user = api.getUserInfo()
    if (user) this.setData({ userInfo: user })
  },

  goLobby() {
    wx.redirectTo({ url: '/pages/lobby/lobby' })
  },

  goLeaderboard() {
    wx.redirectTo({ url: '/pages/leaderboard/leaderboard' })
  },

  goTemplates() {
    wx.redirectTo({ url: '/pages/exercise-templates/exercise-templates' })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用后端退出接口
          api.logout().catch(() => {})
          // 清除本地数据
          api.clearToken()
          wx.clearStorageSync()
          // 跳转到启动页
          wx.reLaunch({ url: '/pages/splash/splash' })
        }
      }
    })
  }
})
