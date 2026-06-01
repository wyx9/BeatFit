const api = require('../../utils/api')

// 动作预设库
const EXERCISE_PRESETS = {
  '胸': [
    { name:'俯卧撑', dur:60, icon:'💪' }, { name:'钻石俯卧撑', dur:40, icon:'💎' },
    { name:'宽距俯卧撑', dur:45, icon:'↔️' }, { name:'下斜俯卧撑', dur:40, icon:'📐' },
    { name:'上斜俯卧撑', dur:40, icon:'🔼' }, { name:'哑铃卧推', dur:45, icon:'🏋️' },
  ],
  '背': [
    { name:'高位下拉', dur:45, icon:'🔽' }, { name:'引体向上', dur:40, icon:'🧗' },
    { name:'哑铃划船', dur:45, icon:'🚣' }, { name:'俯身飞鸟', dur:40, icon:'🦅' },
    { name:'硬拉', dur:50, icon:'🏋️' }, { name:'超人式', dur:30, icon:'🦸' },
  ],
  '腿': [
    { name:'深蹲', dur:60, icon:'🦵' }, { name:'弓步蹲', dur:45, icon:'🚶' },
    { name:'臀桥', dur:45, icon:'🌉' }, { name:'跳跃深蹲', dur:40, icon:'⬆️' },
    { name:'靠墙静蹲', dur:60, icon:'🧱' }, { name:'相扑深蹲', dur:50, icon:'🤼' },
  ],
  '手臂': [
    { name:'弯举', dur:45, icon:'💪' }, { name:'锤式弯举', dur:40, icon:'🔨' },
    { name:'三头臂屈伸', dur:45, icon:'⬇️' }, { name:'集中弯举', dur:40, icon:'🎯' },
    { name:'腕弯举', dur:30, icon:'🤲' }, { name:'过顶臂屈伸', dur:45, icon:'🙆' },
  ],
  '核心': [
    { name:'平板支撑', dur:60, icon:'🪨' }, { name:'卷腹', dur:45, icon:'🔄' },
    { name:'俄罗斯转体', dur:40, icon:'💫' }, { name:'仰卧抬腿', dur:45, icon:'🦶' },
    { name:'登山者', dur:40, icon:'🏔️' }, { name:'侧平板', dur:30, icon:'↔️' },
  ],
}
const CATEGORIES = Object.keys(EXERCISE_PRESETS)

Page({
  data: {
    roomName: '',
    categories: CATEGORIES,
    currentCategory: CATEGORIES[0],
    presets: [],
    selectedPresets: {}
  },

  onLoad() {
    this.setData({ selectedPresets: {} })
    this.loadPresets()
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
    const { name, icon, dur } = e.currentTarget.dataset
    const selected = this.data.selectedPresets
    if (selected[name]) {
      delete selected[name]
    } else {
      selected[name] = { name, icon, dur: parseInt(dur) || 30 }
    }
    this.setData({ selectedPresets: selected })
  },

  onRemovePreset(e) {
    const name = e.currentTarget.dataset.name
    const selected = this.data.selectedPresets
    delete selected[name]
    this.setData({ selectedPresets: selected })
  },

  onCreate() {
    const name = this.data.roomName.trim()
    if (!name) {
      wx.showToast({ title: '请输入房间名称', icon: 'none' })
      return
    }

    const keys = Object.keys(this.data.selectedPresets)
    if (keys.length === 0) {
      wx.showToast({ title: '请至少选择一个动作', icon: 'none' })
      return
    }

    const exercises = keys.map(k => {
      const p = this.data.selectedPresets[k]
      return { name: p.name, duration_seconds: p.dur }
    })

    api.createRoom(name, exercises).then(room => {
      wx.redirectTo({ url: '/pages/room/room?code=' + room.code })
    }).catch(err => {
      wx.showToast({ title: err.error || '创建失败', icon: 'none' })
    })
  }
})
