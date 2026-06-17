# 训练动作模板 — 功能设计文档

> 日期: 2026-06-17 | 状态: 待实施

---

## 1. 背景与目标

当前创建房间时，每次都需要从零开始拼训练动作。用户希望：
- 自定义一套训练动作模板，反复使用
- 系统提供推荐的预设模板
- 创建房间时一键导入模板

## 2. 需求摘要

| # | 需求 | 说明 |
|---|------|------|
| R1 | 用户自定义模板 | 新建/编辑/删除个人训练动作模板 |
| R2 | 系统预设模板 | 3-5 套推荐模板，只读，可另存为 |
| R3 | 创建房间导入 | 创建房间时从模板导入动作 |
| R4 | 底部导航入口 | 所有主页面底部新增「动作」tab |

## 3. 架构设计

```
exercises.js (只读配置库)        wx.Storage (本地)
  6部位 × 36动作                    key: 'exercise_templates'
       │                              └── 用户自定义模板数组
       ├── 动作选择器数据源
       └── 系统预设模板 (3-5套)

数据流:
  模板管理页 ←→ wx.Storage (读写用户模板)
  模板管理页  ← exercises.js (读取系统预设)
  创建房间页  ← wx.Storage (导入模板)
  创建房间页  ← exercises.js (读取系统预设)
```

**关键决策：纯前端改动，不需要后端 API 变更。**

## 4. 数据模型

### 4.1 模板结构

```typescript
interface ExerciseItem {
  name: string          // 动作名称
  tag: string           // 标签: 力量/塑形/肥大/复合/耐力/康复
  sets: number          // 组数
  reps: number          // 每组次数
  duration_sec: number  // 每组动作时长(秒)
  rest_sec: number      // 组间休息时长(秒)
}

interface ExerciseTemplate {
  id: string            // 'preset_xxx' (系统) 或 'tpl_timestamp' (用户)
  name: string          // 模板名称
  preset: boolean       // true=系统预设(只读), false=用户自定义
  exercises: ExerciseItem[]
}
```

### 4.2 存储

| 存储目标 | 方式 | Key / 位置 |
|----------|------|-----------|
| 用户自定义模板 | `wx.setStorageSync('exercise_templates', JSON)` | `ExerciseTemplate[]`，仅含 `preset: false` 的项 |
| 系统预设模板 | `miniprogram/config/exercises.js` 新增导出 | `ExerciseTemplate[]`，固定 `preset: true`，不可删改 |

### 4.3 系统预设模板（建议 4 套）

| ID | 名称 | 动作数 | 定位 |
|----|------|--------|------|
| `preset_full_body` | 全身燃脂入门 | 4 | 新手友好，覆盖主要肌群 |
| `preset_back_power` | 背部力量突破 | 3 | 背部专项 |
| `preset_chest_shape` | 胸部塑形计划 | 3 | 胸部专项 |
| `preset_core_abs` | 核心腹部强化 | 4 | 核心/腹肌专项 |

## 5. 页面设计

### 5.1 导航变更

底部导航栏统一调整为 4 tab（用「动作」替换原未使用的「记录」tab）：

| 位置 | 图标 | 文字 | 目标页面 |
|------|------|------|---------|
| 1 | grid | 大厅 | lobby |
| 2 | **fitness (新增)** | **动作** | **exercise-templates** |
| 3 | leaderboard | 排行榜 | leaderboard |
| 4 | person | 我的 | profile |

涉及修改的页面：`lobby`（去掉「记录」）、`training`（去掉「训练中」）、`leaderboard`、`profile` — 全部 4 个页面的底部导航需同步为上述 4 tab。

### 5.2 模板管理页 `exercise-templates`

**路由**: `/pages/exercise-templates/exercise-templates`

