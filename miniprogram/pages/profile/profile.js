const api = require('../../utils/api')

Page({
  data: {
    statusBarHeight: 0,
    userInfo: {}
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 从本地缓存加载用户信息
  loadUserInfo() {
    const user = api.getUserInfo()
    if (user) {
      this.setData({ userInfo: user })
    }
  },

  goLobby() {
    wx.redirectTo({ url: '/pages/lobby/lobby' })
  },

  goLeaderboard() {
    wx.redirectTo({ url: '/pages/leaderboard/leaderboard' })
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
