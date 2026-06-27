const api = require('../../utils/api')
const features = require('../../config/features')

Page({
  data: {
    statusBarHeight: 0,
    userInfo: {},
    showNicknameModal: false,
    editNickname: '',
    ENABLE_LEADERBOARD: features.ENABLE_LEADERBOARD,
    ENABLE_WORKOUT_RECORDS: features.ENABLE_WORKOUT_RECORDS,
    ENABLE_ACHIEVEMENTS: features.ENABLE_ACHIEVEMENTS
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 优先从服务器加载，失败则用本地缓存
  async loadUserInfo() {
    try {
      const data = await api.getProfile()
      if (data.user) {
        this.setData({ userInfo: data.user })
        api.setUserInfo(data.user)  // 同步到本地缓存
        return
      }
    } catch(e) {}
    // 服务器不可用时用本地缓存
    const user = api.getUserInfo()
    if (user) this.setData({ userInfo: user })
  },

  goLobby() {
    wx.redirectTo({ url: '/pages/lobby/lobby' })
  },

  goLeaderboard() {
    wx.redirectTo({ url: '/pages/leaderboard/leaderboard' })
  },

  goTemplates() {
    wx.redirectTo({ url: '/pages/exercise-templates/exercise-templates' })
  },

  goWorkoutHistory() {
    wx.navigateTo({ url: '/pages/workout-history/workout-history' })
  },

  // 点击昵称旁编辑图标 → 弹出修改弹窗
  onEditNickname() {
    this.setData({
      showNicknameModal: true,
      editNickname: this.data.userInfo.nickname || ''
    })
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ editNickname: e.detail.value })
  },

  // 取消修改
  onCancelNickname() {
    this.setData({ showNicknameModal: false })
  },

  // 确认修改 → 保存到后端
  onConfirmNickname() {
    const name = this.data.editNickname.trim()
    if (!name) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    if (name === this.data.userInfo.nickname) {
      this.setData({ showNicknameModal: false })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })
    api.updateProfile(name, '').then((data) => {
      wx.hideLoading()
      const userInfo = data.user || Object.assign({}, this.data.userInfo, { nickname: name })
      this.setData({ userInfo, showNicknameModal: false })
      api.setUserInfo(userInfo)
      wx.showToast({ title: '昵称已更新', icon: 'success', duration: 1200 })
    }).catch((err) => {
      wx.hideLoading()
      // 后端不可用时仅更新本地
      const userInfo = Object.assign({}, this.data.userInfo, { nickname: name })
      this.setData({ userInfo, showNicknameModal: false })
      api.setUserInfo(userInfo)
      wx.showToast({ title: '已本地更新', icon: 'none', duration: 1200 })
    })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用后端退出接口
          api.logout().catch(() => {})
          // 清除本地数据
          api.clearToken()
          wx.clearStorageSync()
          // 跳转到启动页
          wx.reLaunch({ url: '/pages/splash/splash' })
        }
      }
    })
  }
})
