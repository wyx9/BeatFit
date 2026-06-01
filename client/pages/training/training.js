const { WsClient } = require('../../utils/ws')
const api = require('../../utils/api')

Page({
  data: {
    code: '',
    exercises: [],
    currentIndex: 0,
    currentExercise: null,
    secondsLeft: 0,
    totalSeconds: 0,
    progress: 0,
    totalExercises: 0,
    completedExercises: [],
    finished: false,
    nextExercise: null,
    phaseLabel: '',
    isRestPhase: false,
    setInfo: ''
  },

  onLoad(options) {
    this.setData({ code: options.code })
    this.ws = new WsClient()
    this.setupWS()
    this.ws.connect(options.code)
  },

  onUnload() {
    if (this.ws) this.ws.close()
  },

  setupWS() {
    this.ws.on('training_started', (msg) => {
      const data = msg.data
      const exercises = data.exercises || []
      const current = exercises[data.current_index] || null
      const next = exercises.length > data.current_index + 1 ? exercises[data.current_index + 1] : null

      this.setData({
        exercises: exercises,
        totalExercises: exercises.length,
        currentIndex: data.current_index,
        currentExercise: current,
        secondsLeft: current ? current.duration_seconds : 0,
        totalSeconds: current ? current.duration_seconds : 0,
        nextExercise: next,
        setInfo: current ? (current.name + ' · 第 1/' + current.sets + ' 组') : '',
        isRestPhase: false
      })
    })

    this.ws.on('timer_tick', (msg) => {
      const data = msg.data
      const exercise = this.data.exercises[data.exercise_index]
      const phaseLabel = data.phase === 'rest' ? '休息' : (data.exercise_name || '')
      const nameWithSet = phaseLabel + (data.phase !== 'rest' ? ' · 第 ' + data.set_number + '/' + data.total_sets + ' 组' : ' · 放松')
      this.setData({
        secondsLeft: data.seconds_left,
        currentIndex: data.exercise_index,
        currentExercise: exercise,
        totalSeconds: data.total_seconds,
        progress: exercise ? ((data.total_seconds - data.seconds_left) / data.total_seconds * 100) : 0,
        phaseLabel: phaseLabel,
        isRestPhase: data.phase === 'rest',
        setInfo: nameWithSet
      })
    })

    this.ws.on('exercise_change', (msg) => {
      const data = msg.data
      const next = this.data.exercises.length > data.exercise_index + 1
        ? this.data.exercises[data.exercise_index + 1]
        : null

      const completed = this.data.completedExercises
      if (data.exercise_index > 0 && this.data.exercises[data.exercise_index - 1]) {
        completed.push(this.data.exercises[data.exercise_index - 1].name)
      }

      this.setData({
        currentIndex: data.exercise_index,
        currentExercise: data.exercise,
        secondsLeft: data.total_duration,
        totalSeconds: data.total_duration,
        nextExercise: next,
        completedExercises: completed
      })

      // 切换动作时震动提醒
      wx.vibrateLong()
    })

    // 训练重连：刷新页面后服务端下发当前进度
    this.ws.on('training_resume', (msg) => {
      const data = msg.data
      const exercises = data.exercises || []
      const current = exercises[data.current_index] || null
      const next = exercises.length > data.current_index + 1 ? exercises[data.current_index + 1] : null

      this.setData({
        exercises: exercises,
        totalExercises: exercises.length,
        currentIndex: data.current_index,
        currentExercise: current,
        secondsLeft: data.seconds_left,
        totalSeconds: data.total_seconds,
        nextExercise: next,
        finished: false
      })
    })

    // 训练被房主终止，所有人返回大厅
    this.ws.on('training_terminated', () => {
      wx.removeStorageSync('sport_current_room')
      if (this.ws) { this.ws.close(); this.ws = null; }
      wx.showToast({ title: '训练已终止', icon: 'none' })
      wx.redirectTo({ url: '/pages/index/index' })
    })

    this.ws.on('training_complete', () => {
      wx.removeStorageSync('sport_current_room') // 训练完成，清除记录
      this.setData({
        finished: true,
        progress: 100,
        secondsLeft: 0
      })
      wx.vibrateLong()
    })
  },

  // 房主终止训练
  onTerminate() {
    wx.showModal({
      title: '终止训练',
      content: '确定终止吗？所有成员将返回大厅。',
      success: (res) => {
        if (res.confirm) {
          api.terminateTraining(this.data.code).catch(() => {})
        }
      }
    })
  },

  onBackHome() {
    // 返回首页时清除房间记录
    wx.removeStorageSync('sport_current_room')
    wx.redirectTo({ url: '/pages/index/index' })
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  }
})
