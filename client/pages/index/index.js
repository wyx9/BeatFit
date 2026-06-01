const api = require('../../utils/api')
const { WsClient } = require('../../utils/ws')
const app = getApp()

Page({
  data: {
    nickname: '',
    loggedIn: false,
    rooms: [],
    joinCode: '',
    showSwitch: false,
    recentUsers: []
  },

  onLoad() {
    this.lobbyWs = null
    this.loadRecentUsers()
    if (app.globalData.userId) {
      this.setData({ nickname: app.globalData.nickname, loggedIn: true })
      this.loadRooms()
      this.connectLobby()
    }
    // 恢复房间状态：如果已登录且有保存的房间码，自动跳转
    this.restoreRoom()
  },

  onShow() {
    if (this.data.loggedIn) {
      this.loadRooms()
      this.connectLobby()
    }
    this.restoreRoom()
  },

  // 恢复房间：刷新页面后自动回到之前的房间
  restoreRoom() {
    if (!app.globalData.userId) return
    const roomCode = wx.getStorageSync('sport_current_room')
    if (!roomCode) return
    // 清除标记（仅恢复一次，避免反复跳转）
    wx.removeStorageSync('sport_current_room')
    // 异步查房间状态，决定跳去等待室还是训练页
    api.getRoom(roomCode).then(detail => {
      if (detail.room.status === 'active') {
        wx.redirectTo({ url: '/pages/training/training?code=' + roomCode })
      } else if (detail.room.status === 'waiting') {
        wx.redirectTo({ url: '/pages/room/room?code=' + roomCode })
      }
    }).catch(() => {
      wx.removeStorageSync('sport_current_room')
    })
  },

  onHide() {
    this.disconnectLobby()
  },

  onUnload() {
    this.disconnectLobby()
  },

  // 连接到大厅 WebSocket，接收新房通知
  connectLobby() {
    if (this.lobbyWs) return // 已连接则跳过
    const wsUrl = app.globalData.wsBaseUrl + '/ws/lobby?user_id=' + app.globalData.userId
    this.lobbyWs = new WsClient()
    this.lobbyWs.connectRaw(wsUrl)
    this.lobbyWs.on('room_list_changed', () => {
      this.loadRooms()
    })
  },

  // 离开首页时断开大厅连接
  disconnectLobby() {
    if (this.lobbyWs) {
      this.lobbyWs.close()
      this.lobbyWs = null
    }
  },

  loadRecentUsers() {
    const users = wx.getStorageSync('recent_users') || []
    this.setData({ recentUsers: users })
  },

  saveRecentUser(nickname) {
    let users = wx.getStorageSync('recent_users') || []
    users = users.filter(u => u !== nickname)
    users.unshift(nickname)
    if (users.length > 5) users = users.slice(0, 5)
    wx.setStorageSync('recent_users', users)
  },

  onInputNickname(e) {
    this.setData({ nickname: e.detail.value })
  },

  onLogin() {
    const name = this.data.nickname.trim()
    if (!name) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.doLogin(name)
  },

  onQuickLogin(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ nickname: name, showSwitch: false })
    this.doLogin(name)
  },

  doLogin(name) {
    app.login(name, (err) => {
      if (err) {
        wx.showToast({ title: '登录失败', icon: 'none' })
        return
      }
      this.saveRecentUser(name)
      this.setData({ loggedIn: true, showSwitch: false })
      this.loadRooms()
    })
  },

  onToggleSwitch() {
    this.loadRecentUsers()
    this.setData({ showSwitch: !this.data.showSwitch })
  },

  onLogout() {
    wx.removeStorageSync('user')
    app.globalData.userId = ''
    app.globalData.nickname = ''
    app.globalData.token = ''
    this.setData({
      loggedIn: false,
      nickname: '',
      rooms: [],
      showSwitch: false
    })
  },

  loadRooms() {
    api.listRooms().then(rooms => {
      this.setData({ rooms })
    }).catch(err => {
      console.error('load rooms error:', err)
    })
  },

  onInputCode(e) {
    this.setData({ joinCode: e.detail.value.toUpperCase() })
  },

  onJoinRoom() {
    const code = this.data.joinCode.trim()
    if (!code) {
      wx.showToast({ title: '请输入房间码', icon: 'none' })
      return
    }

    api.joinRoom(code).then(() => {
      wx.navigateTo({ url: '/pages/room/room?code=' + code })
    }).catch(err => {
      wx.showToast({ title: err.error || '加入失败', icon: 'none' })
    })
  },

  onEnterRoom(e) {
    const code = e.currentTarget.dataset.code
    wx.navigateTo({ url: '/pages/room/room?code=' + code })
  },

  // 直接从列表加入房间
  onJoinFromList(e) {
    const code = e.currentTarget.dataset.code
    api.joinRoom(code).then(() => {
      wx.navigateTo({ url: '/pages/room/room?code=' + code })
    }).catch(err => {
      wx.showToast({ title: err.error || '加入失败', icon: 'none' })
    })
  },

  onCreateRoom() {
    wx.navigateTo({ url: '/pages/create/create' })
  }
})
