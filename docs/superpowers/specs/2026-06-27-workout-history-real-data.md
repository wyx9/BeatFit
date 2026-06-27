# 训练记录页接入后端真实数据

> 日期: 2026-06-27 | 状态: 设计已确认

---

## 背景

`workout-history` 页面目前使用静态 mock 数据 `ALL_LOGS`（10 条假记录，跨 5/6/7 月），需要接入后端 `GET /api/user/workouts` 接口，改为真实数据驱动。

同时，当前 `workout_logs` 表不存储训练动作明细，用户展开训练卡片后无法看到"高位下拉 3 组"这类信息。因此一并扩展后端存储 exercises 字段。

---

## 数据流

```
训练完成 (training.js)
  │  exerciseList = [{name, tag, sets, reps, ...}, ...]
  ▼
POST /api/workout/report
  │  body: { room_id, minutes, kcal, count, exercises: [...] }  ← 新增 exercises
  ▼
workout_logs 表
  │  + exercises JSON 列（新增）
  ▼
GET /api/user/workouts?year=2026&month=6
  │  返回: { logs: [...], workout_days: ["2026-06-25", ...] }
  ▼
workout-history.js
  │  _refreshView(y, m) → fetch API → calendarGrid + summary + logs
```

---

## 后端改动

### 1. 数据库

```sql
ALTER TABLE workout_logs ADD COLUMN exercises JSON DEFAULT NULL COMMENT '训练动作明细';
```

GORM AutoMigrate 靠 model 新增字段自动处理。

### 2. Model 层（`server/internal/model/workout.go`）

WorkoutLog 结构体加字段：

```go
Exercises string `gorm:"type:json;default:null" json:"exercises"`
```

新增查询方法 `ListWorkoutsByUserMonth`：

```go
func ListWorkoutsByUserMonth(db *gorm.DB, userID uint64, year, month int) ([]WorkoutLog, []string, error)
```

- 查询该月所有 logs（`WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ? ORDER BY created_at DESC`）
- 返回训练日集合 `workout_days`：`SELECT DISTINCT DATE(created_at) WHERE YEAR/MONTH` 得到 `["2026-06-25", "2026-06-27", ...]`

### 3. Handler 层

#### POST /api/workout/report（`server/internal/handler/leaderboard.go`）

请求体新增 `exercises` 字段：

```go
var req struct {
    RoomID    uint64                   `json:"room_id"`
    Minutes   int                      `json:"minutes"`
    Kcal      int                      `json:"kcal"`
    Count     int                      `json:"count"`
    Exercises []map[string]interface{} `json:"exercises"` // 新增
}
```

`json.Marshal(req.Exercises)` 后存入 `WorkoutLog.Exercises`。

#### GET /api/user/workouts（`server/internal/handler/auth.go`）

新增 query 参数 `year` / `month`：

- 两者都传时走 `ListWorkoutsByUserMonth`
- 都不传时走现有 `ListWorkoutsByUser`（兼容旧调用）

响应格式：

```json
{
  "logs": [
    {
      "id": 1,
      "minutes": 30,
      "kcal": 200,
      "count": 120,
      "exercises": [{"name":"高位下拉","sets":3},{"name":"坐姿划船","sets":3}],
      "created_at": "2026-06-27T10:30:00Z"
    }
  ],
  "workout_days": ["2026-06-25", "2026-06-27"],
  "total": 8
}
```

**关键**：`exercises` 数据库存的是 JSON 字符串，handler 返回时需将 `string` 反序列化为 `json.RawMessage` 再写回响应，避免双重转义（`"\"[{...}]\""` 这种错误格式）。实现方式——在 handler 中遍历 logs，对每条 `exercises` 字段做 `json.RawMessage(exercisesStr)` 替换。

### 4. Service 层（`server/internal/service/leaderboard.go`）

`ReportWorkout` 函数签名变更：

```go
func ReportWorkout(db *gorm.DB, userID, roomID uint64, minutes, kcal, count int, exercises []map[string]interface{}) (*model.WorkoutLog, error)
```

