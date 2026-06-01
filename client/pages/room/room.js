const api = require('../../utils/api')
const { WsClient } = require('../../utils/ws')
const app = getApp()

Page({
  data: {
    code: '',
    room: {},
    exercises: [],
    members: [],
    isOwner: false,
    canStart: false
  },

  onLoad(options) {
    this.setData({ code: options.code })
    // 持久化房间码：刷新页面后自动回到该房间
    wx.setStorageSync('sport_current_room', options.code)
    this.ws = new WsClient()
    this.setupWS()
    this.loadRoom()
  },

  onUnload() {
    if (this.ws) this.ws.close()
  },

  loadRoom() {
    api.getRoom(this.data.code).then(detail => {
      const isOwner = detail.room.owner_id === app.globalData.userId
      this.setData({
        room: detail.room,
        exercises: detail.exercises,
        members: detail.members,
        isOwner: isOwner,
        canStart: isOwner && detail.members.length >= 1
      })
    }).catch(err => {
      wx.showToast({ title: '房间不存在', icon: 'none' })
    })
  },

  setupWS() {
    this.ws.connect(this.data.code)

    this.ws.on('user_joined', (msg) => {
      wx.showToast({ title: '有人加入了房间', icon: 'none' })
      this.loadRoom()
    })

    this.ws.on('user_left', (msg) => {
      this.loadRoom()
    })

    this.ws.on('members', (msg) => {
      if (msg.data) {
        // 更新成员信息
        this.loadRoom()
      }
    })

    this.ws.on('training_started', (msg) => {
      // 跳转到训练页面
      wx.redirectTo({
        url: '/pages/training/training?code=' + this.data.code
      })
    })
  },

  onStartTraining() {
    if (!this.data.isOwner) {
      wx.showToast({ title: '只有房主可以开始训练', icon: 'none' })
      return
    }

    wx.showModal({
      title: '开始训练',
      content: '确定开始训练吗？所有成员将进入训练模式。',
      success: (res) => {
        if (res.confirm) {
          api.startTraining(this.data.code).then(() => {
            // WS training_started 事件触发跳转
          }).catch(err => {
            wx.showToast({ title: err.error || '开始失败', icon: 'none' })
          })
        }
      }
    })
  },

  onLeave() {
    wx.showModal({
      title: '离开房间',
      content: '确定离开吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('sport_current_room') // 清除房间记录
          api.leaveRoom(this.data.code).then(() => {
            this.ws.close()
            wx.navigateBack()
          }).catch(() => {
            this.ws.close()
            wx.navigateBack()
          })
        }
      }
    })
  },

  onCopyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => {
        wx.showToast({ title: '房间码已复制', icon: 'success' })
      }
    })
  }
})
