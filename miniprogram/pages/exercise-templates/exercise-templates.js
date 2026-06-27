// ===== 模板管理页（动作库） =====

const api = require('../../utils/api')
const exerciseUtils = require('../../utils/exercise-utils')
const features = require('../../config/features')

Page({
  data: {
    presets: [],
    userTemplates: [],
    ENABLE_LEADERBOARD: features.ENABLE_LEADERBOARD
  },

  onLoad() {},

  onShow() {
    this.refresh()
  },

  refresh() {
    const all = exerciseUtils.getAllTemplates()
    const presets = all.filter(t => t.preset === true).map(t => ({
      ...t, exercises: api.resolveExerciseImages(t.exercises)
    }))
    const userTemplates = all.filter(t => t.preset !== true).map(t => ({
      ...t, exercises: api.resolveExerciseImages(t.exercises)
    }))
    this.setData({ presets, userTemplates })
  },

  // 计算模板总时长（分钟）
  totalMinutes(tpl) {
    let sec = 0
    ;(tpl.exercises || []).forEach(ex => {
      sec += (ex.sets || 1) * ((ex.duration_sec || 0) + (ex.rest_sec || 0))
    })
    return Math.ceil(sec / 60)
  },

  // 点击系统预设 → 只读查看
  onViewPreset(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/exercise-editor/exercise-editor?tplId=' + id })
  },

  // 点击用户模板 → 编辑
  onEditTemplate(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/exercise-editor/exercise-editor?tplId=' + id })
  },

  // 新建
  onCreateNew() {
    wx.navigateTo({ url: '/pages/exercise-editor/exercise-editor' })
  },

  // 删除
  onDeleteTemplate(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除模板',
      content: '确定要删除这个模板吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          exerciseUtils.deleteUserTemplate(id)
          this.refresh()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  goLobby() {
    wx.redirectTo({ url: '/pages/lobby/lobby' })
  },

  goLeaderboard() {
    wx.redirectTo({ url: '/pages/leaderboard/leaderboard' })
  },

  goProfile() {
    wx.redirectTo({ url: '/pages/profile/profile' })
  }
})
