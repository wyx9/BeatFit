# BeatFit — 多人实时同步健身

好友进入房间后共同开始训练，房主选择健身动作和计划，全员同步计时完成锻炼。

## 架构

```
client/ (微信小程序)  ←→  HTTP/WebSocket  ←→  server/ (Go 后端)
                                                  └── SQLite
```

## 功能

- **房间系统**：房主创建房间，生成 6 位房间码，好友输入房码加入
- **动作预设库**：5 大分类（胸/背/腿/手臂/核心），每类 6+ 个预设动作，含默认时长和图标
- **实时同步训练**：房主开始训练后，所有成员同步看到当前动作和倒计时
- **训练重连**：刷新页面自动恢复训练进度，无需重新加入
- **终止训练**：房主可随时终止，所有成员返回大厅
- **大厅通知**：新房创建时，首页所有用户实时看到房间列表刷新

## 快速开始

### 后端

```bash
cd server
GOPROXY=https://goproxy.cn,direct go run main.go
# 访问 http://localhost:8080/static/test.html 进行 Web 调试
```

### 微信小程序

用微信开发者工具打开 `client/` 目录，修改 `app.js` 中的后端地址。

## 项目结构

```
├── server/                 # Go 后端
│   ├── main.go             # 入口：路由注册 + 优雅关闭
│   ├── handler/            # HTTP + WebSocket 处理器
│   │   ├── user.go         # 登录/注册
│   │   ├── room.go         # 房间 CRUD + 训练控制
│   │   └── ws.go           # 房间 WS + 大厅 WS
│   ├── model/model.go      # 数据模型 + 请求/响应 + WS 消息类型
│   ├── service/
│   │   ├── room.go         # 房间业务逻辑
│   │   └── hub.go          # WebSocket Hub：连接管理 + 训练计时器
│   ├── store/sqlite.go     # SQLite 存储层
│   └── static/test.html    # Web 调试页面（编译时嵌入二进制）
└── client/                 # 微信小程序
    ├── app.js / app.json
    ├── utils/
    │   ├── api.js          # HTTP 请求封装
    │   └── ws.js           # WebSocket 客户端封装
    └── pages/
        ├── index/          # 首页：登录 + 房间列表 + 加入
        ├── create/         # 创建房间：分类选择预设动作
        ├── room/           # 等待室：成员列表 + 训练计划
        └── training/       # 训练页：实时计时器 + 当前动作
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| POST | `/api/rooms` | 创建房间 |
| GET | `/api/rooms` | 活跃房间列表 |
| GET | `/api/rooms/:code` | 房间详情 |
| POST | `/api/rooms/:code/join` | 加入房间 |
| POST | `/api/rooms/:code/start` | 开始训练（房主） |
| POST | `/api/rooms/:code/terminate` | 终止训练（房主） |
| POST | `/api/rooms/:code/leave` | 离开房间 |
| WS | `/ws/lobby` | 大厅通知 |
| WS | `/ws/room/:code` | 房间实时同步 |

## WebSocket 消息

**服务端 → 客户端（训练同步）**
- `training_started` — 训练开始，含完整动作列表
- `timer_tick` — 每秒倒计时
- `exercise_change` — 切换到下一个动作
- `training_resume` — 重连时下发当前进度
- `training_complete` — 全部完成
- `training_terminated` — 房主终止训练

## 技术栈

- **后端**：Go + Gin + Gorilla WebSocket + SQLite（纯 Go 驱动，免 CGO）
- **前端**：微信小程序（原生）+ Web 调试页（纯 HTML/JS）
