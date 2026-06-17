const api = require('../../utils/api')
const EXERCISE_LIBRARY = require('../../config/exercises')
const exerciseUtils = require('../../utils/exercise-utils')

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
      { key: 'back', name: '背部', exercises: buildDefaults('back') },
      { key: 'chest', name: '胸部', exercises: buildDefaults('chest') },
      { key: 'legs', name: '腿部', exercises: buildDefaults('legs') }
    ],

    // 弹窗状态
    showCategoryModal: false,
    showExerciseModal: false,
    showImportModal: false,
    newCategoryName: '',
    addingToCategory: '',
    addingExercise: '',
    previewImage: '',
    availableExercises: [],
    importTemplates: [],
    selectedTplId: '',

    // 计算属性
    filteredCategories: [],
    totalDuration: 0
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight })
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
    const cats = [...this.data.categories, { key, name, exercises: [] }]
    this.setData({ categories: cats, showCategoryModal: false, newCategoryName: '' })
    this.refreshFiltered()
  },

  // ===== 添加动作 =====
  showAddExercise(e) {
    const cat = e.currentTarget.dataset.cat
    const lib = EXERCISE_LIBRARY[cat] || EXERCISE_LIBRARY['core']
    this.setData({
      showExerciseModal: true,
      addingToCategory: cat,
      addingExercise: lib[0] ? lib[0].name : '',
      previewImage: lib[0] && lib[0].image ? lib[0].image : '',
      availableExercises: lib
    })
  },

  selectExercise(e) {
    const name = e.currentTarget.dataset.name
    const lib = EXERCISE_LIBRARY[this.data.addingToCategory] || []
    const ex = lib.find(item => item.name === name)
    this.setData({
      addingExercise: name,
      previewImage: ex && ex.image ? ex.image : ''
    })
  },

  confirmAddExercise() {
    const { categories, addingToCategory, addingExercise } = this.data
    const lib = EXERCISE_LIBRARY[addingToCategory] || []
    const ex = lib.find(item => item.name === addingExercise)
    if (!ex) { wx.showToast({ title: '请选择动作', icon: 'none' }); return }

    const newCats = categories.map(cat => {
      if (cat.key === addingToCategory) {
        const exists = cat.exercises.some(e => e.name === ex.name)
        if (exists) {
          wx.showToast({ title: '该动作已存在', icon: 'none' })
          return cat
        }
        return {
          ...cat,
          exercises: [...cat.exercises, buildExercise(ex.name, cat.key)]
        }
      }
      return cat
    })

    this.setData({
      categories: newCats,
      showExerciseModal: false,
      addingExercise: ''
    })
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
      const partNames = { back: '背部', chest: '胸部', legs: '腿部', shoulder: '肩部', arms: '手臂', core: '核心' }
      categories.push({ key: activePart, name: partNames[activePart] || '自定义', exercises: cloned })
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
    this.setData({ showCategoryModal: false, showExerciseModal: false, showImportModal: false })
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
      sets: ex.sets, reps: ex.reps, duration_sec: ex.duration_sec, rest_sec: ex.rest_sec
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