**布局**:
- 顶部导航栏：标题「动作库」
- 「系统推荐」区域：展示预设模板卡片，点击进入只读查看页
- 「我的模板」区域：展示自定义模板卡片，右上角 `+ 新建` 入口
- 空状态（无自定义模板时）：绿色醒目「+ 新建模板」按钮居中显示
- 新建模板按钮：全宽绿色卡片（`#22c55e`），白色文字和图标，圆角 `48rpx`

**交互**:
- 系统预设卡片 → 只读查看页（`exercise-viewer`）
- 自定义模板卡片 → 编辑页（`exercise-editor`），左侧 `···` 菜单可删除/重命名
- `+ 新建` → 空白编辑页
- 左滑自定义模板 → 删除确认弹窗

### 5.3 模板编辑页 `exercise-editor`

**路由**: `/pages/exercise-editor/exercise-editor?tplId=<id>` (有 id=编辑, 无 id=新建)

**布局**:
- 顶部：← 返回 | 标题（新建模板/编辑模板）| 保存
- 模板名称输入框
- 「已选动作」列表：卡片展示每个动作
  - 动作名称 + 删除按钮
  - 可编辑参数：标签、组数(set)、次数(rep)、动作时长(秒)、休息时长(秒) — 使用 `<input>` 绑定
- 「+ 添加动作」按钮 → 弹出动作选择器

**保存逻辑**:
- 校验：名称不为空，至少 1 个动作
- 生成/复用 `tpl_timestamp` ID
- 写入 `wx.setStorageSync('exercise_templates', ...)`
- Toast 提示 + 返回上一页

**动作参数编辑**:
- 每个动作卡片上的参数使用 `<input bindinput>` 可编辑
- 复用创建房间页已有的输入框样式

### 5.4 动作选择器（复用组件）

**使用场景**: 模板编辑页「添加动作」、创建房间页「添加动作」

**布局**（底部弹窗）:
- 顶部横滚部位 Tab：背部/胸部/腿部/肩部/手臂/核心
- 动作列表：显示名称、标签、默认参数预览
- 点击动作 → 添加到目标列表 → 弹窗关闭

**数据源**: `miniprogram/config/exercises.js` 的 `EXERCISE_LIBRARY`

**设计原则**: 模板编辑页和创建房间页共用一个动作选择器逻辑。如当前创建房间页已有弹窗实现，直接复用。

### 5.5 系统预设查看页 `exercise-viewer`

**路由**: `/pages/exercise-viewer/exercise-viewer?tplId=<preset_id>` (或直接使用 editor 页的只读模式)

**实现方式**: 复用 `exercise-editor` 页面，通过参数控制只读模式（`readonly=true`），避免创建第 3 个页面。

**布局**（只读模式）:
- 顶部：← 返回 | 模板名称
- 动作数 + 总时长概览
- 动作列表（只读展示，无编辑/删除按钮）
- 底部：「另存为我的模板」绿色按钮

**另存为逻辑**:
- 生成新 ID（`tpl_timestamp`）
- `preset: false`
- 追加到 Storage
- Toast "已保存" → 跳转编辑页

### 5.6 创建房间页 — 导入模板

**修改文件**: `miniprogram/pages/create-room/create-room.js` + `.wxml`

**变更**:
- 「+ 添加动作」按钮旁边新增「📥 导入模板」按钮
- 点击 → 底部弹窗显示模板列表（系统预设 + 我的模板）
- 单选模板 → 点击「确认导入」
- 用模板的 `exercises` 数组**替换当前页签**的动作列表
- 模板数据和自定义模板读取逻辑相同

## 6. 文件清单

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `miniprogram/pages/exercise-templates/exercise-templates.js` | 模板管理页逻辑 |
| `miniprogram/pages/exercise-templates/exercise-templates.wxml` | 模板管理页模板 |
| `miniprogram/pages/exercise-templates/exercise-templates.wxss` | 模板管理页样式 |
| `miniprogram/pages/exercise-templates/exercise-templates.json` | 模板管理页配置 |
| `miniprogram/pages/exercise-editor/exercise-editor.js` | 模板编辑页逻辑（含只读模式） |
| `miniprogram/pages/exercise-editor/exercise-editor.wxml` | 模板编辑页模板 |
| `miniprogram/pages/exercise-editor/exercise-editor.wxss` | 模板编辑页样式 |
| `miniprogram/pages/exercise-editor/exercise-editor.json` | 模板编辑页配置 |

