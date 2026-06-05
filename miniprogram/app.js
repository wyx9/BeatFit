const api = require('./utils/api')

App({
  globalData: {},

  onLaunch() {},

  onShow() {
    // 用户重新进入小程序时，检查是否有活跃房间需要重连
    this.reconnectIfNeeded()
  },

  async reconnectIfNeeded() {
    const token = api.getToken()
    if (!token) return // 未登录，不检查

    // 跳过启动页（启动页不需要重连）
    const pages = getCurrentPages()
    if (pages.length > 0 && pages[0].route === 'pages/splash/splash') return

    try {
      const data = await api.getActiveRoom()
      if (data.room) {
        const room = data.room
        const url = room.status === 2
          ? '/pages/training/training?roomId=' + room.id
          : '/pages/room-waiting/room-waiting?roomId=' + room.id
        wx.reLaunch({ url: url })
      }
    } catch(e) {
      // 查询失败，忽略
    }
  }
})
