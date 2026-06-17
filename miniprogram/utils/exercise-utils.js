// ===== 训练动作模板工具模块 =====
// 供模板管理页、编辑页、创建房间导入弹窗共用

const EXERCISE_CONFIG = require('../config/exercises')

const STORAGE_KEY = 'exercise_templates'

// 合并系统预设 + 用户自定义模板
function getAllTemplates() {
  const presets = EXERCISE_CONFIG.PRESET_TEMPLATES || []
  const user = getUserTemplates()
  return [...presets, ...user]
}

// 从 Storage 读取用户自定义模板
function getUserTemplates() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

// 写入 Storage（全量覆盖）
function saveUserTemplates(arr) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(arr))
    return true
  } catch (e) {
    return false
  }
}

// 按 id 删除单个用户模板
function deleteUserTemplate(id) {
  const templates = getUserTemplates()
  const filtered = templates.filter(t => t.id !== id)
  return saveUserTemplates(filtered)
}

// 按 id 查找模板（先查预设，再查用户）
function getTemplateById(id) {
  const all = getAllTemplates()
  return all.find(t => t.id === id) || null
}

// 生成唯一模板 ID
function generateTplId() {
  return 'tpl_' + Date.now()
}

module.exports = {
  getAllTemplates,
  getUserTemplates,
  saveUserTemplates,
  deleteUserTemplate,
  getTemplateById,
  generateTplId
}
