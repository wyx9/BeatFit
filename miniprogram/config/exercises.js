// ===== 训练动作配置库 (102个动作, 6部位×17) =====
// image: 动作展示图片路径，无图片则不写此字段

// ===== 系统预设模板 =====
const PRESET_TEMPLATES = [
  {
    id: 'preset_full_body',
    name: '全身燃脂入门',
    preset: true,
    exercises: [
      { name: '深蹲',         tag: '复合', sets: 2, reps: 8,  duration_sec: 30, rest_sec: 60 },
      { name: '平板卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 30, rest_sec: 60 },
      { name: '高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 30, rest_sec: 60 },
      { name: '卷腹',         tag: '塑形', sets: 2, reps: 20, duration_sec: 30, rest_sec: 30 }
    ]
  },
  {
    id: 'preset_back_power',
    name: '背部力量突破',
    preset: true,
    exercises: [
      { name: '引体向上',     tag: '力量', sets: 3, reps: 10, duration_sec: 30, rest_sec: 90 },
      { name: '杠铃划船',     tag: '力量', sets: 3, reps: 12, duration_sec: 30, rest_sec: 60 },
      { name: '硬拉',         tag: '复合', sets: 3, reps: 5,  duration_sec: 30, rest_sec: 90 }
    ]
  },
  {
    id: 'preset_tan_back',
    name: '谭成义背部训练',
    preset: true,
    exercises: [
      { name: '反手高位下拉',     tag: '力量', sets: 4, reps: 12, duration_sec: 40, rest_sec: 60, tips: '身体保持中立，下落时不要后仰，向上时身体稍前倾，缓慢控制感受背阔肌拉伸。' },
      { name: '坐姿绳索划船',     tag: '力量', sets: 4, reps: 12, duration_sec: 40, rest_sec: 60, tips: '脚蹬紧踏板，保持骨盆和身体稳定，后拉时身体不要后仰，感受背阔肌收缩。' },
      { name: '中距对握高位下拉', tag: '力量', sets: 4, reps: 10, duration_sec: 40, rest_sec: 60, tips: '身体保持中立，感受肩胛骨上回旋，核心收紧，挺胸，不要低头或仰头。' },
      { name: '中距对握划船',     tag: '力量', sets: 4, reps: 12, duration_sec: 40, rest_sec: 60, tips: '以肩胛后缩为主，手肘打开向后运动，缓慢控制感受中背部发力。' },
      { name: '直立下压',         tag: '力量', sets: 3, reps: 12, duration_sec: 40, rest_sec: 60, tips: '采用1.5倍肩宽握距，核心收紧，背部优先发力，不要过度含胸或挺胸。' }
    ]
  }
]

// ===== 动作库 (按部位分类) =====
const EXERCISE_LIBRARY = {
  // ========== 背部 (17个) ==========
  'back': [
    // --- 原有 ---
    { name: '高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '引体向上',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: '/images/exercises/pull_up.webp' },
    { name: '坐姿划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '杠铃划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/barbell_row.webp' },
    { name: '硬拉',         tag: '复合', sets: 2, reps: 5,  duration_sec: 5, rest_sec: 5, image: '/images/exercises/deadlift.webp' },
    { name: 'T杆划船',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '哑铃单臂划船', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '窄距下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃耸肩',     tag: '力量', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '山羊挺身',     tag: '康复', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '潘德雷划船',   tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5 },
    { name: '反握引体向上', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '直臂下压',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '宽距高位下拉', tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '悍马机划船',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '杠铃耸肩',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '对握下拉',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '反手高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '坐姿绳索划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '中距对握高位下拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '中距对握划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '直立下压',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 }
  ],

  // ========== 胸部 (17个) ==========
  'chest': [
    // --- 原有 ---
    { name: '平板卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: '/images/exercises/bench_press.webp' },
    { name: '哑铃飞鸟',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/dumbbell_fly.webp' },
    { name: '上斜哑铃卧推', tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '双杠臂屈伸',   tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '蝴蝶机夹胸',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '俯卧撑',       tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '上斜杠铃卧推', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '下斜卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '高位绳索夹胸', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '窄距俯卧撑',   tag: '耐力', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '斯万夹胸',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃仰卧直臂上拉', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '器械推胸',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '低位绳索夹胸', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '跪姿俯卧撑',   tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '垫高俯卧撑',   tag: '耐力', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 }
  ],

  // ========== 腿部 (17个) ==========
  'legs': [
    // --- 原有 ---
    { name: '深蹲',         tag: '复合', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: '/images/exercises/squat.webp' },
    { name: '箭步蹲',       tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/lunge.webp' },
    { name: '腿举',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '罗马尼亚硬拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '腿弯举',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '提踵',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '保加利亚分腿蹲', tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '腿屈伸',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '俯卧腿弯举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '臀推',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '哈克深蹲',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '站姿提踵',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '早安式',       tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃酒杯深蹲', tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '直腿硬拉',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '侧弓步',       tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '坐姿提踵',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 }
  ],

  // ========== 肩部 (17个) ==========
  'shoulder': [
    // --- 原有 ---
    { name: '杠铃推举',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃侧平举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '阿诺德推举',   tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '面拉',         tag: '康复', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '前平举',       tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '俯身飞鸟',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '坐姿哑铃推举', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '杠铃提拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '蝴蝶机反向飞鸟', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '绳索侧平举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '实力推举',     tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5 },
    { name: '哑铃交替前平举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '壶铃推举',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃古巴推举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: 'Y字抬臂',      tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '借力推举',     tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5 },
    { name: '俯身杠铃提拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 }
  ],

  // ========== 手臂 (17个) ==========
  'arms': [
    // --- 原有 ---
    { name: '杠铃弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '绳索下压',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '锤式弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '窄距卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '集中弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '臂屈伸',       tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '牧师凳弯举',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '仰卧臂屈伸',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '颈后臂屈伸',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '上斜哑铃弯举', tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '反握弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '绳索锤式弯举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '俯身臂屈伸',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '佐特曼弯举',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '腕弯举',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '绳索弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 }
  ],

  // ========== 核心 (17个) ==========
  'core': [
    // --- 原有 ---
    { name: '平板支撑',     tag: '耐力', sets: 2, reps: 1,  duration_sec: 5, rest_sec: 5 },
    { name: '卷腹',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '俄罗斯转体',   tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '悬垂举腿',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '仰卧起坐',     tag: '耐力', sets: 2, reps: 25, duration_sec: 5, rest_sec: 5 },
    { name: '死虫式',       tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    // --- 新增 ---
    { name: '仰卧举腿',     tag: '力量', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '侧平板支撑',   tag: '耐力', sets: 2, reps: 1,  duration_sec: 5, rest_sec: 5 },
    { name: 'V字卷腹',      tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '登山者',       tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '瑜伽球卷腹',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '鸟狗式',       tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '健腹轮',       tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '反向卷腹',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '交叉卷腹',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '仰卧交替抬腿', tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '平板支撑转体', tag: '耐力', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 }
  ]
}

module.exports = Object.assign(EXERCISE_LIBRARY, { PRESET_TEMPLATES })
