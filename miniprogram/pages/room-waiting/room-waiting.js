const api = require('../../utils/api')

Page({
  data: {
    statusBarHeight: 0,
    room: {},
    codeDigits: [],
    groupedExercises: [],
    members: [],
    ownerName: '',
    statusLabel: '',
    isOwner: false,
    roomWs: null
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })

    const app = getApp()
    let room = (app.globalData && app.globalData.currentRoom) || {}

    // 支持从 URL 参数重连（app.js reLaunch 时传 roomId）
    if (!room.id && options.roomId) {
      room = { id: parseInt(options.roomId) }
    }

    // 如果只有 roomId 没有邀请码，需要从服务器加载
    if (room.id && !room.invite_code) {
      // 房间信息通过成员列表 API 间接获取，或从 globalData 已有
    }
    let exercises = (app.globalData && app.globalData.roomExercises) || []
    if (exercises.length === 0 && room.exercises) {
      try { exercises = JSON.parse(room.exercises) } catch(e) { exercises = [] }
    }

    const user = api.getUserInfo()
    const ownerName = (user && user.nickname) || '我'
    const myUserId = (user && user.id) || 0
    const isOwner = room.owner_id === myUserId

    // 分组
    const groups = {}
    exercises.forEach(ex => {
      const cat = ex.category || '其他'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ex)
    })
    const grouped = Object.keys(groups).map(cat => ({
      category: cat, exercises: groups[cat]
    }))

    const code = room.invite_code || '----'
    this.setData({
      room, codeDigits: code.split(''), ownerName, isOwner,
      groupedExercises: grouped.length > 0 ? grouped : [
        { category: '背部', exercises: [{ name: '高位下拉', tag: '力量', sets: 4, reps: 12, duration_sec: 30, rest_sec: 60 }] }
      ],
      statusLabel: this.getStatusLabel(room.status)
    })

    // 加载成员列表
    if (room.id) { this.loadMembers(room.id) }

    // 连接房间 WebSocket
    if (code !== '----') { this.connectRoomWS(code) }
  },

  onUnload() {
    if (this.data.roomWs) { api.closeWS(this.data.roomWs) }
  },

  // 状态文字
  getStatusLabel(status) {
    if (status === 2) return '进行中'
    if (status === 0) return '已结束'
    return '等待中'
  },

  // 加载成员
  async loadMembers(roomId) {
    try {
      const data = await api.getRoomMembers(roomId)
      this.setData({ members: data.members || [] })
    } catch (err) {
      // 降级：只显示房主
      const user = api.getUserInfo()
      this.setData({ members: [{ user_id: user.id, nickname: user.nickname, avatar_url: user.avatar_url, level: 1 }] })
    }
  },

  connectRoomWS(code) {
    const that = this
    const ws = api.connectWS('/ws/room/' + code, function(msg) {
      if (msg.type === 'member_joined') {
        // 有新成员加入，刷新成员列表
        that.loadMembers(that.data.room.id)
      }
      if (msg.type === 'training_started') {
        // 房主开始了训练，带训练数据跳转
        wx.showToast({ title: '训练已开始！', icon: 'success' })
        const app = getApp()
        app.globalData = app.globalData || {}
        if (msg.data) {
          app.globalData.roomExercises = msg.data.exercises
          app.globalData.startedAt = msg.data.started_at
        }
        setTimeout(() => wx.redirectTo({ url: '/pages/training/training' }), 500)
      }
    })
    this.setData({ roomWs: ws })
  },

  handleDissolve() {
    wx.showModal({
      title: '解散房间', content: '解散后所有成员将无法进入，确定吗？',
      success: (res) => {
        if (res.confirm) {
          const roomId = this.data.room.id
          if (roomId) { api.dissolveRoom(roomId).catch(() => {}) }
          wx.showToast({ title: '房间已解散', icon: 'success' })
          setTimeout(() => wx.redirectTo({ url: '/pages/lobby/lobby' }), 1000)
        }
      }
    })
  },

  handleStart() {
    const roomId = this.data.room.id
    wx.showLoading({ title: '开始中...' })
    api.startRoom(roomId).then(() => {
      wx.hideLoading()
      wx.redirectTo({ url: '/pages/training/training' })
    }).catch(() => {
      wx.hideLoading()
      wx.redirectTo({ url: '/pages/training/training' })
    })
  },

  goBack() {
    wx.showModal({
      title: '返回大厅', content: '返回后房间仍然保留，确定吗？',
      success: (res) => {
        if (res.confirm) { wx.redirectTo({ url: '/pages/lobby/lobby' }) }
      }
    })
  }
})
