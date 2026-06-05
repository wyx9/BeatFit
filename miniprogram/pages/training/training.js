const api = require('../../utils/api')

Page({
  data: {
    statusBarHeight: 0,
    userAvatar: '',
    userInitial: '?',
    displayTime: '00:00',
    isPaused: false,
    timerInterval: null,

    currentExercise: { name: '准备中', currentSet: 1, totalSets: 4, targetReps: 12, currentReps: 0 },
    nextExercise: null,

    phase: 'exercise',
    phaseLabel: '动作中',
    countdownSec: 30,
    totalPhaseSec: 30,

    circumference: 578,
    ringDeg: 0,
    totalDisplayTime: '00:00',
    totalProgress: 0,

    exerciseList: [],
    exIndex: 0,
    currentSet: 1,
    totalElapsedSec: 0,
    totalPlanSec: 0
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadUserAvatar()

    const app = getApp()
    let exercises = (app.globalData && app.globalData.roomExercises) || []
    // 兼容 JSON 字符串格式（从后端 WS 传来的）
    if (typeof exercises === 'string') {
      try { exercises = JSON.parse(exercises) } catch(e) { exercises = [] }
    }
    if (!Array.isArray(exercises) || !exercises.length) {
      exercises = [
        { name: '高位下拉', tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
        { name: '引体向上', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 }
      ]
    }
    app.globalData.roomExercises = null
    app.globalData.startedAt = null

    let totalPlan = 0
    exercises.forEach(ex => { totalPlan += (ex.sets || 1) * ((ex.duration_sec || 30) + (ex.rest_sec || 60)) })

    this.setData({ exerciseList: exercises, totalPlanSec: totalPlan })
    this.loadExercise(0, 1)
    this.startCountdown()
  },

  onUnload() { this.clearTimer() },

  loadUserAvatar() {
    const user = api.getUserInfo()
    if (user) this.setData({ userAvatar: user.avatar_url || '', userInitial: (user.nickname || '?')[0] })
  },

  // 加载指定动作和组数，返回 true 表示训练已完成
  loadExercise(exIndex, setNum) {
    const list = this.data.exerciseList
    if (exIndex >= list.length) {
      this.clearTimer()
      this.setData({ phase: 'complete', phaseLabel: '训练完成', displayTime: '00:00', ringDeg: 0, totalProgress: 100 })
      wx.showModal({
        title: '训练完成',
        content: '恭喜你完成了本次训练！',
        showCancel: false,
        confirmText: '返回主页',
        success: () => { wx.redirectTo({ url: '/pages/lobby/lobby' }) }
      })
      return true
    }
    const ex = list[exIndex]
    const nextEx = exIndex + 1 < list.length ? list[exIndex + 1] : null
    this.setData({
      exIndex, currentSet: setNum,
      currentExercise: { name: ex.name, currentSet: setNum, totalSets: ex.sets || 4, targetReps: ex.reps, currentReps: 0 },
      nextExercise: nextEx ? { name: nextEx.name, duration: Math.ceil(nextEx.duration_sec / 60) } : null,
      phase: 'exercise', phaseLabel: '动作中',
      countdownSec: ex.duration_sec || 30, totalPhaseSec: ex.duration_sec || 30,
      ringDeg: 0
    })
    return false
  },

  startCountdown() {
    this.clearTimer()
    const update = () => {
      if (this.data.isPaused) return
      let sec = this.data.countdownSec - 1
      if (sec < 0) { this.nextPhase(); return }

      let totalElapsed = this.data.totalElapsedSec + 1
      const ratio = 1 - (sec / this.data.totalPhaseSec)
      const ringDeg = Math.round(ratio * 360)
      const totalRatio = this.data.totalPlanSec > 0 ? totalElapsed / this.data.totalPlanSec : 0

      this.setData({
        countdownSec: sec,
        displayTime: String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'),
        ringDeg: ringDeg,
        totalElapsedSec: totalElapsed,
        totalProgress: Math.round(totalRatio * 100),
        totalDisplayTime: String(Math.floor(totalElapsed / 60)).padStart(2, '0') + ':' + String(totalElapsed % 60).padStart(2, '0')
      })
    }
    update()
    this.setData({ timerInterval: setInterval(update, 1000) })
  },

  nextPhase() {
    const { phase, exIndex, currentSet, exerciseList } = this.data
    const ex = exerciseList[exIndex]
    if (!ex) return
    if (phase === 'exercise') {
      if (currentSet < ex.sets) {
        // 当前动作还有剩余组 → 进入休息
        this.setData({ phase: 'rest', phaseLabel: '休息中', countdownSec: ex.rest_sec || 60, totalPhaseSec: ex.rest_sec || 60 })
        this.startCountdown()
      } else {
        // 当前动作所有组完成 → 下一动作
        const done = this.loadExercise(exIndex + 1, 1)
        if (!done) this.startCountdown()
      }
    } else {
      // 休息结束 → 下一组
      const done = this.loadExercise(exIndex, currentSet + 1)
      if (!done) this.startCountdown()
    }
  },

  clearTimer() {
    if (this.data.timerInterval) { clearInterval(this.data.timerInterval); this.setData({ timerInterval: null }) }
  },

  togglePause() { this.setData({ isPaused: !this.data.isPaused }) },

  handleStop() {
    wx.showModal({
      title: '结束训练', content: '确定要结束本次训练吗？',
      success: (res) => { if (res.confirm) { this.clearTimer(); wx.navigateBack() } }
    })
  },

  goLobby() { wx.redirectTo({ url: '/pages/lobby/lobby' }) },
  goLeaderboard() { wx.redirectTo({ url: '/pages/leaderboard/leaderboard' }) },
  goProfile() { wx.redirectTo({ url: '/pages/profile/profile' }) }
})
