const api = require('../../utils/api')

Page({
  data: {
    nickname: ''
  },

  onNickInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  goLobby() {
    const name = this.data.nickname.trim()
    if (!name) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    // 静默调用 wx.login 获取 code，换取持久化 openid
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          this._fallbackOffline(name)
          return
        }

        api.guestLogin(loginRes.code, name).then((data) => {
          wx.hideLoading()
          api.setToken(data.token)
          api.setUserInfo(data.user)
          wx.showToast({ title: '欢迎 ' + name, icon: 'success', duration: 1000 })
          setTimeout(() => wx.redirectTo({ url: '/pages/lobby/lobby' }), 1000)
        }).catch((err) => {
          wx.hideLoading()
          console.log('游客登录服务端未响应:', err.message)
          this._fallbackOffline(name)
        })
      },
      fail: () => {
        wx.hideLoading()
        this._fallbackOffline(name)
      }
    })
  },

  // 后端/微信不可用时降级到本地离线模式
  _fallbackOffline(name) {
    const userInfo = { nickname: name, is_guest: true, level: 1, title: '初来乍到', total_min: 0, total_kcal: 0, total_count: 0 }
    api.setUserInfo(userInfo)
    wx.showToast({ title: '离线模式', icon: 'none', duration: 1000 })
    setTimeout(() => wx.redirectTo({ url: '/pages/lobby/lobby' }), 1000)
  }
})
