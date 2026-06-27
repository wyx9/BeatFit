# 排行榜功能启用 + 优化设计文档

> 日期: 2026-06-27 | 状态: 设计完成

---

## 1. 概述

当前排行榜功能已完整构建但因 `ENABLE_LEADERBOARD: false` 被隐藏。本次设计涵盖：
- 启用排行榜功能开关
- 底部导航 tab 顺序调整为 大厅 → 动作 → 排行榜 → 我的
- 修复 Redis 排行榜 key 永不到期的 bug
- 次数维度从"动作个数"改为"总 reps 数"
- 新增底部"我的排名"胶囊 + 后端 API 扩展 `my_rank` 字段

时间范围确定为**仅今日排行榜**，每天 0 点 Redis 自动重置。

---

## 2. 改动清单

### 2.1 功能开关 + 导航顺序

**涉及文件：**

| 文件 | 改动 |
|------|------|
| `miniprogram/config/features.js` | `ENABLE_LEADERBOARD: false` → `true` |
| `miniprogram/pages/lobby/lobby.wxml` | 底部 nav-item 顺序：大厅 → 动作 → 排行榜 → 我的 |
| `miniprogram/pages/exercise-templates/exercise-templates.wxml` | 同上 |
| `miniprogram/pages/leaderboard/leaderboard.wxml` | 同上 |
| `miniprogram/pages/profile/profile.wxml` | 同上 |

**最终 4 页面底部导航结构：**

```
大厅页:      大厅(active) | 动作 | 排行榜 | 我的
动作库页:    大厅 | 动作(active) | 排行榜 | 我的
排行榜页:    大厅 | 动作 | 排行榜(active) | 我的
个人中心:    大厅 | 动作 | 排行榜 | 我的(active)
```

底部导航 CSS 不变（`gap: 160rpx` + `justify-content: center`），4 个 tab 均匀分布。

### 2.2 Redis 过期修复

**问题根因：** `SetLeaderboardExpire()` 只在 MySQL→Redis 回填路径（`GetLeaderboard`）调用。正常训练上报走 `ReportWorkout` → `ZINCRBY`，从不触发过期设置。结果：排行榜 key 可能永不删除，跨天数据混杂。

**修复位置：** `server/internal/service/leaderboard.go` — `ReportWorkout()` 函数

```go
// 在 ZINCRBY 之后新增一行
_ = cache.SetLeaderboardExpire()
```

`SetLeaderboardExpire()` 使用 `EXPIRETIME` 设置次日凌晨，多次调用幂等（都指向同一时刻）。

### 2.3 次数维度从动作个数改为总 Reps 数

**改动位置：** `miniprogram/pages/training/training.js` — 两处 `reportWorkout` 调用

```js
// 原来
count: this.data.exerciseList.length

// 改为
count: (this.data.exerciseList || []).reduce(function(sum, ex) {
  return sum + (ex.sets || 1) * (ex.reps || 0)
}, 0)
```

**示例：** 3 动作 × 4 组 × 12 次 = 144（原来是 3）

后端无需改动，排行榜聚合仍按 `SUM(count)` 查询。

### 2.4 我的排名胶囊（前端）

**位置：** 排行榜列表下方、底部导航上方，`position: fixed` 贴靠导航栏。

**UI 结构：**

```
┌──────────────────────────────────────────────┐
│  排行列表                                     │
│  ...                                         │
├──────────────────────────────────────────────┤
│     🏆 你的排名  第 8 名 · 320 kcal           │  ← 胶囊
├──────────────────────────────────────────────┤
│  大厅  │  动作  │ 排行榜(active) │  我的       │  ← 导航
└──────────────────────────────────────────────┘
```

**样式规格：**
- 圆角胶囊（`border-radius: 9999rpx`），半透明毛玻璃底（`backdrop-filter: blur`）
- 居中显示，上下适当 padding
- `z-index` 介于列表和导航之间

**状态处理：**

| 状态 | 显示 |
|------|------|
| 正常有排名 | `🏆 你的排名 第 X 名 · 320 kcal` |
| 用户从未训练（my_rank=null） | `🏆 今日暂无训练，动起来吧！` |
| API 请求失败 | 不显示胶囊（静默降级） |

**前端数据流：**
- `leaderboard.js` 的 `loadLeaderboard` 成功后解析 `data.my_rank`
- 若 `my_rank` 存在，`setData({ myRank: ... })` 驱动胶囊渲染
- 若 `my_rank` 为 null，展示空态文案
- catch 分支：胶囊字段设为 null，WXML `wx:if` 不渲染

### 2.5 API 扩展：`my_rank` 字段（后端）

**接口：** `GET /api/leaderboard?type=duration`

**响应新增字段：**

```json
{
  "list": [...],
  "my_rank": {
    "rank": 8,
    "value": 320,
    "nickname": "王大锤",
    "avatar_url": "...",
    "level": 5,
    "title": "健身萌新"
  }
}
```

**查询策略：**

1. **Redis 有数据时** — `ZREVRANK` 获取排名（0-based → +1）+ `ZSCORE` 获取分数，从 MySQL 补全用户信息（nickname/avatar_url/level/title）
2. **Redis 无数据时** — MySQL 子查询计算当前用户在今日的排名（`SELECT COUNT(*) FROM workout_logs WHERE DATE(created_at)=? AND SUM(field) > ?`）
3. **用户无今日训练** — `my_rank: null`

**实现要点：**

- `service/leaderboard.go` 的 `GetLeaderboard` 返回值新增 `*LeaderboardEntry`
- `handler/leaderboard.go` 从 `getUserID(c)` 获取当前用户，作为独立参数传入 service 层
- 排名计算在 Redis/MySQL 分支中各自处理

---

## 3. 数据流汇总

```
训练完成
  ↓
POST /api/workout/report { minutes, kcal, count=总reps, exercises }
  ↓
MySQL: INSERT workout_logs + UPDATE users 累计
Redis: ZINCRBY duration/calories/count + SetLeaderboardExpire
  ↓
排行榜页 onLoad
  ↓
GET /api/leaderboard?type=duration
  ↓
Redis ZREVRANGE(0,49) + ZREVRANK + ZSCORE(当前用户)
  → my_rank: { rank, value, ... }
  ↓
前端：领奖台 Top3 + 排行列表 4-50 + 底部胶囊(我的排名)
```

---

## 4. 验证清单

| # | 场景 | 预期 |
|---|------|------|
| 1 | 启用后进入大厅 | 底部导航显示 4 个 tab：大厅/动作/排行榜/我的 |
| 2 | 点击排行榜 tab | 跳转排行榜页，导航高亮"排行榜" |
| 3 | 从排行榜点"动作" | 跳转动作库页，导航高亮"动作" |
| 4 | 从动作库点"我的" | 跳转个人中心，导航高亮"我的" |
| 5 | 排行榜页加载成功 | 领奖台显示前 3 名，列表显示 4-50 名，底部胶囊显示我的排名 |
| 6 | 用户无今日训练 | 胶囊显示"今日暂无训练，动起来吧！" |
| 7 | 后端不可用 | 排行榜 fallback 静态数据，胶囊不显示 |
| 8 | 训练上报 count=144 | workout_logs.count = 144（3动作×4组×12次） |
| 9 | 跨天测试 | 次日 0 点后 Redis key 过期，排行榜重新从 MySQL 聚合 |
| 10 | 多次 ZINCRBY | Redis key 始终有次日凌晨过期时间 |
