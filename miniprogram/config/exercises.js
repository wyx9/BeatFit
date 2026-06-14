// ===== 训练动作配置库 =====
// image: 动作展示图片路径，无图片则不写此字段

module.exports = {
  'back': [
    { name: '高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '引体向上',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: '/images/exercises/pull_up.png' },
    { name: '坐姿划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '杠铃划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/barbell_row.png' },
    { name: '硬拉',         tag: '复合', sets: 2, reps: 5,  duration_sec: 5, rest_sec: 5, image: '/images/exercises/deadlift.png' },
    { name: 'T杆划船',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 }
  ],
  'chest': [
    { name: '平板卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: '/images/exercises/bench_press.png' },
    { name: '哑铃飞鸟',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/dumbbell_fly.png' },
    { name: '上斜哑铃卧推', tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '双杠臂屈伸',   tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '蝴蝶机夹胸',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '俯卧撑',       tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 }
  ],
  'legs': [
    { name: '深蹲',         tag: '复合', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: '/images/exercises/squat.png' },
    { name: '箭步蹲',       tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '/images/exercises/lunge.png' },
    { name: '腿举',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '罗马尼亚硬拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '腿弯举',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '提踵',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 }
  ],
  'shoulder': [
    { name: '杠铃推举',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '哑铃侧平举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '阿诺德推举',   tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '面拉',         tag: '康复', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '前平举',       tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '俯身飞鸟',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 }
  ],
  'arms': [
    { name: '杠铃弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '绳索下压',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5 },
    { name: '锤式弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '窄距卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 },
    { name: '集中弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '臂屈伸',       tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5 }
  ],
  'core': [
    { name: '平板支撑',     tag: '耐力', sets: 2, reps: 1,  duration_sec: 5, rest_sec: 5 },
    { name: '卷腹',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '俄罗斯转体',   tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5 },
    { name: '悬垂举腿',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 },
    { name: '仰卧起坐',     tag: '耐力', sets: 2, reps: 25, duration_sec: 5, rest_sec: 5 },
    { name: '死虫式',       tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5 }
  ]
}