---

## 前端改动

### 1. API 层（`miniprogram/utils/api.js`）

`getWorkoutHistory` 扩展参数：

```js
function getWorkoutHistory(page, size, year, month) {
  var params = '?page=' + (page || 1) + '&size=' + (size || 200)
  if (year) params += '&year=' + year
  if (month) params += '&month=' + month
  return request('GET', '/api/user/workouts' + params)
}
```

### 2. training.js — 上报时传 exercises

两处 `api.reportWorkout(...)` 调用末尾新增 `this.data.exerciseList` 参数，每项只传 `{name, tag, sets}`：

```js
var exercises = (this.data.exerciseList || []).map(function(ex) {
  return { name: ex.name, tag: ex.tag, sets: ex.sets }
})
api.reportWorkout(roomId, Math.ceil(elapsed / 60), kcal, this.data.exerciseList.length, exercises)
```

### 3. workout-history.js — 核心改造

#### _refreshView 改为异步请求

```
_refreshView(year, month)
  ├─ 1. wx.showLoading({ mask: true })
  ├─ 2. api.getWorkoutHistory(1, 200, year, month)
  │      ├─ 成功 → 转换数据 → setData
  │      └─ 失败 → wx.showToast('加载失败') + 保留上次数据
  └─ 3. wx.hideLoading()
```

#### 数据转换

- `created_at` 字符串 → `new Date()` → 提取 `day`、`weekday`（映射为中文周几）
- `exercises` → 后端已返回数组，直接使用
- 汇总：遍历 logs 累加 `minutes`、`kcal`，`monthWorkouts = logs.length`

#### 日历构建

- `workoutDaySet` 直接来自 `response.workout_days` 数组
- `buildCalendarGrid(year, month, workoutDaySet)` 逻辑不变

#### 边界处理

| 状态 | 行为 |
|------|------|
| 加载中 | `wx.showLoading({ mask: true })` |
| 请求失败 | `wx.showToast('加载失败')`，保留上一份数据 |
| 某月无记录 | `logs: []`，日历无绿点，汇总全 0，显示"本月无训练记录" |
| 未登录 | API 层 reject → Toast "请先登录" |
| 月份边界 | `canGoPrev` 当年 1 月禁用，`canGoNext` 当年 12 月禁用 |

### 4. 删除的内容

- 删除 `ALL_LOGS` 静态数组（41-119 行）
- 删除独立 `fmtDate` 函数，日期格式化内联到数据转换中
- `onLoad` 从 `_refreshView(2026, 6)` 改为 `_refreshView(当前年, 当前月)`

---

## 涉及文件

| 层 | 文件 | 改动 |
|----|------|------|
| DB | workout_logs 表 | + exercises JSON 列 |
| Model | `server/internal/model/workout.go` | WorkoutLog + Exercises 字段, + ListWorkoutsByUserMonth |
| Service | `server/internal/service/leaderboard.go` | ReportWorkout + exercises 参数 |
| Handler | `server/internal/handler/leaderboard.go` | Report 请求体 + exercises |
| Handler | `server/internal/handler/auth.go` | WorkoutHistory + year/month 参数, 响应 + workout_days, exercises JSON 处理 |
| 前端 API | `miniprogram/utils/api.js` | getWorkoutHistory + year/month 参数, reportWorkout + exercises |
| 前端 训练 | `miniprogram/pages/training/training.js` | reportWorkout 调用 + exercises |
| 前端 历史 | `miniprogram/pages/workout-history/workout-history.js` | 替换 mock 为 API 调用 |

---

## 不涉及

- 训练动作明细只存 `name / tag / sets` 三个字段（不足以重建完整训练计划，但足够历史展示）
- 个人训练（非房间训练）的上报不在本次范围
- 排行榜页不通本次改动
- `ENABLE_WORKOUT_RECORDS` 功能开关 — 用户可手动关闭，但既然要接入真实数据，此开关后续可移除
