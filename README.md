# BeatFit — 多人实时同步健身

好友进入房间，共同完成训练计划。房主选择动作，全员同步计时锻炼。

## 架构

```
client/（微信小程序） ←→ HTTP/WebSocket ←→ server/（Go 后端）
                                                └── SQLite
```

Web 调试页通过 `//go:embed` 嵌入后端二进制，访问 `http://localhost:8080/static/test.html`。

## 功能

- **房间系统**：房主创建房间，生成 6 位房间码，好友输入房码或从列表一键加入
- **动作预设库**：5 大分类（胸/背/腿/手臂/核心），每类预设动作带默认组数/次数/时长
- **自定义动作**：支持手动输入名称、组数、次数、每组时长、组间休息
- **分组计时训练**：每组动作 → 组间休息 → 下一组，所有成员实时同步
- **训练重连**：刷新页面自动恢复训练进度（当前动作、第几组、剩余秒数）
- **终止训练**：房主可随时终止，所有成员自动返回大厅
- **大厅通知**：新房创建时，首页所有用户实时刷新房间列表

## 快速开始

### 后端

```bash
cd server
GOPROXY=https://goproxy.cn,direct go run main.go
```

浏览器打开 `http://localhost:8080/static/test.html`，多开标签页即可模拟多用户调试。

### 微信小程序

用微信开发者工具打开 `client/` 目录，修改 `app.js` 中 `baseUrl` / `wsBaseUrl` 指向后端地址。

## 项目结构

```
├── server/                  # Go 后端
│   ├── main.go              # 入口：路由注册 + 优雅关闭 + panic 兜底
│   ├── handler/
│   │   ├── user.go          # 登录/注册
│   │   ├── room.go          # 房间 CRUD + 训练控制 + 终止训练
│   │   └── ws.go            # 房间 WS + 大厅 WS
│   ├── model/model.go       # 数据模型 + API 请求/响应 + WS 消息类型
│   ├── service/
│   │   ├── room.go          # 房间业务逻辑 + 默认值校验
│   │   └── hub.go           # WS Hub：连接管理 + 双层循环训练计时器
│   ├── store/sqlite.go      # SQLite 存储（纯 Go 驱动，免 CGO）
│   └── static/test.html     # Web 调试页面（编译时嵌入二进制）
└── client/                  # 微信小程序
    ├── app.js / app.json    # 全局配置（Apple 原生深色主题）
    ├── utils/
    │   ├── api.js           # HTTP 请求封装
    │   └── ws.js            # WebSocket 客户端封装
    └── pages/
        ├── index/           # 首页：登录 + 大厅 WS + 房间列表 + 一键加入
        ├── create/          # 创建房间：分类预设 + 自定义动作 + 可编辑已选
        ├── room/            # 等待室：成员列表 + 训练计划 + 房主开始按钮
        └── training/        # 训练页：双阶段计时（动作/休息）+ 终止训练
```

## 训练分层模型

每个动作由 4 个参数定义：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `sets` | 组数 | 5 |
| `reps` | 每组次数（展示用） | 8 |
| `duration_seconds` | 每组倒计时（秒） | 6 |
| `rest_seconds` | 组间休息（秒），可为 0 | 20 |

计时流程（以深蹲 3 组为例）：

```
深蹲 · 第 1/3 组 (6s) → 休息 (20s) → 第 2/3 组 (6s) → 休息 (20s) → 第 3/3 组 (6s) → 下一动作
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 用户登录（`{ nickname }` → `{ user_id, token }`） |
| POST | `/api/rooms` | 创建房间（`{ name, exercises: [{ name, sets, reps, duration_seconds, rest_seconds }] }`） |
| GET | `/api/rooms` | 活跃房间列表 |
| GET | `/api/rooms/:code` | 房间详情（含成员、动作列表） |
| POST | `/api/rooms/:code/join` | 加入房间 |
| POST | `/api/rooms/:code/start` | 开始训练（仅房主） |
| POST | `/api/rooms/:code/terminate` | 终止训练（仅房主） |
| POST | `/api/rooms/:code/leave` | 离开房间 |
| WS | `/ws/lobby` | 大厅通知（`room_list_changed`） |
| WS | `/ws/room/:code` | 房间实时同步 |

所有需要用户身份的接口通过 `?user_id=xxx` 传参。

## WebSocket 消息

### 房间同步

| 消息 | 方向 | 说明 |
|------|------|------|
| `user_joined` | S→C | 有人加入房间 |
| `user_left` | S→C | 有人离开 |
| `members` | S→C | 当前成员列表 |

### 训练计时

| 消息 | 方向 | 说明 |
|------|------|------|
| `training_started` | S→C | 训练开始，含完整动作列表 + 总时长 |
| `timer_tick` | S→C | 每秒推送，含 `phase`（active/rest）、`set_number`、`total_sets`、`seconds_left` |
| `exercise_change` | S→C | 切换到下一动作 |
| `training_resume` | S→C | 重连时下发：当前动作、第几组、阶段、剩余秒数 |
| `training_complete` | S→C | 全部完成 |
| `training_terminated` | S→C | 房主终止训练 |

## 技术栈

- **后端**：Go + Gin + Gorilla WebSocket + modernc.org/sqlite（纯 Go，免 CGO）
- **前端**：微信小程序原生 + 纯 HTML/JS Web 调试页
- **设计**：Apple 原生风格深色主题（`#000` 底 + `#0A84FF` 蓝）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | HTTP 服务端口 |
| `SPORT_DB_PATH` | `sport.db` | SQLite 数据库文件路径 |
