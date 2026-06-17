// ===== 模板编辑页 =====
// 模式: 新建(无tplId) / 编辑(用户tplId) / 只读(preset_前缀tplId)

const exerciseUtils = require('../../utils/exercise-utils')
const EXERCISE_CONFIG = require('../../config/exercises')

// 部位名称映射
const PART_NAMES = {
  back: '背部', chest: '胸部', legs: '腿部',
  shoulder: '肩部', arms: '手臂', core: '核心'
}
const PART_KEYS = Object.keys(PART_NAMES)

Page({
  data: {
    statusBarHeight: 0,
    tplId: '',
    tplName: '',
    exercises: [],
    readonly: false,

    // 动作选择器弹窗
    showPicker: false,
    activePickerPart: 'back',
    pickerParts: [],       // [{ key, name }]
    pickerExercises: []    // 当前部位的动作列表
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sys.statusBarHeight,
      pickerParts: PART_KEYS.map(k => ({ key: k, name: PART_NAMES[k] }))
    })

    const tplId = options.tplId || ''
    if (tplId) {
      const tpl = exerciseUtils.getTemplateById(tplId)
      if (tpl) {
        const readonly = tpl.preset === true
        this.setData({
          tplId: tpl.id,
          tplName: tpl.name,
          exercises: tpl.exercises.map(ex => ({ ...ex })),
          readonly
        })
        return
      }
    }
    // 新建模式：空表单
    this.setData({ tplId: '', tplName: '', exercises: [], readonly: false })
  },

  // ===== 名称输入 =====
  onNameInput(e) {
    this.setData({ tplName: e.detail.value })
  },

  // ===== 参数编辑 =====
  onParamChange(e) {
    const { index, field } = e.currentTarget.dataset
    const value = parseInt(e.detail.value) || 0
    const exercises = [...this.data.exercises]
    exercises[index] = { ...exercises[index], [field]: value }
    this.setData({ exercises })
  },

  // ===== 删除动作 =====
  onRemoveExercise(e) {
    const index = e.currentTarget.dataset.index
    const exercises = [...this.data.exercises]
    exercises.splice(index, 1)
    this.setData({ exercises })
  },

  // ===== 动作选择器 =====
  onShowPicker() {
    this.setData({ showPicker: true })
    this.loadPickerExercises(this.data.activePickerPart)
  },

  onHidePicker() {
    this.setData({ showPicker: false })
  },

  onSwitchPickerPart(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ activePickerPart: key })
    this.loadPickerExercises(key)
  },

  loadPickerExercises(partKey) {
    const list = EXERCISE_CONFIG[partKey] || []
    this.setData({ pickerExercises: list })
  },

  onSelectExercise(e) {
    const name = e.currentTarget.dataset.name
    const partKey = this.data.activePickerPart
    const list = EXERCISE_CONFIG[partKey] || []
    const found = list.find(ex => ex.name === name)
    if (found) {
      const exercises = [...this.data.exercises, {
        name: found.name,
        tag: found.tag,
        sets: found.sets,
        reps: found.reps,
        duration_sec: found.duration_sec,
        rest_sec: found.rest_sec
      }]
      this.setData({ exercises, showPicker: false })
    }
  },

  // ===== 保存 =====
  onSave() {
    const name = this.data.tplName.trim()
    if (!name) {
      wx.showToast({ title: '请输入模板名称', icon: 'none' })
      return
    }
    if (this.data.exercises.length === 0) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' })
      return
    }

    const id = this.data.tplId || exerciseUtils.generateTplId()
    const template = {
      id,
      name,
      preset: false,
      exercises: this.data.exercises.map(ex => ({ ...ex }))
    }

    const templates = exerciseUtils.getUserTemplates()
    const idx = templates.findIndex(t => t.id === id)
    if (idx >= 0) {
      templates[idx] = template
    } else {
      templates.push(template)
    }

    if (exerciseUtils.saveUserTemplates(templates)) {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // ===== 另存为（只读模式） =====
  onSaveAs() {
    const name = this.data.tplName.trim()
    if (!name) {
      wx.showToast({ title: '请输入模板名称', icon: 'none' })
      return
    }
    if (this.data.exercises.length === 0) {
      wx.showToast({ title: '模板无动作', icon: 'none' })
      return
    }

    const newId = exerciseUtils.generateTplId()
    const template = {
      id: newId,
      name: name + '(副本)',
      preset: false,
      exercises: this.data.exercises.map(ex => ({ ...ex }))
    }

    const templates = exerciseUtils.getUserTemplates()
    templates.push(template)

    if (exerciseUtils.saveUserTemplates(templates)) {
      wx.showToast({ title: '已保存到我的模板', icon: 'success' })
      // 切换到编辑模式
      this.setData({ tplId: newId, readonly: false, tplName: template.name })
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // ===== 导航 =====
  goBack() { wx.navigateBack() }
})
