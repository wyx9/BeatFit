# 动作图片远程加载方案

> 日期: 2026-06-25 | 状态: 待审批

---

## 1. 背景与动机

动作库共 102 个动作，目前仅 7 个有本地图片（存储在 `miniprogram/images/exercises/` 目录）。需要为全部动作补充线稿图，并解决微信小程序 2MB 主包限制问题。

**核心决策：**
- 图片统一存放于 Go 后端，通过静态文件服务提供
- 前后端通过英文 slug 文件名关联，不依赖序号/索引
- 维护模型：`exercises.js` 的 `image` 字段 = 文件名，服务器目录 = 同名文件，一一对应

---

## 2. 架构设计

```
exercises.js                    server/static/exercises/
┌─────────────────────┐         ┌──────────────────────────┐
│ image: 'back_lat_   │         │ back_lat_pulldown.webp   │
│         pulldown.   │──── 1:1 ────▶                      │
│         webp'        │         │ back_barbell_row.webp    │
│                      │         │ chest_bench_press.webp   │
│ image: 'chest_       │         │ ... (102 files)          │
│         dumbbell_    │         └──────────────────────────┘
│         fly.webp'    │                    │
└─────────────────────┘                    │
        │                                  │
        │ api.getExerciseImageUrl()        │
        │ getBaseUrl() + '/static/         │
        │   exercises/' + filename         │
        ▼                                  ▼
   http://192.168.1.23:8080/static/exercises/back_lat_pulldown.webp
```

**数据流：**
1. 前端 `exercises.js` 中 `image` 字段存储文件名（如 `back_lat_pulldown.webp`）
2. 各页面加载动作时，调用 `api.getExerciseImageUrl(filename)` 拼接完整 URL
3. 微信小程序通过 HTTP 请求后端静态文件服务获取图片
4. 图片加载失败 → WXML `binderror` → 显示占位图（现有逻辑已支持）

---

## 3. 后端改动

### 3.1 静态文件路由

[server/main.go](server/main.go) 路由组中添加一行：

```go
// 动作图片静态文件服务（公开访问，无需鉴权）
r.Static("/static/exercises", "./static/exercises")
```

- **路径：** `/static/exercises/<filename>.webp`
- **目录：** `server/static/exercises/`
- **鉴权：** 公开访问（动作图片无敏感信息，无需 Token）
- **放置位置：** 在 Gin 路由中放在公开接口区域（`r.GET("/health", ...)` 附近）

### 3.2 目录结构

