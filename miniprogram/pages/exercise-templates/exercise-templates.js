// ===== 模板管理页（动作库） =====

const exerciseUtils = require('../../utils/exercise-utils')

Page({
  data: {
    statusBarHeight: 0,
    presets: [],
    userTemplates: []
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const all = exerciseUtils.getAllTemplates()
    const presets = all.filter(t => t.preset === true)
    const userTemplates = all.filter(t => t.preset !== true)
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

  goBack() { wx.navigateBack() }
})
