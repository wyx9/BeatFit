// ===== 训练记录页 =====
const api = require('../../utils/api')

// ---- 日历工具函数 ----

// 某年某月的天数
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// 获取某天是周几（周一=0 ... 周日=6）
function getWeekday(year, month, day) {
  var d = new Date(year, month - 1, day)
  var jsDay = d.getDay() // 0=周日
  return jsDay === 0 ? 6 : jsDay - 1
}

// 构建当月日历网格（仅当月日期 + 首行占位格）
function buildCalendarGrid(year, month, workoutDaySet) {
  var total = daysInMonth(year, month)
  var firstDow = getWeekday(year, month, 1)
  var cells = []

  // 首行占位（不可见空单元格，对齐星期）
  for (var i = 0; i < firstDow; i++) {
    cells.push({ day: 0, isEmpty: true })
  }

  // 当月日期
  for (var d = 1; d <= total; d++) {
    var mm = String(month).padStart(2, '0')
    var dd = String(d).padStart(2, '0')
    var key = year + '-' + mm + '-' + dd
    cells.push({ day: d, isEmpty: false, isWorkout: workoutDaySet.has(key) })
  }

  return cells
}

// 中文周几映射
var WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

Page({
  data: {
    statusBarHeight: 0,

    // 日历
    calendarYear: 0,
    calendarMonth: 0,
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    calendarGrid: [],
    canGoPrev: true,
    canGoNext: true,

    // 汇总
    summary: { monthWorkouts: 0, monthMinutes: 0, monthKcal: 0 },

    // 记录列表
    logs: [],
    expandedId: 0,

    // 加载态
    loading: false
  },

  onLoad() {
    var sys = wx.getSystemInfoSync()
    var now = new Date()
    this.setData({
      statusBarHeight: sys.statusBarHeight,
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1
    })
    this._refreshView(this.data.calendarYear, this.data.calendarMonth)
  },

  onShow() {
    // 每次进入页面刷新当前月数据（可能是训练完跳转过来的）
    // 首次加载由 onLoad 负责，onShow 跳过以避免重复请求
    if (this._firstLoadDone && this.data.calendarYear > 0) {
      this._refreshView(this.data.calendarYear, this.data.calendarMonth)
    }
    this._firstLoadDone = true
  },

  // ---- 月份切换 ----

  goPrevMonth() {
    if (!this.data.canGoPrev) return
    var y = this.data.calendarYear
    var m = this.data.calendarMonth
    if (m === 1) { y--; m = 12 } else { m-- }
    this._refreshView(y, m)
  },

  goNextMonth() {
    if (!this.data.canGoNext) return
    var y = this.data.calendarYear
    var m = this.data.calendarMonth
    if (m === 12) { y++; m = 1 } else { m++ }
    this._refreshView(y, m)
  },

  // ---- 内部刷新（异步请求后端）----

  _refreshView(year, month) {
    var self = this
    self.setData({ loading: true })
    wx.showNavigationBarLoading()

    api.getWorkoutHistory(1, 200, year, month).then(function (data) {
      wx.hideNavigationBarLoading()
      self.setData({ loading: false })

      var logs = data.logs || []
      var workoutDays = data.workout_days || []

      // 构建训练日集合
      var workoutDaySet = new Set()
      for (var i = 0; i < workoutDays.length; i++) {
        workoutDaySet.add(workoutDays[i])
      }

      // 转换 log 数据（created_at → date/weekday，exercises → 数组）
      var monthLogs = []
      var totalMin = 0
      var totalKcal = 0
      for (var j = 0; j < logs.length; j++) {
        var log = logs[j]
        var d = new Date(log.created_at)
        if (isNaN(d.getTime())) {
          // 无法解析日期，跳过
          continue
        }
        var day = d.getDate()
        var mm = d.getMonth() + 1
        var dd = String(day).padStart(2, '0')
        var dateStr = mm + '月' + dd + '日'
        var weekday = WEEKDAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]

        // exercises 后端已返回数组（json.RawMessage），直接使用
        var exs = log.exercises
        if (typeof exs === 'string') {
          try { exs = JSON.parse(exs) } catch (e) { exs = null }
        }

        monthLogs.push({
          id: log.id,
          date: dateStr,
          weekday: weekday,
          minutes: log.minutes,
          kcal: log.kcal,
          count: log.count,
          exercises: exs || []
        })
        totalMin += log.minutes
        totalKcal += log.kcal
      }

      var grid = buildCalendarGrid(year, month, workoutDaySet)

      var now = new Date()
      var thisYear = now.getFullYear()
      var canPrev = !(year === thisYear && month === 1)
      var canNext = !(year === thisYear && month === 12)

      self.setData({
        calendarYear: year,
        calendarMonth: month,
        calendarGrid: grid,
        canGoPrev: canPrev,
        canGoNext: canNext,
        summary: {
          monthWorkouts: monthLogs.length,
          monthMinutes: totalMin,
          monthKcal: totalKcal
        },
        logs: monthLogs,
        expandedId: 0
      })
    }).catch(function (err) {
      wx.hideNavigationBarLoading()
      self.setData({ loading: false })
      console.error('[workout-history] 加载失败:', err)
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  // ---- 卡片展开/收起 ----

  onToggleCard(e) {
    var id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? 0 : id
    })
  },

  goBack() {
    var pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  }
})