```
server/
├── static/
│   └── exercises/
│       ├── back_lat_pulldown.webp
│       ├── back_pull_up.webp
│       ├── back_seated_row.webp
│       ├── back_barbell_row.webp
│       ├── back_deadlift.webp
│       ├── back_t_bar_row.webp
│       ├── back_dumbbell_one_arm_row.webp
│       ├── back_close_grip_pulldown.webp
│       ├── back_dumbbell_shrug.webp
│       ├── back_hyperextension.webp
│       ├── back_pendlay_row.webp
│       ├── back_reverse_grip_pull_up.webp
│       ├── back_straight_arm_pulldown.webp
│       ├── back_wide_grip_pulldown.webp
│       ├── back_hammer_strength_row.webp
│       ├── back_barbell_shrug.webp
│       ├── back_neutral_grip_pulldown.webp
│       ├── back_reverse_grip_pulldown.webp
│       ├── back_seated_cable_row.webp
│       ├── back_medium_neutral_grip_pulldown.webp
│       ├── back_medium_neutral_grip_row.webp
│       ├── back_straight_arm_pushdown.webp
│       ├── chest_bench_press.webp
│       ├── chest_dumbbell_fly.webp
│       ├── chest_incline_dumbbell_press.webp
│       ├── chest_dips.webp
│       ├── chest_pec_deck.webp
│       ├── chest_push_up.webp
│       ├── chest_incline_barbell_press.webp
│       ├── chest_decline_press.webp
│       ├── chest_dumbbell_press.webp
│       ├── chest_high_cable_fly.webp
│       ├── chest_close_grip_push_up.webp
│       ├── chest_svend_press.webp
│       ├── chest_dumbbell_pullover.webp
│       ├── chest_machine_chest_press.webp
│       ├── chest_low_cable_fly.webp
│       ├── chest_kneeling_push_up.webp
│       ├── chest_decline_push_up.webp
│       ├── legs_squat.webp
│       ├── legs_lunge.webp
│       ├── legs_leg_press.webp
│       ├── legs_romanian_deadlift.webp
│       ├── legs_leg_curl.webp
│       ├── legs_calf_raise.webp
│       ├── legs_bulgarian_split_squat.webp
│       ├── legs_leg_extension.webp
│       ├── legs_lying_leg_curl.webp
│       ├── legs_hip_thrust.webp
│       ├── legs_hack_squat.webp
│       ├── legs_standing_calf_raise.webp
│       ├── legs_good_morning.webp
│       ├── legs_goblet_squat.webp
│       ├── legs_stiff_leg_deadlift.webp
│       ├── legs_side_lunge.webp
│       ├── legs_seated_calf_raise.webp
│       ├── shoulder_barbell_press.webp
│       ├── shoulder_dumbbell_lateral_raise.webp
│       ├── shoulder_arnold_press.webp
│       ├── shoulder_face_pull.webp
│       ├── shoulder_front_raise.webp
│       ├── shoulder_bent_over_fly.webp
│       ├── shoulder_seated_dumbbell_press.webp
│       ├── shoulder_barbell_upright_row.webp
│       ├── shoulder_reverse_pec_deck.webp
│       ├── shoulder_cable_lateral_raise.webp
│       ├── shoulder_strict_press.webp
│       ├── shoulder_alternating_front_raise.webp
│       ├── shoulder_kettlebell_press.webp
│       ├── shoulder_cuban_press.webp
│       ├── shoulder_y_raise.webp
│       ├── shoulder_push_press.webp
│       ├── shoulder_bent_over_barbell_row.webp
│       ├── arms_barbell_curl.webp
│       ├── arms_tricep_pushdown.webp
│       ├── arms_hammer_curl.webp
│       ├── arms_close_grip_bench_press.webp
│       ├── arms_concentration_curl.webp
│       ├── arms_tricep_dip.webp
│       ├── arms_preacher_curl.webp
│       ├── arms_lying_tricep_extension.webp
│       ├── arms_dumbbell_curl.webp
│       ├── arms_overhead_tricep_extension.webp
│       ├── arms_incline_dumbbell_curl.webp
│       ├── arms_reverse_curl.webp
│       ├── arms_cable_hammer_curl.webp
│       ├── arms_bent_over_tricep_extension.webp
│       ├── arms_zottman_curl.webp
│       ├── arms_wrist_curl.webp
│       ├── arms_cable_curl.webp
│       ├── core_plank.webp
│       ├── core_crunch.webp
│       ├── core_russian_twist.webp
│       ├── core_hanging_leg_raise.webp
│       ├── core_sit_up.webp
│       ├── core_dead_bug.webp
│       ├── core_lying_leg_raise.webp
│       ├── core_side_plank.webp
│       ├── core_v_up.webp
│       ├── core_mountain_climber.webp
│       ├── core_swiss_ball_crunch.webp
│       ├── core_bird_dog.webp
│       ├── core_ab_wheel.webp
│       ├── core_reverse_crunch.webp
│       ├── core_cross_body_crunch.webp
│       ├── core_alternating_leg_raise.webp
│       └── core_plank_twist.webp
```

---

## 4. 前端改动

### 4.1 api.js — 新增图片 URL 工具函数

```js
// 获取动作图片完整 URL
// filename: exercises.js 中 image 字段值，如 'back_lat_pulldown.webp'
// 返回: 完整 URL 如 'http://192.168.1.23:8080/static/exercises/back_lat_pulldown.webp'
function getExerciseImageUrl(filename) {
  if (!filename) return ''
  return getBaseUrl() + '/static/exercises/' + filename
}
```

在 `module.exports` 中导出。

### 4.2 exercises.js — 全部动作补 image 字段

现有 7 个动作的本地路径 `image: '/images/exercises/xxx.webp'` 改为 `image: 'xxx.webp'`（仅文件名）。

全部 102 个动作补齐 `image` 字段，slug 命名遵循以下规则：
- **前缀** = 部位英文缩写（back/chest/legs/shoulder/arms/core）
- **Body** = 动作英文名，下划线分隔，全小写
- **扩展名** = `.webp`

