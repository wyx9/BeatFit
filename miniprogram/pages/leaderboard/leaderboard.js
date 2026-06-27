const api = require('../../utils/api')
const features = require('../../config/features')

Page({
  data: {
    statusBarHeight: 0,
    activeTab: 'duration',
    unit: 'min',

    podium: {
      first:  { name: '--', value: 0 },
      second: { name: '--', value: 0 },
      third:  { name: '--', value: 0 }
    },

    rankingList: [],

    // 各 tab 对应的单位和缓存
    unitMap: { duration: 'min', calories: 'kcal', count: '次' },

    // 我的排名胶囊（null=不显示，{rank,value}=正常，{}空对象=无训练记录）
    myRank: null,

    // 本地静态数据（后端未连接时兜底）
    fallbackData: {
      duration: {
        podium:   { first: 182, second: 145, third: 120 },
        ranking:  [98, 85, 74, 62],
        names:    ['林克', '赵云', '张三', '刘亦菲'],
        levels:   ['Lv.12 健身达人', 'Lv.08 核心力量', 'Lv.15 资深训练者', 'Lv.05 有氧萌新'],
        topNames: ['王大锤', '李晓华', '陈小美']
      },
      calories: {
        podium:   { first: 1250, second: 1100, third: 980 },
        ranking:  [840, 720, 680, 590],
        names:    ['林克', '赵云', '张三', '刘亦菲'],
        levels:   ['Lv.12 健身达人', 'Lv.08 核心力量', 'Lv.15 资深训练者', 'Lv.05 有氧萌新'],
        topNames: ['王大锤', '李晓华', '陈小美']
      },
      count: {
        podium:   { first: 45, second: 42, third: 38 },
        ranking:  [24, 21, 18, 15],
        names:    ['林克', '赵云', '张三', '刘亦菲'],
        levels:   ['Lv.12 健身达人', 'Lv.08 核心力量', 'Lv.15 资深训练者', 'Lv.05 有氧萌新'],
        topNames: ['王大锤', '李晓华', '陈小美']
      }
    }
  },

  onLoad() {
    if (!features.ENABLE_LEADERBOARD) {
      wx.redirectTo({ url: '/pages/lobby/lobby' })
      return
    }
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
    this.loadLeaderboard('duration')
  },

  // 从后端加载排行榜数据
  async loadLeaderboard(type) {
    try {
      const data = await api.getLeaderboard(type)
      const list = data.list || []

      // 前3名 → 领奖台（防御空昵称）
      function safeName(item) {
        if (!item) return '--'
        var n = item.nickname
        return (n && typeof n === 'string' && n.trim()) ? n.trim() : '--'
      }
      const podium = {
        first:  { name: safeName(list[0]), value: list[0] ? list[0].value : 0 },
        second: { name: safeName(list[1]), value: list[1] ? list[1].value : 0 },
        third:  { name: safeName(list[2]), value: list[2] ? list[2].value : 0 }
      }

      // 第4名以后 → 排行列表
      const rankingList = list.slice(3).map((item, i) => ({
        rank: i + 4,
        name: safeName(item),
        level: 'Lv.' + String(item.level || 1).padStart(2, '0') + ' ' + (item.title || '运动达人'),
        value: item.value
      }))

      // 我的排名（API 仅在有排名时返回 my_rank 字段）
      var myRank = null
      if (data.my_rank && data.my_rank.rank) {
        myRank = { rank: data.my_rank.rank, value: data.my_rank.value }
      } else {
        myRank = {} // 空对象 → 显示"无训练"文案
      }

      this.setData({ podium, rankingList, unit: this.data.unitMap[type], myRank: myRank })
    } catch (err) {
      // 后端未连接，加载本地静态数据（不显示我的排名胶囊）
      this.loadFallback(type)
      this.setData({ myRank: null })
    }
  },

  // 本地数据兜底
  loadFallback(type) {
    const fb = this.data.fallbackData[type]
    this.setData({
      unit: this.data.unitMap[type],
      'podium.first.value':  fb.podium.first,
      'podium.second.value': fb.podium.second,
      'podium.third.value':  fb.podium.third,
      'podium.first.name':   fb.topNames[0],
      'podium.second.name':  fb.topNames[1],
      'podium.third.name':   fb.topNames[2],
      rankingList: fb.ranking.map((v, i) => ({
        rank: i + 4,
        name: fb.names[i],
        level: fb.levels[i],
        value: v
      }))
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadLeaderboard(tab)
  },

  goLobby() {
    wx.redirectTo({ url: '/pages/lobby/lobby' })
  },

  goTemplates() {
    wx.redirectTo({ url: '/pages/exercise-templates/exercise-templates' })
  },

  goProfile() {
    wx.redirectTo({ url: '/pages/profile/profile' })
  }
})
