App({
  globalData: {
    // baseUrl: 'https://你的服务器地址.com',
    baseUrl: 'http://localhost:8080',
    wsBaseUrl: 'ws://localhost:8080',
    userId: '',
    nickname: '',
    token: ''
  },

  onLaunch() {
    const user = wx.getStorageSync('user')
    if (user) {
      this.globalData.userId = user.userId
      this.globalData.nickname = user.nickname
      this.globalData.token = user.token
    }
  },

  login(nickname, cb) {
    const that = this
    wx.request({
      url: this.globalData.baseUrl + '/api/login',
      method: 'POST',
      data: { code: 'dev', nickname: nickname },
      success(res) {
        if (res.statusCode === 200) {
          that.globalData.userId = res.data.user_id
          that.globalData.nickname = res.data.nickname
          that.globalData.token = res.data.token
          wx.setStorageSync('user', {
            userId: res.data.user_id,
            nickname: res.data.nickname,
            token: res.data.token
          })
          cb && cb(null, res.data)
        } else {
          cb && cb(res.data)
        }
      },
      fail(err) {
        cb && cb(err)
      }
    })
  }
})
