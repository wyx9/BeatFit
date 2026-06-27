---
name: leaderboard-design
description: 排行榜功能完整设计决策 — 时间范围、数据维度、UI 布局、API 扩展
metadata:
  type: project
---

## 排行榜功能设计决策（2026-06-27）

### 时间范围
- **仅今日排行榜**，每天 0 点 Redis ZSET 自动过期重置
- 无历史查询入口，保持简单

### 数据维度（3 tab）
| 维度 | 字段 | 计算方式 |
|------|------|----------|
| 时长 | duration/minutes | 训练总秒数 ÷ 60 |
| 消耗 | calories/kcal | MET 系数 × 训练时长 |
| 次数 | count | **总 reps 数**（动作数 × 组数 × reps） |

**Why:** "次数"从动作个数改为总 reps 更真实反映训练量。后端 `SUM(count)` 聚合，前端 `reduce` 计算。

### API 扩展
`GET /api/leaderboard` 响应新增 `my_rank` 字段，包含当前用户的排名、数值、昵称等信息。后端通过 Redis `ZREVRANK`+`ZSCORE` 或 MySQL 子查询计算。用户无今日训练时 my_rank 字段不返回。

### 底部导航排序
固定顺序：**大厅 → 动作 → 排行榜 → 我的**（4 页面统一）
布局：`justify-content: space-around; gap: 0`（4 tab 均分屏幕宽度）

### UI 设计
- 所有底部导航图标统一 `#454747` 灰色，激活 tab 仅文字变绿（`nav-label-active`）
- 排行榜页无 header/头像，直接展示内容
- "我的排名"胶囊位于排行列表最后一项下方，跟随列表滚动（非固定定位）
- 无 nav-dot 绿点装饰

### 防御性编码
- 后端 `fillEntryUser`：昵称空值时默认"运动达人"，等级空值时默认 1
- 前端 `safeName`：昵称 null/undefined/空串 → `--`

### Redis 过期修复
`ReportWorkout` 中每次 ZINCRBY 后调用 `SetLeaderboardExpire()`，确保排行榜 key 每日 0 点重置。之前只有 MySQL 回退路径调用，正常上报路径漏了。

**How to apply:** 排行榜相关的任何修改都应遵循以上约定。新增排行榜维度只需加 tab + Redis key + MySQL field。
