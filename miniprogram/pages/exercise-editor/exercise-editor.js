// ===== 模板编辑页 =====
// 模式: 新建(无tplId) / 编辑(用户tplId) / 只读(preset_前缀tplId)

const api = require('../../utils/api')
const exerciseUtils = require('../../utils/exercise-utils')
const EXERCISE_CONFIG = require('../../config/exercises')

// 部位名称映射
const PART_NAMES = {
  back: '背部', chest: '胸部', legs: '腿部',
  shoulder: '肩部', arms: '手臂', core: '核心'
}
const PART_EMOJI = {
  back: '🏋️', chest: '💪', legs: '🦵',
  shoulder: '🤸', arms: '🦾', core: '🎯'
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
    activePickerPartName: '背部',
    pickerParts: [],       // [{ key, name, icon }]
    pickerExercises: [],   // 当前显示的动作列表
    pickerSearch: '',      // 搜索关键词
    isSearching: false     // 是否处于搜索模式
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sys.statusBarHeight,
      pickerParts: PART_KEYS.map(k => ({ key: k, name: PART_NAMES[k], icon: PART_EMOJI[k] }))
    })

    const tplId = options.tplId || ''
    if (tplId) {
      const tpl = exerciseUtils.getTemplateById(tplId)
      if (tpl) {
        const readonly = tpl.preset === true
        this.setData({
          tplId: tpl.id,
          tplName: tpl.name,
          exercises: tpl.exercises.map(ex => api.resolveExerciseImage({ ...ex })),
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
    this.setData({ showPicker: true, pickerSearch: '', isSearching: false })
    this.loadPickerExercises(this.data.activePickerPart)
  },

  onHidePicker() {
    this.setData({ showPicker: false, pickerSearch: '', isSearching: false })
  },

  // 搜索输入 → 全库模糊匹配
  onPickerSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ pickerSearch: keyword, isSearching: keyword.length > 0 })

    if (!keyword) {
      // 清空搜索 → 恢复当前部位 Tab 视图
      this.loadPickerExercises(this.data.activePickerPart)
      return
    }

    // 遍历所有部位的动作，模糊匹配名称
    const addedNames = this.data.exercises.map(e => e.name)
    const results = []
    const lower = keyword.toLowerCase()
    PART_KEYS.forEach(partKey => {
      const list = EXERCISE_CONFIG[partKey] || []
      list.forEach(ex => {
        if (ex.name.toLowerCase().includes(lower)) {
          results.push({
            ...ex,
            image: ex.image ? api.getExerciseImageUrl(ex.image) : '',
            emoji: ex.emoji || PART_EMOJI[partKey] || '🏋️',
            _part: PART_NAMES[partKey] || partKey,
            _partKey: partKey,
            _added: addedNames.includes(ex.name)
          })
        }
      })
    })

    this.setData({
      activePickerPartName: '搜索结果',
      pickerExercises: results
    })
  },

  // 清空搜索
  onClearSearch() {
    this.setData({ pickerSearch: '', isSearching: false })
    this.loadPickerExercises(this.data.activePickerPart)
  },

  onSwitchPickerPart(e) {
    const key = e.currentTarget.dataset.key
    const name = PART_NAMES[key] || key
    this.setData({ activePickerPart: key, activePickerPartName: name })
    this.loadPickerExercises(key)
  },

  loadPickerExercises(partKey) {
    const addedNames = this.data.exercises.map(e => e.name)
    const list = (EXERCISE_CONFIG[partKey] || []).map(ex => ({
      ...ex,
      image: ex.image ? api.getExerciseImageUrl(ex.image) : '',
      emoji: ex.emoji || PART_EMOJI[partKey] || '🏋️',
      _added: addedNames.includes(ex.name)
    }))
    this.setData({ pickerExercises: list })
  },

  onSelectExercise(e) {
    const { name, partkey } = e.currentTarget.dataset
    // 搜索模式下用结果中的 _partKey，否则用当前 activePickerPart
    const partKey = partkey || this.data.activePickerPart
    const list = EXERCISE_CONFIG[partKey] || []
    const found = list.find(ex => ex.name === name)
    if (found) {
      const exercises = [...this.data.exercises, api.resolveExerciseImage({
        name: found.name,
        tag: found.tag,
        sets: found.sets,
        reps: found.reps,
        duration_sec: found.duration_sec,
        rest_sec: found.rest_sec,
        image: found.image
      })]
      this.setData({ exercises, showPicker: false, pickerSearch: '', isSearching: false })
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
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.redirectTo({ url: '/pages/lobby/lobby' })
    }
  },

  noop() {}
})