完整映射表见附录 A。

### 4.3 前端页面 — URL 拼接

涉及 3 个页面 + 1 个可能的弹窗组件：

**training.js — `loadExercise()` 方法：**
```js
currentExercise: {
  // ...
  image: ex.image ? api.getExerciseImageUrl(ex.image) : ''
}
```

**exercise-editor.js — 动作弹窗列表：**
构建 `pickerExercises` 时，每个动作的 `image` 字段通过 `api.getExerciseImageUrl()` 转换。

**exercise-templates.js — 模板预览：**
加载模板动作时同样转换。

**通用降级逻辑（已有，无需改动）：**
```xml
<image wx:if="{{item.image}}" src="{{item.image}}" binderror="onImageError" />
<view wx:else class="placeholder" />
```

---

## 5. 维护模型

```
新增动作:
  1. exercises.js — 指定部位数组中加一条
     { name: '新动作名', tag: 'xxx', ..., image: 'part_new_name.webp' }
  2. 把 new_name.webp 放入 server/static/exercises/

删除动作:
  1. exercises.js — 删除对应条目
  2. 图片文件可保留（不占包体积，无影响）

修改动作名称:
  1. exercises.js — 改 name 字段
  2. image 字段可不改（解耦设计）

替换图片:
  1. 覆盖 server/static/exercises/ 下同名文件即可
  2. 无需改代码、无需重启（除非浏览器缓存）
```

**关键原则：`image` 字段与数组索引、排列顺序完全解耦。** 增/删/调序只影响 `exercises.js` 数组，不影响已有图片的映射。

---

## 6. 验证清单

| # | 场景 | 预期 |
|---|------|------|
| 1 | 训练页当前动作卡片 | 显示对应线稿图 |
| 2 | 训练页下一个动作缩略图 | 显示对应线稿图 |
| 3 | 动作编辑页弹窗列表 | 每个动作显示缩略图 |
| 4 | 动作编辑页"已添加"列表 | 显示缩略图 |
| 5 | 动作模板页模板预览 | 显示缩略图 |
| 6 | 服务器不可用时 | 图片加载失败 → 显示占位图（icon-fitness.svg） |
| 7 | 新图片放入目录 | 无需重启前端，刷新训练页即可显示 |
| 8 | 图片文件名拼错 | 前端降级显示占位图，不影响训练功能 |
| 9 | 静态文件公开访问 | `curl http://ip:8080/static/exercises/back_lat_pulldown.webp` 返回图片 |
| 10 | 微信开发者工具打开训练页 | 图片正常加载（127.0.0.1 地址） |
| 11 | 真机打开训练页 | 图片正常加载（局域网 IP 地址） |

---

## 7. 与原方案对比

| 维度 | 原方案（本地打包） | 新方案（远程静态服务） |
|------|-------------------|----------------------|
| 小程序包体积 | 2MB+（超限） | 0 增量 |
| 新增图片 | 改代码 + 重传小程序审核 | 放进目录即可 |
| 替换图片 | 同上 | 覆盖文件即可 |
| 离线可用 | ✅ | ❌（需网络） |
| 依赖 | 无 | 后端必须运行 |

离线不可用是本方案的唯一劣势。对于健身训练场景（需要房间同步，本身依赖网络），这个代价可接受。

---

## 附录 A：完整动作-图片映射表

### 背部 (back) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 高位下拉 | `back_lat_pulldown.webp` |
| 2 | 引体向上 | `back_pull_up.webp` |
| 3 | 坐姿划船 | `back_seated_row.webp` |
| 4 | 杠铃划船 | `back_barbell_row.webp` |
| 5 | 硬拉 | `back_deadlift.webp` |
| 6 | T杆划船 | `back_t_bar_row.webp` |
| 7 | 哑铃单臂划船 | `back_dumbbell_one_arm_row.webp` |
| 8 | 窄距下拉 | `back_close_grip_pulldown.webp` |
| 9 | 哑铃耸肩 | `back_dumbbell_shrug.webp` |
| 10 | 山羊挺身 | `back_hyperextension.webp` |
| 11 | 潘德雷划船 | `back_pendlay_row.webp` |
| 12 | 反握引体向上 | `back_reverse_grip_pull_up.webp` |
| 13 | 直臂下压 | `back_straight_arm_pulldown.webp` |
| 14 | 宽距高位下拉 | `back_wide_grip_pulldown.webp` |
| 15 | 悍马机划船 | `back_hammer_strength_row.webp` |
| 16 | 杠铃耸肩 | `back_barbell_shrug.webp` |
| 17 | 对握下拉 | `back_neutral_grip_pulldown.webp` |
| 18 | 反手高位下拉 | `back_reverse_grip_pulldown.webp` |
| 19 | 坐姿绳索划船 | `back_seated_cable_row.webp` |
| 20 | 中距对握高位下拉 | `back_medium_neutral_grip_pulldown.webp` |
| 21 | 中距对握划船 | `back_medium_neutral_grip_row.webp` |
| 22 | 直立下压 | `back_straight_arm_pushdown.webp` |

