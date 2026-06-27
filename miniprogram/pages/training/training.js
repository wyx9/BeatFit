const api = require('../../utils/api')
const features = require('../../config/features')

// MET 热量系数：按动作标签区分每秒消耗（千卡）
const TAG_KCAL_PER_SEC = {
  '力量': 0.117, '塑形': 0.097, '肥大': 0.117,
  '复合': 0.156, '耐力': 0.078, '康复': 0.058
}
const DEFAULT_KCAL_PER_SEC = 0.1

Page({
  data: {
    statusBarHeight: 0,
    ENABLE_LEADERBOARD: features.ENABLE_LEADERBOARD,
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

    rightDeg: 180,
    leftDeg: 0,
    showLeft: false,
    ringPulse: false,
    totalDisplayTime: '00:00',
    totalProgress: 0,

    exerciseList: [],
    exIndex: 0,
    currentSet: 1,
    totalElapsedSec: 0,
    totalPlanSec: 0,

    // —— 计时精度 ——
    trainingStartTime: null,     // Date.now() 训练开始时间戳
    phaseStartTime: null,        // Date.now() 当前阶段起始时间戳
    totalPauseMs: 0,             // 训练全程累计暂停毫秒数
    phasePauseMs: 0,             // 当前阶段累计暂停毫秒数
    pauseStartedAt: null,        // 当前暂停开始时间戳（null=未暂停）

    // —— 生命周期 ——
    hiddenAt: null,              // onHide 时间戳
    wasPausedBeforeHide: false,  // 切后台前的暂停状态

    // —— 震动 ——
    vibrationEnabled: true,

    // —— 热量 ——
    totalKcal: 0                 // 累计热量（千卡）
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
    // 兜底：从 currentRoom.exercises 解析（断线重连场景 globalData.roomExercises 可能为数组但为空）
    if (exercises.length === 0 && app.globalData && app.globalData.currentRoom && app.globalData.currentRoom.exercises) {
      const raw = app.globalData.currentRoom.exercises
      try { exercises = typeof raw === 'string' ? JSON.parse(raw) : raw } catch(e) {}
    }
    // 兜底：如果 globalData 没有 currentRoom，从 URL 参数构造
    if ((!app.globalData.currentRoom || !app.globalData.currentRoom.id) && options.roomId) {
      app.globalData.currentRoom = { id: parseInt(options.roomId) }
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

    const now = Date.now()
    this.setData({
      exerciseList: exercises,
      totalPlanSec: totalPlan,
      trainingStartTime: now,
      phaseStartTime: now
    })
    this.loadExercise(0, 1)
    this.startCountdown()
  },

  onUnload() { this.clearTimer() },

  // —— 生命周期：切后台自动暂停 ——
  onHide() {
    const wasPaused = this.data.isPaused
    this.setData({ hiddenAt: Date.now(), wasPausedBeforeHide: wasPaused })
    if (!wasPaused) {
      // 清除计时器但保持 isPaused 显示状态（不记录暂停时间，后台时间计入训练）
      if (this.data.timerInterval) {
        clearInterval(this.data.timerInterval)
        this.setData({ timerInterval: null })
      }
      this.setData({ isPaused: true })
    }
  },

  // —— 生命周期：切前台自动恢复 ——
  onShow() {
    if (!this.data.hiddenAt) return  // 首次加载，非后台恢复
    this.setData({ hiddenAt: null })
    if (!this.data.wasPausedBeforeHide) {
      // 之前未暂停 → 自动恢复计时（Date.now() 已推进，剩余时间自动修正）
      this.setData({ isPaused: false })
      this.startCountdown()
    }
    // 之前已暂停 → 保持暂停状态
  },

  loadUserAvatar() {
    const user = api.getUserInfo()
    if (user) this.setData({ userAvatar: user.avatar_url || '', userInitial: (user.nickname || '?')[0] })
  },

  // —— 震动辅助函数 ——
  vibrate(type) {
    if (!this.data.vibrationEnabled) return
    try {
      if (type === 'long') wx.vibrateLong()
      else wx.vibrateShort({ type: type || 'light' })
    } catch(e) {
      try { wx.vibrateShort() } catch(e2) {}  // 兼容老版本 iOS
    }
  },

  // 加载指定动作和组数，返回 true 表示训练已完成
  loadExercise(exIndex, setNum) {
    const list = this.data.exerciseList
    if (exIndex >= list.length) {
      this.clearTimer()
      this.vibrate('long')
      this.setData({ phase: 'complete', phaseLabel: '训练完成', displayTime: '00:00', rightDeg: 180, leftDeg: 0, showLeft: false, totalProgress: 100 })
      const app = getApp()
      const roomId = (app.globalData && app.globalData.currentRoom && app.globalData.currentRoom.id)
      if (roomId) {
        const elapsed = this.data.totalElapsedSec
        const kcal = Math.round(this.data.totalKcal)
        api.reportWorkout(roomId, Math.ceil(elapsed / 60), kcal, this.data.exerciseList.length).catch(() => {})
        api.dissolveRoom(roomId).catch(() => {})
      }
      wx.showModal({
        title: '训练完成',
        content: '恭喜你完成了本次训练！',
        showCancel: false,
        confirmText: '返回主页',
        success: () => { wx.redirectTo({ url: '/pages/lobby/lobby' }) },
        fail: () => {
          // Modal 显示失败时，500ms 后自动跳转
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/lobby/lobby' })
          }, 500)
        }
      })
      return true
    }
    const ex = list[exIndex]
    const nextEx = exIndex + 1 < list.length ? list[exIndex + 1] : null
    this.setData({
      exIndex, currentSet: setNum,
      currentExercise: { name: ex.name, currentSet: setNum, totalSets: ex.sets || 4, targetReps: ex.reps, currentReps: 0, image: ex.image ? api.getExerciseImageUrl(ex.image) : '' },
      nextExercise: nextEx ? { name: nextEx.name, duration: Math.ceil((nextEx.sets || 1) * ((nextEx.duration_sec || 30) + (nextEx.rest_sec || 60)) / 60), image: nextEx.image ? api.getExerciseImageUrl(nextEx.image) : '' } : null,
      phase: 'exercise', phaseLabel: '动作中',
      countdownSec: ex.duration_sec || 30, totalPhaseSec: ex.duration_sec || 30,
      rightDeg: 180, leftDeg: 0, showLeft: false
    })
    return false
  },

  // —— 计时器：Date.now() 基准，消除累积误差 ——
  startCountdown() {
    this.clearTimer()
    // 注意：phasePauseMs 不在此处重置 ——
    //   - 新阶段开始时由 beforeNextPhase 负责归零
    //   - 暂停恢复时由 togglePause 负责累加，不可归零

    const update = () => {
      if (this.data.isPaused) return

      const now = Date.now()
      const phaseElapsedMs = now - this.data.phaseStartTime - this.data.phasePauseMs
      const remainingMs = this.data.totalPhaseSec * 1000 - phaseElapsedMs

      if (remainingMs <= 0) {
        this.nextPhase()
        return
      }

      const totalElapsedMs = now - this.data.trainingStartTime - this.data.totalPauseMs
      const totalElapsedSec = Math.floor(totalElapsedMs / 1000)
      const remainingSec = Math.ceil(remainingMs / 1000)
      const ratio = phaseElapsedMs / (this.data.totalPhaseSec * 1000)
      const degrees = ratio * 360
      const rightDeg = 180 + Math.min(180, degrees)
      const leftDeg = Math.max(0, degrees - 180)
      const showLeft = degrees > 180
      const totalRatio = this.data.totalPlanSec > 0 ? totalElapsedSec / this.data.totalPlanSec : 0

      this.setData({
        countdownSec: remainingSec,
        displayTime: String(Math.floor(remainingSec / 60)).padStart(2, '0') + ':' + String(remainingSec % 60).padStart(2, '0'),
        rightDeg: rightDeg,
        leftDeg: leftDeg,
        showLeft: showLeft,
        totalElapsedSec: totalElapsedSec,
        totalProgress: Math.min(100, Math.round(totalRatio * 100)),
        totalDisplayTime: String(Math.floor(totalElapsedSec / 60)).padStart(2, '0') + ':' + String(totalElapsedSec % 60).padStart(2, '0')
      })
    }
    // 首次 tick 立即执行（无延迟），消除启动空白
    update()
    this.setData({ timerInterval: setInterval(update, 100) })
  },

  // —— 阶段切换：累加热量，直接进入下一阶段 ——
  nextPhase() {
    const { phase, exIndex, currentSet, exerciseList, totalPhaseSec } = this.data
    const ex = exerciseList[exIndex]
    if (!ex) return

    // 累加已完成阶段的热量
    const tag = ex.tag || ''
    const kcalPerSec = TAG_KCAL_PER_SEC[tag] || DEFAULT_KCAL_PER_SEC
    const phaseKcal = totalPhaseSec * kcalPerSec
    const newTotalKcal = this.data.totalKcal + phaseKcal

    // 累加已完成阶段的总时长
    const newTotalElapsed = this.data.totalElapsedSec + totalPhaseSec

    if (phase === 'exercise') {
      if (currentSet < ex.sets) {
        // 当前动作还有剩余组 → 进入休息
        this.vibrate('light')
        this.setData({
          phase: 'rest', phaseLabel: '休息中',
          countdownSec: ex.rest_sec || 60, totalPhaseSec: ex.rest_sec || 60,
          totalKcal: newTotalKcal, totalElapsedSec: newTotalElapsed
        })
        this.beforeNextPhase()
      } else {
        // 当前动作所有组完成 → 直接进入下一动作
        this.vibrate('light')
        this.setData({ totalKcal: newTotalKcal, totalElapsedSec: newTotalElapsed })
        const done = this.loadExercise(exIndex + 1, 1)
        if (!done) this.beforeNextPhase()
      }
    } else {
      // 休息结束 → 下一组
      this.vibrate('medium')
      this.setData({ totalKcal: newTotalKcal, totalElapsedSec: newTotalElapsed })
      const done = this.loadExercise(exIndex, currentSet + 1)
      if (!done) this.beforeNextPhase()
    }
  },

  // 阶段开始前的通用准备（重置计时基准）
  beforeNextPhase() {
    const now = Date.now()
    this.setData({ phaseStartTime: now, phasePauseMs: 0, ringPulse: true })
    setTimeout(() => { this.setData({ ringPulse: false }) }, 300)
    this.startCountdown()
  },

  // —— 清除所有计时器 ——
  clearTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
      this.setData({ timerInterval: null })
    }
  },

  // —— 暂停/继续：真正清除/重建计时器 ——
  togglePause() {
    if (this.data.isPaused) {
      // 恢复：计算暂停时长，修正所有时间基准
      const pauseDuration = Date.now() - (this.data.pauseStartedAt || Date.now())
      const newTotalPauseMs = this.data.totalPauseMs + pauseDuration
      const newPhasePauseMs = this.data.phasePauseMs + pauseDuration
      this.setData({
        isPaused: false,
        pauseStartedAt: null,
        totalPauseMs: newTotalPauseMs,
        phasePauseMs: newPhasePauseMs
      })
      this.startCountdown()
    } else {
      // 暂停：记录暂停开始时间，清除计时器
      this.clearTimer()
      this.setData({ isPaused: true, pauseStartedAt: Date.now() })
    }
  },

  handleStop() {
    wx.showModal({
      title: '结束训练', content: '确定要结束本次训练吗？已完成的训练数据会被保存。',
      success: (res) => {
        if (res.confirm) {
          this.clearTimer()
          // 上报已完成的训练数据 + 解散房间
          const app = getApp()
          const roomId = (app.globalData && app.globalData.currentRoom && app.globalData.currentRoom.id)
          if (roomId) {
            const elapsed = this.data.totalElapsedSec
            const kcal = Math.round(this.data.totalKcal)
            api.reportWorkout(roomId, Math.ceil(elapsed / 60), kcal, this.data.exerciseList.length).catch(() => {})
            api.dissolveRoom(roomId).catch(() => {})
          }
          wx.redirectTo({ url: '/pages/lobby/lobby' })
        }
      }
    })
  },

})
