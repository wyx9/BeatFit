const api = require('../../utils/api')

// 动作预设库（默认：5组、8次、6s/组、20s休息）
const EXERCISE_PRESETS = {
  '胸': [
    { name:'俯卧撑', sets:5, reps:8, dur:6, rest:20, icon:'💪' },
    { name:'钻石俯卧撑', sets:5, reps:8, dur:6, rest:20, icon:'💎' },
    { name:'宽距俯卧撑', sets:5, reps:8, dur:6, rest:20, icon:'↔️' },
    { name:'下斜俯卧撑', sets:5, reps:8, dur:6, rest:20, icon:'📐' },
    { name:'上斜俯卧撑', sets:5, reps:8, dur:6, rest:20, icon:'🔼' },
    { name:'哑铃卧推', sets:5, reps:8, dur:6, rest:20, icon:'🏋️' },
  ],
  '背': [
    { name:'高位下拉', sets:5, reps:8, dur:6, rest:20, icon:'🔽' },
    { name:'引体向上', sets:5, reps:8, dur:6, rest:20, icon:'🧗' },
    { name:'哑铃划船', sets:5, reps:8, dur:6, rest:20, icon:'🚣' },
    { name:'俯身飞鸟', sets:5, reps:8, dur:6, rest:20, icon:'🦅' },
    { name:'硬拉', sets:5, reps:8, dur:6, rest:20, icon:'🏋️' },
    { name:'超人式', sets:5, reps:8, dur:6, rest:20, icon:'🦸' },
  ],
  '腿': [
    { name:'深蹲', sets:5, reps:8, dur:6, rest:20, icon:'🦵' },
    { name:'弓步蹲', sets:5, reps:8, dur:6, rest:20, icon:'🚶' },
    { name:'臀桥', sets:5, reps:8, dur:6, rest:20, icon:'🌉' },
    { name:'跳跃深蹲', sets:5, reps:8, dur:6, rest:20, icon:'⬆️' },
    { name:'靠墙静蹲', sets:5, reps:8, dur:6, rest:20, icon:'🧱' },
    { name:'相扑深蹲', sets:5, reps:8, dur:6, rest:20, icon:'🤼' },
  ],
  '手臂': [
    { name:'弯举', sets:5, reps:8, dur:6, rest:20, icon:'💪' },
    { name:'锤式弯举', sets:5, reps:8, dur:6, rest:20, icon:'🔨' },
    { name:'三头臂屈伸', sets:5, reps:8, dur:6, rest:20, icon:'⬇️' },
    { name:'集中弯举', sets:5, reps:8, dur:6, rest:20, icon:'🎯' },
    { name:'腕弯举', sets:5, reps:8, dur:6, rest:20, icon:'🤲' },
    { name:'过顶臂屈伸', sets:5, reps:8, dur:6, rest:20, icon:'🙆' },
  ],
  '核心': [
    { name:'平板支撑', sets:5, reps:8, dur:6, rest:20, icon:'🪨' },
    { name:'卷腹', sets:5, reps:8, dur:6, rest:20, icon:'🔄' },
    { name:'俄罗斯转体', sets:5, reps:8, dur:6, rest:20, icon:'💫' },
    { name:'仰卧抬腿', sets:5, reps:8, dur:6, rest:20, icon:'🦶' },
    { name:'登山者', sets:5, reps:8, dur:6, rest:20, icon:'🏔️' },
    { name:'侧平板', sets:5, reps:8, dur:6, rest:20, icon:'↔️' },
  ],
}
const CATEGORIES = Object.keys(EXERCISE_PRESETS)

Page({
  data: {
    roomName: '',
    categories: CATEGORIES,
    currentCategory: CATEGORIES[0],
    presets: [],
    selectedPresets: {},
    customName: '',
    customSets: 5,
    customReps: 8,
    customDur: 6,
    customRest: 20,
    selectedList: []   // selectedPresets 的数组形式，供 WXML 遍历
  },

  // 将 selectedPresets 对象同步为数组
  syncList() {
    var arr = [];
    var obj = this.data.selectedPresets;
    for (var k in obj) { arr.push(obj[k]); }
    this.setData({ selectedList: arr });
  },

  onLoad() {
    this.setData({ selectedPresets: {}, selectedList: [] })
    this.loadPresets()
  },

  showHome() {
    wx.navigateBack()
  },

  loadPresets() {
    this.setData({ presets: EXERCISE_PRESETS[this.data.currentCategory] || [] })
  },

  onInputRoomName(e) {
    this.setData({ roomName: e.detail.value })
  },

  onSwitchCategory(e) {
    const cat = e.currentTarget.dataset.cat
    this.setData({ currentCategory: cat })
    this.loadPresets()
  },

  onTogglePreset(e) {
    const { name, icon, sets, reps, dur, rest } = e.currentTarget.dataset
    const selected = this.data.selectedPresets
    if (selected[name]) {
      delete selected[name]
    } else {
      selected[name] = { name, icon, sets: parseInt(sets)||5, reps: parseInt(reps)||8, dur: parseInt(dur)||6, rest: parseInt(rest)||20 }
    }
    this.setData({ selectedPresets: selected }); this.syncList();
  },

  onRemovePreset(e) {
    const name = e.currentTarget.dataset.name
    const selected = this.data.selectedPresets
    delete selected[name]
    this.setData({ selectedPresets: selected }); this.syncList();
  },

  // 编辑已选动作的字段
  onEditPreset(e) {
    const { name, field } = e.currentTarget.dataset
    const val = parseInt(e.detail.value) || 1
    const selected = this.data.selectedPresets
    if (selected[name]) {
      selected[name][field] = val
      this.setData({ selectedPresets: selected }); this.syncList();
    }
  },

  // 输入自定义动作字段
  onCustomInput(e) {
    const { field } = e.currentTarget.dataset
    const val = e.detail.value
    this.setData({ [field]: field.includes('Name') ? val : (parseInt(val) || 0) })
  },

  // 添加自定义动作
  onAddCustom() {
    const name = this.data.customName.trim()
    if (!name) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return }
    const selected = this.data.selectedPresets
    selected[name] = {
      name, icon: '✏️',
      sets: this.data.customSets || 5,
      reps: this.data.customReps || 8,
      dur: this.data.customDur || 6,
      rest: this.data.customRest || 20
    }
    this.setData({
      selectedPresets: selected,
      customName: '', customSets: 5, customReps: 8, customDur: 6, customRest: 20
    }); this.syncList();
  },

  onCreate() {
    var name = this.data.roomName.trim()
    if (!name) {
      wx.showToast({ title: '请输入房间名称', icon: 'none' })
      return
    }

    var list = this.data.selectedList
    if (list.length === 0) {
      wx.showToast({ title: '请至少选择一个动作', icon: 'none' })
      return
    }

    var exercises = list.map(function(p) {
      return { name: p.name, sets: p.sets, reps: p.reps, duration_seconds: p.dur, rest_seconds: p.rest }
    })

    api.createRoom(name, exercises).then(room => {
      wx.redirectTo({ url: '/pages/room/room?code=' + room.code })
    }).catch(err => {
      wx.showToast({ title: err.error || '创建失败', icon: 'none' })
    })
  }
})
