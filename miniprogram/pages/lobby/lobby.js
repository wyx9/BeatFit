const api = require('../../utils/api')

Page({
  data: {
    statusBarHeight: 0,
    code0: '', code1: '', code2: '', code3: '',
    focusIndex: 0,
    rooms: [],
    loading: true,
    userAvatar: '',
    lobbyWs: null
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadUserAvatar()
    this.loadRooms()
    this.connectLobbyWS()
  },

  onShow() {
    this.loadUserAvatar()
    this.loadRooms()
  },

  onUnload() {
    if (this.data.lobbyWs) { api.closeWS(this.data.lobbyWs) }
  },

  // 连接大厅 WebSocket，接收新房间通知
  connectLobbyWS() {
    const ws = api.connectWS('/ws/lobby', (msg) => {
      if (msg.type === 'room_created') {
        // 有新房间创建，刷新列表
        this.loadRooms()
      }
    })
    this.setData({ lobbyWs: ws })
  },

  loadUserAvatar() {
    const user = api.getUserInfo()
    if (user) {
      this.setData({
        userAvatar: user.avatar_url || '',
        userInitial: (user.nickname || '?')[0]
      })
    }
  },

  // 加载活跃房间列表
  async loadRooms() {
    this.setData({ loading: true })
    try {
      const data = await api.getRooms(1, 20)
      this.setData({ rooms: data.rooms || [] })
    } catch (err) {
      // 后端未连接或无 token，使用静态数据
      this.setData({
        rooms: [
          { id: 1, name: '铁血核心', invite_code: '1234', max_members: 20, member_count: 15, status: 1, owner_id: 0 },
          { id: 2, name: '禅意流', invite_code: '5678', max_members: 12, member_count: 8, status: 1, owner_id: 0 },
          { id: 3, name: '燃脂暴击', invite_code: '9012', max_members: 30, member_count: 27, status: 1, owner_id: 0 }
        ]
      })
    }
    this.setData({ loading: false })
  },

  // 4位房间号输入处理
  onCodeInput(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const value = e.detail.value
    const codeKey = 'code' + index

    const digit = value.slice(-1)
    this.setData({ [codeKey]: digit })

    if (digit && index < 3) {
      this.setData({ focusIndex: index + 1 })
    }

    if (index === 3 && digit) {
      this.autoJoin()
    }
  },

  // 自动拼接4位邀请码并加入 → 进入房间等待页
  autoJoin() {
    const code = this.data.code0 + this.data.code1 + this.data.code2 + this.data.code3
    if (code.length < 4) return

    wx.showLoading({ title: '加入中...' })
    api.joinRoom(code).then((data) => {
      wx.hideLoading()
      this.setData({ code0: '', code1: '', code2: '', code3: '', focusIndex: 0 })
      wx.showToast({ title: '加入成功', icon: 'success' })
      const app = getApp(); app.globalData = app.globalData || {}
      app.globalData.currentRoom = data.room
      setTimeout(() => wx.redirectTo({ url: '/pages/room-waiting/room-waiting' }), 800)
    }).catch((err) => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '加入失败', icon: 'none' })
      setTimeout(() => {
        this.setData({ code0: '', code1: '', code2: '', code3: '', focusIndex: 0 })
      }, 1000)
    })
  },

  // 加入房间（点击卡片按钮）→ 进入房间等待页
  joinThisRoom(e) {
    const code = e.currentTarget.dataset.code
    wx.showLoading({ title: '加入中...' })
    api.joinRoom(code).then((data) => {
      wx.hideLoading()
      const app = getApp(); app.globalData = app.globalData || {}
      app.globalData.currentRoom = data.room
      wx.redirectTo({ url: '/pages/room-waiting/room-waiting' })
    }).catch((err) => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '加入失败', icon: 'none' })
    })
  },

  focusCodeInput() {
    this.setData({ code0: '', code1: '', code2: '', code3: '', focusIndex: 0 })
  },

  goCreateRoom() {
    wx.navigateTo({ url: '/pages/create-room/create-room' })
  },

  goLeaderboard() {
    wx.redirectTo({ url: '/pages/leaderboard/leaderboard' })
  },

  goProfile() {
    wx.redirectTo({ url: '/pages/profile/profile' })
  }
})
