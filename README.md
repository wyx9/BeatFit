# Beat Fit — 共享健身微信小程序

好友之间通过邀请码进入房间，一起完成训练计划，实时比拼排行榜。

## 项目架构

```
beat_fit/
├── miniprogram/                 # 微信小程序前端
│   ├── app.js / app.json        # 应用入口 + 全局配置
│   ├── app.wxss                 # 全局样式（设计令牌）
│   ├── config/
│   │   └── exercises.js         # 训练动作配置库（独立维护）
│   ├── utils/
│   │   └── api.js               # HTTP + WebSocket 请求封装
│   ├── pages/
│   │   ├── splash/              # 启动页（微信登录 / 游客登录）
│   │   ├── guest-login/         # 游客登录页
│   │   ├── lobby/               # 大厅（房间列表 + 加入/创建）
│   │   ├── create-room/         # 创建房间（选择动作 + 分类）
│   │   ├── room-waiting/        # 房间等待页（邀请码 + 成员列表）
│   │   ├── training/            # 训练中（倒计时 + 动作切换）
│   │   ├── leaderboard/         # 排行榜（时长/消耗/次数）
│   │   └── profile/             # 个人中心
│   └── images/                  # SVG 图标资源
│
├── server/                      # Go 后端服务
│   ├── main.go                  # 入口（路由注册 + 启动）
│   ├── config/
│   │   └── config.go            # 环境变量配置
│   ├── sql/
│   │   ├── init.sql             # 建表脚本
│   │   └── migrate.sql          # 迁移脚本
│   └── internal/
│       ├── handler/             # HTTP + WebSocket 处理层
│       │   ├── auth.go          # 登录 / 退出 / 活跃房间查询
│       │   ├── room.go          # 房间 CRUD + 解散 + 开始训练
│       │   ├── leaderboard.go   # 排行榜 + 训练上报
│       │   ├── ws.go            # WebSocket 房间 + 大厅连接
│       │   └── helper.go        # 工具函数
│       ├── service/             # 业务逻辑层
│       │   ├── auth.go          # 微信 code2session + JWT 签发
│       │   ├── room.go          # 邀请码生成 + 加入校验
│       │   ├── leaderboard.go   # Redis ZSET 排行 + MySQL 兜底
│       │   └── ws_hub.go        # WebSocket Hub（连接管理 + 广播）
│       ├── model/               # GORM 数据模型
│       │   ├── user.go          # 用户
│       │   ├── room.go          # 房间 + 成员
│       │   └── workout.go       # 训练记录
│       ├── middleware/
│       │   └── auth.go          # JWT 鉴权中间件
│       └── cache/
│           └── redis.go         # Redis 缓存封装
│
├── client/                      # HTML 原型图（AI 生成）
├── client_drawing/              # 新版 HTML 原型图
└── docs/                        # 设计文档
```

## 技术栈

| 层 | 技术 |
|-----|------|
| 前端 | 微信小程序原生框架 + 自定义组件 |
| 后端 | Go 1.22+ / Gin / GORM |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7（排行榜 ZSET / 房间在线 SET） |
| 实时通信 | gorilla/websocket（Hub 模式） |
| 鉴权 | JWT（Header Bearer + Query Token） |

## 数据流

```
用户 → wx.login() → 后端 /api/login → JWT Token
                                    ↓
大厅 ← GET /api/rooms ───────── 查询活跃房间
  ↓
创建房间 → POST /api/room → 生成4位邀请码 → 写入 MySQL
  ↓                                        ↓
房间等待页 ←── WS /ws/room/:code ──→ 房主/成员实时在线
  ↓
房主开始 → POST /api/room/start → WS 广播 training_started
  ↓
训练中 → 倒计时(动作/休息交替) → POST /api/workout/report
  ↓
排行榜 ← GET /api/leaderboard → Redis ZSET / MySQL 聚合
```

## 房间状态

| status | 状态 | 说明 |
|--------|------|------|
| 1 | 等待中 | 房主创建后，等待成员加入 |
| 2 | 进行中 | 房主点击开始训练 |
| 0 | 已结束 | 解散或过期 |

## 快速启动

### 后端

```bash
cd server

# 环境变量
export MYSQL_DSN="root:password@tcp(127.0.0.1:3306)/beat_fit?charset=utf8mb4&parseTime=True&loc=Local"
export REDIS_ADDR="127.0.0.1:6379"
export JWT_SECRET="your-secret-key"
export WX_APP_ID="your-appid"
export WX_APP_SECRET="your-appsecret"

# 启动
go run main.go
```

### 前端

微信开发者工具打开 `miniprogram/` 目录，勾选「不校验合法域名」即可预览。