**共 8 个新文件（2 个新页面，每页 4 个文件）**

### 6.2 修改文件

| 文件 | 变更内容 |
|------|---------|
| `miniprogram/config/exercises.js` | 新增 `PRESET_TEMPLATES` 导出（3-5 套预设模板） |
| `miniprogram/app.json` | 注册 2 个新页面路由 |
| `miniprogram/pages/lobby/lobby.wxml` | 底部导航新增「动作」tab |
| `miniprogram/pages/lobby/lobby.wxss` | 如需 5 tab 布局调整 |
| `miniprogram/pages/training/training.*` | 底部导航新增「动作」tab |
| `miniprogram/pages/leaderboard/leaderboard.*` | 底部导航新增「动作」tab |
| `miniprogram/pages/profile/profile.*` | 底部导航新增「动作」tab |
| `miniprogram/pages/create-room/create-room.js` | 新增 `importTemplate()` 方法 + 模板列表弹窗逻辑 |
| `miniprogram/pages/create-room/create-room.wxml` | 新增「导入模板」按钮 + 模板选择弹窗 |

## 7. 共用逻辑提取

为了避免模板编辑页和创建房间页**重复实现**动作选择器，将以下逻辑抽到独立模块：

**新建 `miniprogram/utils/exercise-utils.js`**:

```javascript
// 导出:
// - getAllTemplates()        → 合并系统预设 + 用户自定义，返回统一列表
// - getUserTemplates()       → 从 Storage 读取用户模板
// - saveUserTemplates(arr)   → 写入 Storage
// - deleteUserTemplate(id)   → 删除单个模板
// - showExercisePicker(opts) → 动作选择器弹窗（回调返回选中动作）
```

**收益**:
- 模板管理页、模板编辑页、创建房间导入弹窗 — 三处共用同一套读写逻辑
- 动作选择器弹窗 3 处复用（模板编辑页添加动作、创建房间页添加动作、创建房间页导入模板预览）

## 8. 设计令牌复用

严格复用 `app.wxss` 中已有的设计令牌：

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#22c55e` | 新建按钮背景、选中态 |
| `--color-surface` | `#ffffff` | 卡片背景 |
| `--color-on-surface` | `#131313` | 主文字 |
| `--color-outline` | `#e2e8f0` | 卡片边框 |
| `--radius-lg` | `2rem` | 卡片圆角 |
| `--radius-pill` | `9999px` | 按钮/标签圆角 |
| `--spacing-gutter` | `16px` | 页面边距 |

## 9. 验证清单

| # | 测试场景 | 预期结果 |
|---|---------|---------|
| 1 | 从大厅底部导航点击「动作」 | 进入模板管理页 |
| 2 | 新建模板 → 添加动作 → 编辑参数 → 保存 | Storage 中有新模板，列表页可见 |
| 3 | 编辑已有模板 → 修改参数 → 保存 | 参数更新生效 |
| 4 | 删除自定义模板 | 确认弹窗 → 确认后模板消失 |
| 5 | 查看系统预设模板 | 只读模式，无编辑/删除按钮 |
| 6 | 系统预设 → 另存为 | 生成副本到我的模板，可编辑 |
| 7 | 创建房间页 → 导入模板 | 弹窗选模板 → 当前页签动作被替换 |
| 8 | 模板列表为空 | 显示空状态 + 醒目新建按钮 |
| 9 | 所有页面底部导航 | 5 tab 正常显示，点击「动作」跳转正确 |
| 10 | 训练页底部导航 | 4 tab（无训练中），含「动作」 |