### 胸部 (chest) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 平板卧推 | `chest_bench_press.webp` |
| 2 | 哑铃飞鸟 | `chest_dumbbell_fly.webp` |
| 3 | 上斜哑铃卧推 | `chest_incline_dumbbell_press.webp` |
| 4 | 双杠臂屈伸 | `chest_dips.webp` |
| 5 | 蝴蝶机夹胸 | `chest_pec_deck.webp` |
| 6 | 俯卧撑 | `chest_push_up.webp` |
| 7 | 上斜杠铃卧推 | `chest_incline_barbell_press.webp` |
| 8 | 下斜卧推 | `chest_decline_press.webp` |
| 9 | 哑铃卧推 | `chest_dumbbell_press.webp` |
| 10 | 高位绳索夹胸 | `chest_high_cable_fly.webp` |
| 11 | 窄距俯卧撑 | `chest_close_grip_push_up.webp` |
| 12 | 斯万夹胸 | `chest_svend_press.webp` |
| 13 | 哑铃仰卧直臂上拉 | `chest_dumbbell_pullover.webp` |
| 14 | 器械推胸 | `chest_machine_chest_press.webp` |
| 15 | 低位绳索夹胸 | `chest_low_cable_fly.webp` |
| 16 | 跪姿俯卧撑 | `chest_kneeling_push_up.webp` |
| 17 | 垫高俯卧撑 | `chest_decline_push_up.webp` |

### 腿部 (legs) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 深蹲 | `legs_squat.webp` |
| 2 | 箭步蹲 | `legs_lunge.webp` |
| 3 | 腿举 | `legs_leg_press.webp` |
| 4 | 罗马尼亚硬拉 | `legs_romanian_deadlift.webp` |
| 5 | 腿弯举 | `legs_leg_curl.webp` |
| 6 | 提踵 | `legs_calf_raise.webp` |
| 7 | 保加利亚分腿蹲 | `legs_bulgarian_split_squat.webp` |
| 8 | 腿屈伸 | `legs_leg_extension.webp` |
| 9 | 俯卧腿弯举 | `legs_lying_leg_curl.webp` |
| 10 | 臀推 | `legs_hip_thrust.webp` |
| 11 | 哈克深蹲 | `legs_hack_squat.webp` |
| 12 | 站姿提踵 | `legs_standing_calf_raise.webp` |
| 13 | 早安式 | `legs_good_morning.webp` |
| 14 | 哑铃酒杯深蹲 | `legs_goblet_squat.webp` |
| 15 | 直腿硬拉 | `legs_stiff_leg_deadlift.webp` |
| 16 | 侧弓步 | `legs_side_lunge.webp` |
| 17 | 坐姿提踵 | `legs_seated_calf_raise.webp` |

