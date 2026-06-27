# 动作缩略图全覆盖 — 设计文档

> 日期: 2026-06-27 | 状态: 待审批

---

## 1. 背景

当前训练页已有动作缩略图，但以下 4 个页面缺少：

| 页面 | 当前状态 |
|------|---------|
| create-room 主体动作卡片 | 纯文字编辑卡片，无缩略图 |
| exercise-editor 主体动作列表 | 纯文字编辑卡片，无缩略图 |
| room-waiting 训练内容行 | 纯文字行，无缩略图 |
| exercise-templates 模板卡片标签 | 纯文字标签，无缩略图 |

**目标**: 所有展示动作名称/组数/次数的地方统一加缩略图，风格一致、美观简洁。

---

## 2. 设计原则

- **紧凑缩略图**：卡片列表中 100rpx，行列表中 80rpx，标签中 40rpx
- **左侧图片 + 右侧信息**：不改变现有信息层次
- **统一降级**：无图时显示浅色背景 + emoji 占位，不破坏布局
- **复用现有模式**：和训练页、选择器弹窗已有的缩略图风格保持一致
- **数据层集中处理**：API 层新增 `resolveExerciseImage()`，各页面只关心 `imageUrl` 字段

---

## 3. 数据层

### 3.1 新增工具函数

**文件**: `miniprogram/utils/api.js`

```js
// 为单个动作对象解析图片 URL，返回附加 imageUrl 字段的新对象
function resolveExerciseImage(ex) {
  return { ...ex, imageUrl: ex.image ? getExerciseImageUrl(ex.image) : '' }
}

// 批量处理
function resolveExerciseImages(exercises) {
  return exercises.map(ex => resolveExerciseImage(ex))
}
```

导出新增 `resolveExerciseImage`、`resolveExerciseImages`。

### 3.2 URL 解析规则

- `getExerciseImageUrl(filename)` 已存在，返回 `{baseUrl}/static/exercises/{encodeURIComponent(filename)}`
- 中文文件名（如 `深蹲.png`）经 `encodeURIComponent` 处理后兼容真机 WebView

---

## 4. 页面改动

### 4.1 create-room — 主体动作卡片

**布局**: `.workout-card` 由纯纵向改为横向 flex，左侧 100rpx 缩略图，右侧保持原有 header+inputs。

```
Before:                         After:
┌──────────────────────┐       ┌─────────────────────────────┐
│ 杠铃卧推  力量   [×] │       │ [img]  杠铃卧推  力量  [×] │
│ 组数 次数 时长 休息  │       │ 100    组数 次数 时长 休息  │
└──────────────────────┘       └─────────────────────────────┘
```

**JS 改动** (`create-room.js`):
- `buildDefaults(key)`: `list.slice(0,2).map(ex => api.resolveExerciseImage({...ex}))`
- `buildExercise(name, catKey)`: 返回值调用 `api.resolveExerciseImage()`
- `onConfirmImport()`: 导入模板动作时调用 `api.resolveExerciseImages()`

**WXML 改动**:
- `.workout-card` 最前面加图片区域（`wx:if="{{ex.imageUrl}}"` 显示 `<image>`，`wx:else` 显示 emoji 占位）

**WXSS 改动**:
- `.workout-card`: 新增 `display: flex; gap: 24rpx;`
- 新增 `.workout-thumb`: `width:100rpx; height:100rpx; border-radius:20rpx; flex-shrink:0`
- 新增 `.workout-thumb-placeholder`: 浅蓝灰背景 + emoji 居中
- `.workout-card-header` `.workout-inputs`: 包在 `.workout-card-body` 内，`flex:1; min-width:0`

### 4.2 exercise-editor — 主体动作列表

**布局**: 与 create-room 相同模式。

**JS 改动** (`exercise-editor.js`):
- `onLoad`: 加载模板时 `exercises: tpl.exercises.map(ex => api.resolveExerciseImage({...ex}))`
- `onSelectExercise`: 添加动作时调用 `api.resolveExerciseImage()`

**WXML 改动**:
- `.exercise-card` 内加图片 + `.card-body` 包裹原有内容

**WXSS 改动**:
- `.exercise-card`: `display:flex; gap:24rpx`
- 新增 `.card-thumb` / `.card-thumb-placeholder`: 100rpx 缩略图样式
- `.card-header` `.card-inputs` 包入 `.card-body`

### 4.3 room-waiting — 训练内容行

**布局**: `.ex-row` 左侧加 80rpx 缩略图。

```
Before:                         After:
┌──────────────────────┐       ┌─────────────────────────────┐
│ 杠铃卧推 力量         │       │ [img] 杠铃卧推 力量          │
│ 3组×12次 | 30s | 60s│       │ 80    3组×12次 | 30s | 60s │
└──────────────────────┘       └─────────────────────────────┘
```

