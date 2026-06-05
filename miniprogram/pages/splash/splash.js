const api = require('../../utils/api')

Page({
  data: {},

  onLoad() {
    // 检查本地是否已有 token，有则直接进入大厅
    if (api.getToken()) {
      wx.redirectTo({ url: '/pages/lobby/lobby' })
    }
  },

  // 微信登录：wx.login → 后端 /api/login → 存 token → 进大厅
  handleWechatLogin() {
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        // 调用后端登录接口
        api.login(res.code).then((data) => {
          wx.hideLoading()
          // 保存 token 和用户信息
          api.setToken(data.token)
          api.setUserInfo(data.user)
          wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 })
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/lobby/lobby' })
          }, 1000)
        }).catch((err) => {
          wx.hideLoading()
          // 后端未启动或登录失败，降级到游客登录
          console.log('后端登录失败，走游客模式:', err.message)
          wx.showToast({ title: '后端未连接，走游客模式', icon: 'none', duration: 1500 })
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/guest-login/guest-login' })
          }, 1500)
        })
      },
      fail: () => {
        wx.hideLoading()
        // wx.login 失败也走游客模式
        wx.navigateTo({ url: '/pages/guest-login/guest-login' })
      }
    })
  },

  goGuestLogin() {
    wx.navigateTo({ url: '/pages/guest-login/guest-login' })
  }
})
