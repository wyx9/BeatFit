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

    // 调用后端游客登录接口
    api.guestLogin(name).then((data) => {
      wx.hideLoading()
      api.setToken(data.token)
      api.setUserInfo(data.user)
      wx.showToast({ title: '欢迎 ' + name, icon: 'success', duration: 1000 })
      setTimeout(() => wx.redirectTo({ url: '/pages/lobby/lobby' }), 1000)
    }).catch((err) => {
      wx.hideLoading()
      // 后端未连接时降级到本地模式
      console.log('游客登录服务端未响应:', err.message)
      const userInfo = { nickname: name, is_guest: true, level: 1, title: '初来乍到', total_min: 0, total_kcal: 0, total_count: 0 }
      api.setUserInfo(userInfo)
      wx.showToast({ title: '离线模式', icon: 'none', duration: 1000 })
      setTimeout(() => wx.redirectTo({ url: '/pages/lobby/lobby' }), 1000)
    })
  }
})