**JS 改动** (`room-waiting.js`):
- 分组循环中: `groups[cat].push(api.resolveExerciseImage(ex))`

**WXML 改动**:
- `.ex-row` 最前面加图片

**WXSS 改动**:
- `.ex-row`: 已是 flex，加 `gap:24rpx`
- `.ex-left` 保持不变
- 新增 `.ex-thumb`: `width:80rpx; height:80rpx; border-radius:16rpx; flex-shrink:0`
- 新增 `.ex-thumb-placeholder`: 浅灰背景 + emoji

### 4.4 exercise-templates — 模板卡片标签

**布局**: `.tpl-tag` 从纯文字变为小图标+文字。

```
Before:                         After:
[ 杠铃卧推 ] [ 深蹲 ]          [🖼杠铃卧推] [🖼深蹲]
```

**JS 改动** (`exercise-templates.js`):
- `refresh()`: 对所有模板 exercises 调用 `api.resolveExerciseImages()`
  ```js
  const all = exerciseUtils.getAllTemplates()
  const presets = all.filter(t => t.preset).map(t => ({
    ...t, exercises: api.resolveExerciseImages(t.exercises)
  }))
  ```

**WXML 改动**:
- `.tpl-tag` 从 `<text class="tpl-tag">{{ex.name}}</text>` 改为:
  ```xml
  <view class="tpl-tag">
    <image wx:if="{{ex.imageUrl}}" class="tpl-tag-thumb" src="{{ex.imageUrl}}" mode="aspectFill" />
    <view wx:else class="tpl-tag-thumb tpl-tag-thumb-placeholder"></view>
    <text>{{ex.name}}</text>
  </view>
  ```

**WXSS 改动**:
- `.tpl-tag`: 改为 `display:inline-flex; align-items:center; gap:8rpx; padding:4rpx 18rpx 4rpx 6rpx`
- 新增 `.tpl-tag-thumb`: `width:36rpx; height:36rpx; border-radius:50%`（圆形小图标）
- 新增 `.tpl-tag-thumb-placeholder`: `background:#dce9ff`

---

## 5. 图片占位降级规范

所有位置统一遵循：

| 有 imageUrl | 无 imageUrl |
|------------|-------------|
| `<image src="{{ex.imageUrl}}" mode="aspectFill">` | 浅灰/蓝灰背景方块 + 部位 emoji 或健身 icon |

占位元素尺寸与图片完全一致，不破坏布局。

---

## 6. 影响范围汇总

| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `utils/api.js` | 新增 2 个导出函数 | +12 行 |
| `pages/create-room/create-room.js` | 3 处调用 resolve | ~6 行 |
| `pages/create-room/create-room.wxml` | workout-card 加图片 | +6 行 |
| `pages/create-room/create-room.wxss` | card 横向布局 + 缩略图样式 | +20 行 |
| `pages/exercise-editor/exercise-editor.js` | 2 处调用 resolve | ~4 行 |
| `pages/exercise-editor/exercise-editor.wxml` | exercise-card 加图片 | +6 行 |
| `pages/exercise-editor/exercise-editor.wxss` | card 横向布局 + 缩略图样式 | +20 行 |
| `pages/room-waiting/room-waiting.js` | 分组循环中调用 resolve | ~2 行 |
| `pages/room-waiting/room-waiting.wxml` | ex-row 加图片 | +6 行 |
| `pages/room-waiting/room-waiting.wxss` | 缩略图样式 | +15 行 |
| `pages/exercise-templates/exercise-templates.js` | refresh 中调用 resolveImages | ~6 行 |
| `pages/exercise-templates/exercise-templates.wxml` | tpl-tag 重构 | +4 行/处 |
| `pages/exercise-templates/exercise-templates.wxss` | tag 样式改造 | +12 行 |

---

## 7. 验证清单

| # | 场景 | 预期 |
|---|------|------|
| 1 | 创建房间页 — 默认背部动作卡片 | 高位下拉、引体向上左侧显示缩略图 |
| 2 | 创建房间页 — 无图动作 | 显示浅灰方块 + 部位 emoji |
| 3 | 动作编辑器 — 编辑模板动作列表 | 每个动作左侧有缩略图 |
| 4 | 动作编辑器 — 只读模式 | 同上有缩略图 |
| 5 | 房间等待页 — 训练内容 | 每个动作行左侧有 80rpx 缩略图 |
| 6 | 动作库 — 系统预设模板卡片 | 每个动作标签前有 36rpx 圆形小图 |
| 7 | 动作库 — 我的模板卡片 | 同上 |
| 8 | 真机调试 | 中文文件名图片正常显示 |
| 9 | 创建房间页 — 编辑操作 | 缩略图不影响输入框交互 |
| 10 | 各页面 — 无图片降级 | 占位元素布局不塌陷 |
