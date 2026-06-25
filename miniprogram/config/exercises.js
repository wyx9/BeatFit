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
  // ========== 背部 (22个) ==========
  'back': [
    // --- 原有 ---
    { name: '高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: '高位下拉.png' },
    { name: '引体向上',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'back_pull_up.webp' },
    { name: '坐姿划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_seated_row.webp' },
    { name: '杠铃划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_barbell_row.webp' },
    { name: '硬拉',         tag: '复合', sets: 2, reps: 5,  duration_sec: 5, rest_sec: 5, image: 'back_deadlift.webp' },
    { name: 'T杆划船',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'back_t_bar_row.webp' },
    // --- 新增 ---
    { name: '哑铃单臂划船', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'back_dumbbell_one_arm_row.webp' },
    { name: '窄距下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_close_grip_pulldown.webp' },
    { name: '哑铃耸肩',     tag: '力量', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'back_dumbbell_shrug.webp' },
    { name: '山羊挺身',     tag: '康复', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'back_hyperextension.webp' },
    { name: '潘德雷划船',   tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: 'back_pendlay_row.webp' },
    { name: '反握引体向上', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'back_reverse_grip_pull_up.webp' },
    { name: '直臂下压',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'back_straight_arm_pulldown.webp' },
    { name: '宽距高位下拉', tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_wide_grip_pulldown.webp' },
    { name: '悍马机划船',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_hammer_strength_row.webp' },
    { name: '杠铃耸肩',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_barbell_shrug.webp' },
    { name: '对握下拉',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_neutral_grip_pulldown.webp' },
    { name: '反手高位下拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_reverse_grip_pulldown.webp' },
    { name: '坐姿绳索划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_seated_cable_row.webp' },
    { name: '中距对握高位下拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'back_medium_neutral_grip_pulldown.webp' },
    { name: '中距对握划船',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_medium_neutral_grip_row.webp' },
    { name: '直立下压',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'back_straight_arm_pushdown.webp' }
  ],

  // ========== 胸部 (17个) ==========
  'chest': [
    // --- 原有 ---
    { name: '平板卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'chest_bench_press.webp' },
    { name: '哑铃飞鸟',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'chest_dumbbell_fly.webp' },
    { name: '上斜哑铃卧推', tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'chest_incline_dumbbell_press.webp' },
    { name: '双杠臂屈伸',   tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'chest_dips.webp' },
    { name: '蝴蝶机夹胸',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_pec_deck.webp' },
    { name: '俯卧撑',       tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'chest_push_up.webp' },
    // --- 新增 ---
    { name: '上斜杠铃卧推', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'chest_incline_barbell_press.webp' },
    { name: '下斜卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'chest_decline_press.webp' },
    { name: '哑铃卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'chest_dumbbell_press.webp' },
    { name: '高位绳索夹胸', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_high_cable_fly.webp' },
    { name: '窄距俯卧撑',   tag: '耐力', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_close_grip_push_up.webp' },
    { name: '斯万夹胸',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_svend_press.webp' },
    { name: '哑铃仰卧直臂上拉', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'chest_dumbbell_pullover.webp' },
    { name: '器械推胸',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'chest_machine_chest_press.webp' },
    { name: '低位绳索夹胸', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_low_cable_fly.webp' },
    { name: '跪姿俯卧撑',   tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'chest_kneeling_push_up.webp' },
    { name: '垫高俯卧撑',   tag: '耐力', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'chest_decline_push_up.webp' }
  ],

  // ========== 腿部 (17个) ==========
  'legs': [
    // --- 原有 ---
    { name: '深蹲',         tag: '复合', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: 'legs_squat.webp' },
    { name: '箭步蹲',       tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_lunge.webp' },
    { name: '腿举',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_leg_press.webp' },
    { name: '罗马尼亚硬拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'legs_romanian_deadlift.webp' },
    { name: '腿弯举',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'legs_leg_curl.webp' },
    { name: '提踵',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'legs_calf_raise.webp' },
    // --- 新增 ---
    { name: '保加利亚分腿蹲', tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_bulgarian_split_squat.webp' },
    { name: '腿屈伸',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'legs_leg_extension.webp' },
    { name: '俯卧腿弯举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'legs_lying_leg_curl.webp' },
    { name: '臀推',         tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_hip_thrust.webp' },
    { name: '哈克深蹲',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'legs_hack_squat.webp' },
    { name: '站姿提踵',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'legs_standing_calf_raise.webp' },
    { name: '早安式',       tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_good_morning.webp' },
    { name: '哑铃酒杯深蹲', tag: '复合', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_goblet_squat.webp' },
    { name: '直腿硬拉',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'legs_stiff_leg_deadlift.webp' },
    { name: '侧弓步',       tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'legs_side_lunge.webp' },
    { name: '坐姿提踵',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'legs_seated_calf_raise.webp' }
  ],

  // ========== 肩部 (17个) ==========
  'shoulder': [
    // --- 原有 ---
    { name: '杠铃推举',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'shoulder_barbell_press.webp' },
    { name: '哑铃侧平举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: '侧平举.png' },
    { name: '阿诺德推举',   tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_arnold_press.webp' },
    { name: '面拉',         tag: '康复', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'shoulder_face_pull.webp' },
    { name: '前平举',       tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_front_raise.webp' },
    { name: '俯身飞鸟',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'shoulder_bent_over_fly.webp' },
    // --- 新增 ---
    { name: '坐姿哑铃推举', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'shoulder_seated_dumbbell_press.webp' },
    { name: '杠铃提拉',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_barbell_upright_row.webp' },
    { name: '蝴蝶机反向飞鸟', tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'shoulder_reverse_pec_deck.webp' },
    { name: '绳索侧平举',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'shoulder_cable_lateral_raise.webp' },
    { name: '实力推举',     tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: 'shoulder_strict_press.webp' },
    { name: '哑铃交替前平举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_alternating_front_raise.webp' },
    { name: '壶铃推举',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'shoulder_kettlebell_press.webp' },
    { name: '哑铃古巴推举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_cuban_press.webp' },
    { name: 'Y字抬臂',      tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'shoulder_y_raise.webp' },
    { name: '借力推举',     tag: '力量', sets: 2, reps: 8,  duration_sec: 5, rest_sec: 5, image: 'shoulder_push_press.webp' },
    { name: '俯身杠铃提拉', tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'shoulder_bent_over_barbell_row.webp' }
  ],

  // ========== 手臂 (17个) ==========
  'arms': [
    // --- 原有 ---
    { name: '杠铃弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_barbell_curl.webp' },
    { name: '绳索下压',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'arms_tricep_pushdown.webp' },
    { name: '锤式弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_hammer_curl.webp' },
    { name: '窄距卧推',     tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'arms_close_grip_bench_press.webp' },
    { name: '集中弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_concentration_curl.webp' },
    { name: '臂屈伸',       tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'arms_tricep_dip.webp' },
    // --- 新增 ---
    { name: '牧师凳弯举',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_preacher_curl.webp' },
    { name: '仰卧臂屈伸',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_lying_tricep_extension.webp' },
    { name: '哑铃弯举',     tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_dumbbell_curl.webp' },
    { name: '颈后臂屈伸',   tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_overhead_tricep_extension.webp' },
    { name: '上斜哑铃弯举', tag: '肥大', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_incline_dumbbell_curl.webp' },
    { name: '反握弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_reverse_curl.webp' },
    { name: '绳索锤式弯举', tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_cable_hammer_curl.webp' },
    { name: '俯身臂屈伸',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_bent_over_tricep_extension.webp' },
    { name: '佐特曼弯举',   tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_zottman_curl.webp' },
    { name: '腕弯举',       tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'arms_wrist_curl.webp' },
    { name: '绳索弯举',     tag: '塑形', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'arms_cable_curl.webp' }
  ],

  // ========== 核心 (17个) ==========
  'core': [
    // --- 原有 ---
    { name: '平板支撑',     tag: '耐力', sets: 2, reps: 1,  duration_sec: 5, rest_sec: 5, image: 'core_plank.webp' },
    { name: '卷腹',         tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'core_crunch.webp' },
    { name: '俄罗斯转体',   tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'core_russian_twist.webp' },
    { name: '悬垂举腿',     tag: '力量', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'core_hanging_leg_raise.webp' },
    { name: '仰卧起坐',     tag: '耐力', sets: 2, reps: 25, duration_sec: 5, rest_sec: 5, image: 'core_sit_up.webp' },
    { name: '死虫式',       tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'core_dead_bug.webp' },
    // --- 新增 ---
    { name: '仰卧举腿',     tag: '力量', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'core_lying_leg_raise.webp' },
    { name: '侧平板支撑',   tag: '耐力', sets: 2, reps: 1,  duration_sec: 5, rest_sec: 5, image: 'core_side_plank.webp' },
    { name: 'V字卷腹',      tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'core_v_up.webp' },
    { name: '登山者',       tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'core_mountain_climber.webp' },
    { name: '瑜伽球卷腹',   tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'core_swiss_ball_crunch.webp' },
    { name: '鸟狗式',       tag: '康复', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'core_bird_dog.webp' },
    { name: '健腹轮',       tag: '力量', sets: 2, reps: 10, duration_sec: 5, rest_sec: 5, image: 'core_ab_wheel.webp' },
    { name: '反向卷腹',     tag: '塑形', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'core_reverse_crunch.webp' },
    { name: '交叉卷腹',     tag: '塑形', sets: 2, reps: 15, duration_sec: 5, rest_sec: 5, image: 'core_cross_body_crunch.webp' },
    { name: '仰卧交替抬腿', tag: '耐力', sets: 2, reps: 20, duration_sec: 5, rest_sec: 5, image: 'core_alternating_leg_raise.webp' },
    { name: '平板支撑转体', tag: '耐力', sets: 2, reps: 12, duration_sec: 5, rest_sec: 5, image: 'core_plank_twist.webp' }
  ]
}

module.exports = Object.assign(EXERCISE_LIBRARY, { PRESET_TEMPLATES })