### 肩部 (shoulder) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 杠铃推举 | `shoulder_barbell_press.webp` |
| 2 | 哑铃侧平举 | `shoulder_dumbbell_lateral_raise.webp` |
| 3 | 阿诺德推举 | `shoulder_arnold_press.webp` |
| 4 | 面拉 | `shoulder_face_pull.webp` |
| 5 | 前平举 | `shoulder_front_raise.webp` |
| 6 | 俯身飞鸟 | `shoulder_bent_over_fly.webp` |
| 7 | 坐姿哑铃推举 | `shoulder_seated_dumbbell_press.webp` |
| 8 | 杠铃提拉 | `shoulder_barbell_upright_row.webp` |
| 9 | 蝴蝶机反向飞鸟 | `shoulder_reverse_pec_deck.webp` |
| 10 | 绳索侧平举 | `shoulder_cable_lateral_raise.webp` |
| 11 | 实力推举 | `shoulder_strict_press.webp` |
| 12 | 哑铃交替前平举 | `shoulder_alternating_front_raise.webp` |
| 13 | 壶铃推举 | `shoulder_kettlebell_press.webp` |
| 14 | 哑铃古巴推举 | `shoulder_cuban_press.webp` |
| 15 | Y字抬臂 | `shoulder_y_raise.webp` |
| 16 | 借力推举 | `shoulder_push_press.webp` |
| 17 | 俯身杠铃提拉 | `shoulder_bent_over_barbell_row.webp` |

### 手臂 (arms) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 杠铃弯举 | `arms_barbell_curl.webp` |
| 2 | 绳索下压 | `arms_tricep_pushdown.webp` |
| 3 | 锤式弯举 | `arms_hammer_curl.webp` |
| 4 | 窄距卧推 | `arms_close_grip_bench_press.webp` |
| 5 | 集中弯举 | `arms_concentration_curl.webp` |
| 6 | 臂屈伸 | `arms_tricep_dip.webp` |
| 7 | 牧师凳弯举 | `arms_preacher_curl.webp` |
| 8 | 仰卧臂屈伸 | `arms_lying_tricep_extension.webp` |
| 9 | 哑铃弯举 | `arms_dumbbell_curl.webp` |
| 10 | 颈后臂屈伸 | `arms_overhead_tricep_extension.webp` |
| 11 | 上斜哑铃弯举 | `arms_incline_dumbbell_curl.webp` |
| 12 | 反握弯举 | `arms_reverse_curl.webp` |
| 13 | 绳索锤式弯举 | `arms_cable_hammer_curl.webp` |
| 14 | 俯身臂屈伸 | `arms_bent_over_tricep_extension.webp` |
| 15 | 佐特曼弯举 | `arms_zottman_curl.webp` |
| 16 | 腕弯举 | `arms_wrist_curl.webp` |
| 17 | 绳索弯举 | `arms_cable_curl.webp` |

### 核心 (core) — 17 个

| # | 动作名 | image 字段 |
|---|--------|-----------|
| 1 | 平板支撑 | `core_plank.webp` |
| 2 | 卷腹 | `core_crunch.webp` |
| 3 | 俄罗斯转体 | `core_russian_twist.webp` |
| 4 | 悬垂举腿 | `core_hanging_leg_raise.webp` |
| 5 | 仰卧起坐 | `core_sit_up.webp` |
| 6 | 死虫式 | `core_dead_bug.webp` |
| 7 | 仰卧举腿 | `core_lying_leg_raise.webp` |
| 8 | 侧平板支撑 | `core_side_plank.webp` |
| 9 | V字卷腹 | `core_v_up.webp` |
| 10 | 登山者 | `core_mountain_climber.webp` |
| 11 | 瑜伽球卷腹 | `core_swiss_ball_crunch.webp` |
| 12 | 鸟狗式 | `core_bird_dog.webp` |
| 13 | 健腹轮 | `core_ab_wheel.webp` |
| 14 | 反向卷腹 | `core_reverse_crunch.webp` |
| 15 | 交叉卷腹 | `core_cross_body_crunch.webp` |
| 16 | 仰卧交替抬腿 | `core_alternating_leg_raise.webp` |
| 17 | 平板支撑转体 | `core_plank_twist.webp` |

**注意：** 背部实际有 22 个动作（原 6 个 + 新增 16 个在 exercises.js 中），超出 6×17 的对称结构。映射表按 `exercises.js` 实际顺序排列。

---

## 8. 实施步骤概览

1. **后端** — `server/main.go` 添加 `r.Static(...)` + 创建 `server/static/exercises/` 目录
2. **前端 api.js** — 新增 `getExerciseImageUrl()` 函数
3. **前端 exercises.js** — 102 个动作全部补齐 `image` 字段
4. **前端页面** — training / exercise-editor / exercise-templates 三个页面做 URL 拼接
5. **验证** — 10 条场景逐条验证

---

> 审批通过后由 writing-plans skill 生成详细实施计划。
