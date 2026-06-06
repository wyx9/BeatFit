const api = require('./utils/api')

// 包装 Page()，每个页面的 onShow 自动隐藏 loading 遮罩
const _Page = Page
Page = function(config) {
  const origOnShow = config.onShow
  config.onShow = function() {
    wx.hideLoading()
    if (origOnShow) origOnShow.apply(this, arguments)
  }
  return _Page(config)
}

App({
  globalData: {},

  onLaunch() {},

  onShow() {
    this.reconnectIfNeeded()
  },

  async reconnectIfNeeded() {
    const token = api.getToken()
    if (!token) return
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
    } catch(e) {}
  }
})
