const api = require('../../utils/api')
const EXERCISE_LIBRARY = require('../../config/exercises')
const exerciseUtils = require('../../utils/exercise-utils')
const features = require('../../config/features')

// 部位名称 & 图标映射
const PART_NAMES = {
  back: '背部', chest: '胸部', legs: '腿部',
  shoulder: '肩部', arms: '手臂', core: '核心'
}
const PART_EMOJI = {
  back: '🏋️', chest: '💪', legs: '🦵',
  shoulder: '🤸', arms: '🦾', core: '🎯'
}
const PART_KEYS = Object.keys(PART_NAMES)

// 从配置库取前两个动作作为默认展示
function buildDefaults(key) {
  const list = EXERCISE_LIBRARY[key] || []
  return list.slice(0, 2).map(ex => ({ ...ex }))
}

// 从配置库取动作完整默认值
function buildExercise(name, catKey) {
  const list = EXERCISE_LIBRARY[catKey] || []
  const found = list.find(ex => ex.name === name)
  return found ? { ...found } : { name: name, tag: '力量', sets: 4, reps: 12, duration_sec: 30, rest_sec: 60 }
}

Page({
  data: {
    statusBarHeight: 0,
    roomName: '',
    activePart: 'back',
    creating: false,

    // 分类数据（含默认动作）
    categories: [
      { key: 'back', name: '背部', icon: '🏋️', exercises: buildDefaults('back') },
      { key: 'chest', name: '胸部', icon: '💪', exercises: buildDefaults('chest') },
      { key: 'legs', name: '腿部', icon: '🦵', exercises: buildDefaults('legs') }
    ],

    // 弹窗状态
    showCategoryModal: false,
    showImportModal: false,
    newCategoryName: '',
    importTemplates: [],
    selectedTplId: '',

    // 动作选择器
    showPicker: false,
    activePickerPart: 'back',
    activePickerPartName: '背部',
    pickerParts: [],
    pickerExercises: [],
    pickerSearch: '',
    isSearching: false,

    // 功能开关
    ENABLE_ROOM_SETTINGS: features.ENABLE_ROOM_SETTINGS,

    // 计算属性
    filteredCategories: [],
    totalDuration: 0
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sys.statusBarHeight,
      pickerParts: PART_KEYS.map(k => ({ key: k, name: PART_NAMES[k], icon: PART_EMOJI[k] }))
    })
    this.refreshFiltered()
  },

  onRoomNameInput(e) { this.setData({ roomName: e.detail.value }) },

  switchPart(e) {
    this.setData({ activePart: e.currentTarget.dataset.part })
    this.refreshFiltered()
  },

  // 根据 activePart 筛选分类，并计算总时长
  refreshFiltered() {
    const { categories, activePart } = this.data
    const filtered = categories.filter(c => c.key === activePart)

    let total = 0
    categories.forEach(cat => {
      cat.exercises.forEach(ex => {
        total += (ex.sets || 0) * ((ex.duration_sec || 0) + (ex.rest_sec || 0))
      })
    })
    // 总时长从秒转为分钟显示
    const totalMin = Math.ceil(total / 60)

    this.setData({ filteredCategories: filtered, totalDuration: totalMin })
  },

  // ===== 添加分类 =====
  showAddCategory() { this.setData({ showCategoryModal: true, newCategoryName: '' }) },

  onCatNameInput(e) { this.setData({ newCategoryName: e.detail.value }) },

  confirmAddCategory() {
    const name = this.data.newCategoryName.trim()
    if (!name) { wx.showToast({ title: '请输入分类名', icon: 'none' }); return }
    const key = 'cat_' + Date.now()
    const cats = [...this.data.categories, { key, name, icon: '📋', exercises: [] }]
    this.setData({ categories: cats, showCategoryModal: false, newCategoryName: '' })
    this.refreshFiltered()
  },

  // ===== 动作选择器（复用 exercise-editor picker）=====
  onShowPicker() {
    this.setData({ showPicker: true, pickerSearch: '', isSearching: false })
    this.loadPickerExercises(this.data.activePickerPart)
  },

  onHidePicker() {
    this.setData({ showPicker: false, pickerSearch: '', isSearching: false })
  },

  onPickerSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ pickerSearch: keyword, isSearching: keyword.length > 0 })
    if (!keyword) {
      this.loadPickerExercises(this.data.activePickerPart)
      return
    }
    // 获取当前分类已添加的动作名
    const activeCat = this.data.categories.find(c => c.key === this.data.activePart)
    const addedNames = activeCat ? activeCat.exercises.map(ex => ex.name) : []
    const results = []
    const lower = keyword.toLowerCase()
    PART_KEYS.forEach(partKey => {
      const list = EXERCISE_LIBRARY[partKey] || []
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
    this.setData({ activePickerPartName: '搜索结果', pickerExercises: results })
  },

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
    // 获取当前分类已添加的动作名
    const activeCat = this.data.categories.find(c => c.key === this.data.activePart)
    const addedNames = activeCat ? activeCat.exercises.map(ex => ex.name) : []
    const list = (EXERCISE_LIBRARY[partKey] || []).map(ex => ({
      ...ex,
      image: ex.image ? api.getExerciseImageUrl(ex.image) : '',
      emoji: ex.emoji || PART_EMOJI[partKey] || '🏋️',
      _added: addedNames.includes(ex.name)
    }))
    this.setData({ pickerExercises: list })
  },

  onSelectPickerExercise(e) {
    const { name, partkey } = e.currentTarget.dataset
    const partKey = partkey || this.data.activePickerPart
    const lib = EXERCISE_LIBRARY[partKey] || []
    const found = lib.find(ex => ex.name === name)
    if (!found) { wx.showToast({ title: '动作未找到', icon: 'none' }); return }

    const activePart = this.data.activePart
    const categories = this.data.categories
    const catIdx = categories.findIndex(c => c.key === activePart)

    if (catIdx >= 0) {
      const exists = categories[catIdx].exercises.some(e => e.name === found.name)
      if (exists) {
        wx.showToast({ title: '该动作已存在', icon: 'none' })
        return
      }
      categories[catIdx] = {
        ...categories[catIdx],
        exercises: [...categories[catIdx].exercises, { ...found }]
      }
    } else {
      categories.push({
        key: activePart,
        name: PART_NAMES[activePart] || activePart,
        icon: PART_EMOJI[activePart] || '🏋️',
        exercises: [{ ...found }]
      })
    }

    this.setData({ categories, showPicker: false, pickerSearch: '', isSearching: false })
    this.refreshFiltered()
  },

  // ===== 移除动作 =====
  removeExercise(e) {
    const { cat, name } = e.currentTarget.dataset
    const newCats = this.data.categories.map(item => {
      if (item.key === cat) {
        return { ...item, exercises: item.exercises.filter(ex => ex.name !== name) }
      }
      return item
    })
    this.setData({ categories: newCats })
    this.refreshFiltered()
  },

  // ===== 导入模板 =====
  onShowImportModal() {
    const templates = exerciseUtils.getAllTemplates()
    this.setData({ showImportModal: true, importTemplates: templates, selectedTplId: '' })
  },

  onHideImportModal() {
    this.setData({ showImportModal: false })
  },

  onSelectImportTpl(e) {
    this.setData({ selectedTplId: e.currentTarget.dataset.id })
  },

  onConfirmImport() {
    const tplId = this.data.selectedTplId
    if (!tplId) {
      wx.showToast({ title: '请选择一个模板', icon: 'none' })
      return
    }
    const tpl = exerciseUtils.getTemplateById(tplId)
    if (!tpl || !tpl.exercises || tpl.exercises.length === 0) {
      wx.showToast({ title: '模板无效', icon: 'none' })
      return
    }

    // 用模板动作替换当前页签
    const activePart = this.data.activePart
    const categories = this.data.categories
    const catIdx = categories.findIndex(c => c.key === activePart)
    const cloned = tpl.exercises.map(ex => ({ ...ex }))

    if (catIdx >= 0) {
      categories[catIdx].exercises = cloned
    } else {
      // 当前页签不存在 → 新建分类
      categories.push({ key: activePart, name: PART_NAMES[activePart] || '自定义', icon: PART_EMOJI[activePart] || '📋', exercises: cloned })
    }

    this.setData({ categories, showImportModal: false })
    this.refreshFiltered()
    wx.showToast({ title: '已导入 ' + tpl.name, icon: 'success' })
  },

  // 计算模板总时长
  tplMinutes(tpl) {
    let sec = 0
    ;(tpl.exercises || []).forEach(ex => {
      sec += (ex.sets || 1) * ((ex.duration_sec || 0) + (ex.rest_sec || 0))
    })
    return Math.ceil(sec / 60)
  },

  // ===== 弹窗控制 =====
  hideModals() {
    this.setData({ showCategoryModal: false, showImportModal: false })
  },
  noop() {},

  // ===== 计算属性（通过 wxml 表达式实现） =====
  // filteredCategories: activePart === 'all' ? categories : categories.filter(c => c.key === activePart)
  // totalDuration: 所有动作 (sets * duration) 求和

  // ===== 创建房间 =====
  handleCreate() {
    const name = this.data.roomName.trim()
    if (!name) { wx.showToast({ title: '请输入房间名称', icon: 'none' }); return }

    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.redirectTo({ url: '/pages/splash/splash' }), 1000)
      return
    }

    // 只收集当前选中页签下已选择的动作
    const activeCat = this.data.categories.find(c => c.key === this.data.activePart)
    if (!activeCat || activeCat.exercises.length === 0) {
      wx.showToast({ title: '请先添加训练动作', icon: 'none' })
      return
    }
    const exercises = activeCat.exercises.map(ex => ({
      category: activeCat.name, name: ex.name, tag: ex.tag,
      sets: ex.sets, reps: ex.reps, duration_sec: ex.duration_sec, rest_sec: ex.rest_sec,
        image: ex.image
    }))

    this.setData({ creating: true })
    wx.showLoading({ title: '创建中...' })

    api.createRoom(name, 20, exercises).then((data) => {
      wx.hideLoading()
      this.setData({ creating: false })
      const app = getApp()
      app.globalData = app.globalData || {}
      app.globalData.currentRoom = data.room
      app.globalData.roomExercises = exercises
      wx.redirectTo({ url: '/pages/room-waiting/room-waiting' })
    }).catch((err) => {
      wx.hideLoading()
      this.setData({ creating: false })
      // 显示具体错误，不做离线兜底（房间必须走服务器）
      wx.showModal({
        title: '创建失败',
        content: err.message || '服务器未响应',
        showCancel: false
      })
    })
  },

  goBack() { wx.navigateBack() }
})
