# CLAUDE.md — Beat Fit 项目基础文档

> 生成日期: 2026-06-14 | 基于当前代码库深度分析

---

## 1. 项目概述

**Beat Fit（律动健身）** 是一个微信小程序应用，实现好友之间**同步健身**。用户通过 4 位邀请码进入房间，房主选择训练动作后开始训练，训练过程中各成员独立计时完成动作/休息交替循环，训练数据实时上报排行榜，支持三种维度比拼（时长/消耗/次数）。

### 核心用户流程

```
启动页 → 微信登录 / 游客登录
      ↓
   大厅（浏览房间 + 输入邀请码加入 + 创建房间）
      ↓                           ↓
  加入房间 ←── 邀请码 ──→ 创建房间（选择训练部位 + 动作）
      ↓                           ↓
   房间等待页 ←── WebSocket 实时同步 ──→ 成员列表 + 邀请码展示
      ↓
  房主点击"开始训练" → WS 广播 → 所有成员自动跳转训练页
      ↓
  训练中（动作/休息交替倒计时 → 动作完成后下一组/下一动作）
      ↓
  训练完成 → 数据上报 → 自动解散房间 → 返回大厅
      ↓
  排行榜（时长/消耗/次数三维 tab 切换）
```

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|-----|------|------|
| 前端 | 微信小程序原生框架 | 无第三方 UI 库，自建设计系统 |
| 后端 | Go 1.22+ / Gin 1.9 | RESTful API + WebSocket |
| ORM | GORM 1.25 | AutoMigrate + 手动 SQL 迁移 |
| 数据库 | MySQL 8.0 | utf8mb4，4 张核心表 |
| 缓存 | Redis 7 | ZSET（排行榜）+ SET（在线人数）+ STRING（Token） |
| 实时通信 | gorilla/websocket 1.5 | Hub 模式管理多房间连接 |
| 鉴权 | JWT (golang-jwt/v5) | HS256 签名，7 天过期，Header Bearer + Query Token |

---

## 3. 项目结构

```
beat_fit/
├── CLAUDE.md                         # ← 本文件
├── README.md                         # 快速上手文档
│
├── miniprogram/                      # 微信小程序前端
│   ├── app.js                        # App 入口：全局 Page 包装 + 断线重连
│   ├── app.json                      # 页面注册（7页）+ 自定义导航栏
│   ├── app.wxss                      # 全局设计令牌（颜色/间距/圆角/字体）
│   ├── config/
│   │   └── exercises.js              # 训练动作配置库（6部位×6动作=36个动作）
│   ├── utils/
│   │   └── api.js                    # HTTP + WebSocket 请求封装（Token管理/地址适配）
│   └── pages/
│       ├── splash/                   # 启动页：微信登录 / 游客登录入口
│       ├── guest-login/              # 游客登录页：输入昵称
│       ├── lobby/                    # 大厅：房间列表 + 4位邀请码输入 + 创建房间入口
│       ├── create-room/              # 创建房间：部位Tab + 动作编辑 + 弹窗选择
│       ├── room-waiting/             # 房间等待页：邀请码展示 + 成员列表 + 开始/解散
│       ├── training/                 # 训练中：圆环倒计时 + 动作卡片 + 暂停/结束
│       ├── leaderboard/              # 排行榜：1-2-3名领奖台 + 排行列表 + 三维tab
│       └── profile/                  # 个人中心：用户数据 + 菜单 + 退出登录
│
├── server/                           # Go 后端服务
│   ├── main.go                       # 入口：DB自动建库→Redis→Hub→路由→启动
│   ├── go.mod / go.sum               # Go 依赖管理
│   ├── config/
│   │   └── config.go                 # 环境变量加载（6个配置项+默认值）
│   ├── sql/
│   │   ├── init.sql                  # 建表脚本（4表）
│   │   └── migrate.sql               # 迁移脚本（TEXT→JSON + expire_at字段）
│   └── internal/
│       ├── model/                    # GORM 数据模型 + 查询方法
│       │   ├── user.go               # User 表 + FindOrCreateByOpenid/FindByID/Save
│       │   ├── room.go               # Room + RoomMember 表 + CRUD + 分页查询
│       │   └── workout.go            # WorkoutLog 表 + 排行榜聚合查询
│       ├── handler/                  # HTTP + WebSocket 处理层（参数校验+响应）
│       │   ├── auth.go               # 登录/游客登录/用户信息/活跃房间/退出
│       │   ├── room.go               # 房间CRUD/加入/解散/开始/成员列表
│       │   ├── leaderboard.go        # 排行榜查询 + 训练上报
│       │   ├── ws.go                 # WebSocket 升级 + 读写协程
│       │   └── helper.go            # getUserID 工具函数
│       ├── service/                  # 业务逻辑层
│       │   ├── auth.go               # 微信code2session + 游客openid生成 + JWT签发
│       │   ├── room.go               # 邀请码生成 + 加入校验 + 房间创建
│       │   ├── leaderboard.go        # Redis ZSET查询 + MySQL兜底 + 异步回填
│       │   └── ws_hub.go             # WSHub：注册/注销/广播/BroadcastAll/BroadcastLobby
│       ├── middleware/
│       │   └── auth.go               # JWT鉴权：Header Bearer优先→Query兜底→注入ctx
│       └── cache/
│           └── redis.go              # Redis初始化 + ZSET/SET/STRING操作封装
│
├── client_drawing/                   # HTML 原型图（视觉设计参考）
└── docs/                             # 设计文档 + 实现计划
```

---

## 4. 数据库设计

### 4.1 MySQL 表结构

#### users（用户表）
| 列 | 类型 | 说明 |
|-----|------|------|
| id | BIGINT UNSIGNED PK | 自增主键 |
| openid | VARCHAR(64) UNIQUE | 微信openid（游客为 `guest_` + 随机hex） |
| nickname | VARCHAR(64) | 昵称 |
| avatar_url | VARCHAR(512) | 头像URL |
| level | INT DEFAULT 1 | 等级 |
| title | VARCHAR(32) | 称号（如"健身达人"） |
| total_min | INT DEFAULT 0 | 累计运动时长（分钟） |
| total_kcal | INT DEFAULT 0 | 累计消耗（千卡） |
| total_count | INT DEFAULT 0 | 累计运动次数 |
| created_at / updated_at | DATETIME | 自动维护 |

#### rooms（房间表）
| 列 | 类型 | 说明 |
|-----|------|------|
| id | BIGINT UNSIGNED PK | 自增主键 |
| owner_id | BIGINT UNSIGNED | 房主用户ID |
| name | VARCHAR(64) | 房间名称 |
| invite_code | VARCHAR(8) UNIQUE | 4位数字邀请码 |
| max_members | INT DEFAULT 20 | 最大人数上限 |
| status | TINYINT DEFAULT 1 | **1=等待中, 2=进行中, 0=已结束** |
| exercises | JSON | 训练动作JSON（MySQL JSON类型） |
| expire_at | DATETIME | 房间过期时间（创建+4小时） |
| started_at | DATETIME NULL | 训练开始时间 |
| total_min/kcal/count | INT | 房间累计数据 |
| created_at / updated_at | DATETIME | 自动维护 |

#### room_members（房间成员关联表）
| 列 | 类型 | 说明 |
|-----|------|------|
| id | BIGINT UNSIGNED PK | 自增 |
| room_id | BIGINT UNSIGNED | 房间ID |
| user_id | BIGINT UNSIGNED | 用户ID |
| joined_at | DATETIME | 加入时间 |
| UNIQUE(room_id, user_id) | | 防重复加入 |

#### workout_logs（训练记录表）
| 列 | 类型 | 说明 |
|-----|------|------|
| id | BIGINT UNSIGNED PK | 自增 |
| user_id | BIGINT UNSIGNED | 用户ID |
| room_id | BIGINT UNSIGNED DEFAULT 0 | 关联房间，0=个人训练 |
| minutes | INT | 本次训练时长（分钟） |
| kcal | INT | 本次消耗（千卡） |
| count | INT | 本次动作次数 |
| created_at | DATETIME | 记录时间 |

### 4.2 Redis 数据结构

| Key | 类型 | 说明 |
|-----|------|------|
| `leaderboard:duration` | ZSET | 今日时长排行（member=user_id, score=minutes） |
| `leaderboard:calories` | ZSET | 今日消耗排行 |
| `leaderboard:count` | ZSET | 今日次数排行 |
| `room:{code}:members` | SET | 房间当前在线 user_id 集合 |
| `user:{id}:token` | STRING | 用户 JWT token（7天过期，用于登出校验） |

---

## 5. API 接口完整参考

### 5.1 公开接口（无需鉴权）

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/health` | 健康检查 | — | `{"status":"ok"}` |
| POST | `/api/login` | 微信登录 | `{"code":"..."}` | `{"token":"jwt","user":{...}}` |
| POST | `/api/guest-login` | 游客登录 | `{"nickname":"..."}` | `{"token":"jwt","user":{...}}` |

### 5.2 鉴权接口（需要 Authorization: Bearer \<token\>）

| 方法 | 路径 | 说明 | 关键参数 |
|------|------|------|----------|
| POST | `/api/logout` | 退出登录 | — |
| GET | `/api/user/active-room` | 当前活跃房间 | — |
| GET | `/api/user/profile` | 用户信息 | — |
| PUT | `/api/user/profile` | 更新用户信息 | `{"nickname":"","avatar_url":""}` |
| GET | `/api/user/workouts` | 训练历史 | `?page=1&size=20` |
| GET | `/api/rooms` | 活跃房间列表 | `?page=1&size=20` |
| POST | `/api/room` | 创建房间 | `{"name":"","max_members":20,"exercises":[...]}` |
| POST | `/api/room/join` | 加入房间 | `{"invite_code":"4829"}` |
| POST | `/api/room/dissolve` | 解散房间 | `{"room_id":1}` |
| POST | `/api/room/start` | 开始训练 | `{"room_id":1}` |
| GET | `/api/room/members` | 房间成员 | `?room_id=1` |
| GET | `/api/leaderboard` | 排行榜 | `?type=duration&date=2026-06-14` |
| POST | `/api/workout/report` | 训练上报 | `{"room_id":1,"minutes":30,"kcal":200,"count":120}` |

### 5.3 WebSocket 接口

| 路径 | 鉴权方式 | 说明 |
|------|----------|------|
| `/ws/room/:code` | Query `?token=` | 房间实时通信 |
| `/ws/lobby` | Query `?token=` | 大厅广播通知 |

### 5.4 WebSocket 消息类型

| type | 方向 | 触发时机 | data 内容 |
|------|------|----------|-----------|
| `joined` | S→C（自身） | 连接成功 | `{"online_count":N}` |
| `member_joined` | S→广播 | 有新成员加入 | `{"member_count":N}` |
| `training_started` | S→广播 | 房主开始训练 | `{"exercises":"...","started_at":"...","room_id":N}` |
| `room_created` | S→大厅 | 新房间创建 | `{"room":{...}}` |

---

## 6. 房间生命周期状态机

```
                   房主创建
                      ↓
              ┌──────────────────┐
              │  status=1 等待中  │ ← 创建后默认状态，4小时后过期
              │  (可加入/可解散)   │
              └──────┬───────────┘
                     │ 房主调用 POST /api/room/start
                     ↓
              ┌──────────────────┐
              │  status=2 进行中  │ ← WS 广播 training_started
              │  (不可加入)       │    所有成员跳转训练页
              └──────┬───────────┘
                     │ 训练完成 或 房主解散
                     ↓
              ┌──────────────────┐
              │  status=0 已结束  │ ← 房间不可见、不可加入
              └──────────────────┘
```

---

## 7. 前端关键设计

### 7.1 页面导航图

```
splash ──→ guest-login ──→ lobby ──→ create-room ──→ room-waiting ──→ training
  │                            │          ↑                                  │
  │                            │          └── 加入成功 ──────────────────────┘│
  │                            ↓                                              │
  │                        leaderboard ←─────────────────────────────────────┘
  │                            ↓
  └────── 退出登录 ←────── profile
```

### 7.2 设计令牌（app.wxss）

```
--color-primary: #22c55e      主色（绿色）
--color-background: #ffffff   背景
--color-surface: #ffffff      卡片表面
--color-on-surface: #131313   主文字
--color-outline: #e2e8f0      描边
--spacing-gutter: 16px        页边距
--radius-pill: 9999px         胶囊圆角
--radius-lg: 2rem             大圆角
```

### 7.3 训练动作配置（config/exercises.js）

6 个训练部位，每个部位 6 个动作，每个动作含：
- `name`: 动作名称
- `tag`: 标签（力量/塑形/肥大/复合/耐力/康复）
- `sets`: 组数
- `reps`: 每组次数
- `duration_sec`: 每组动作时长（秒）
- `rest_sec`: 组间休息时长（秒）
- `image`: 动作示意图路径（可选）

部位 key：`back` / `chest` / `legs` / `shoulder` / `arms` / `core`

### 7.4 训练页逻辑

训练由 **动作×组数** 的序列驱动：
```
动作1: 组1(运动→休息) → 组2(运动→休息) → ... → 组N
动作2: 组1(运动→休息) → 组2(运动→休息) → ... → 组N
...
训练完成 → 上报数据 → 解散房间
```

- 运动阶段：倒计时 `duration_sec` 秒，圆环进度动画
- 休息阶段：倒计时 `rest_sec` 秒，圆环进度动画
- 支持暂停/继续
- 总时长进度条

### 7.5 网络层（utils/api.js）

- **地址适配**：模拟器 → `127.0.0.1:8080`，真机 → 配置的局域网 IP
- **Token 管理**：`wx.getStorageSync('token')`，请求自动带 Authorization Header
- **WebSocket**：自动拼接 `?token=` 参数（因 wx.connectSocket 无法设置 Header）
- **兜底策略**：后端不可用时各页面有静态数据降级（lobby/leaderboard/profile）
- **过渡动画**：`wx.showLoading({mask:true})` → 新页面 `onShow` 自动 `hideLoading`

---

## 8. 后端关键设计

### 8.1 分层架构

```
HTTP Request
    ↓
Gin Router → middleware.AuthRequired (JWT验证)
    ↓
Handler 层 (参数校验 + 序列化响应)
    ↓
Service 层 (业务逻辑)
    ↓
Model 层 (GORM 数据操作)  +  Cache 层 (Redis)
    ↓
MySQL / Redis
```

### 8.2 鉴权流程

```
1. 请求到达 → middleware.AuthRequired
2. 优先从 Header: Authorization: Bearer <token> 提取
3. Header 无值时从 Query: ?token= 提取（WebSocket 兼容）
4. JWT 解析 → 提取 user_id → c.Set("user_id", userID)
5. 后续 Handler 通过 getUserID(c) 获取
```

### 8.3 排行榜策略

```
查询流程:
  GET /api/leaderboard?type=duration
    ↓
  1. 尝试 Redis ZREVRANGE leaderboard:duration 0 49
    ├── 有数据 → 补全用户信息 → 返回
    └── 无数据
        ↓
  2. MySQL 聚合查询 (SUM(minutes) GROUP BY user_id)
    ↓
  3. 异步回填 Redis ZSET (ZINCRBY)
    ↓
  4. 设置 Redis key 在次日凌晨过期

写入流程:
  POST /api/workout/report
    ↓
  1. 写入 workout_logs 表
  2. 更新 users 累计字段 (total_min/total_kcal/total_count)
  3. 更新 Redis 三个排行榜 ZSET (ZINCRBY)
```

### 8.4 WebSocket Hub 设计

- **全局单例** `service.Hub`，在 `main.go` 初始化
- **数据结构**：`map[string]map[*WSClient]bool`（roomCode → 客户端集合）
- **lobby** 作为特殊频道（roomCode = "lobby"），用于大厅广播
- **读写分离**：每个连接启动 `readPump` + `writePump` 两个 goroutine
- **心跳**：writePump 每 30s 发送 Ping，readPump 设置 60s Pong 超时
- **发送缓冲**：每个客户端 64 容量的缓冲 channel
- **安全关闭**：缓冲满时异步 Unregister，防止阻塞

---

## 9. 环境变量

部署时需要设置以下环境变量：

```bash
SERVER_PORT=8080                           # 服务端口
MYSQL_DSN="root:password@tcp(127.0.0.1:3306)/beat_fit?charset=utf8mb4&parseTime=True&loc=Local"
REDIS_ADDR="127.0.0.1:6379"                # Redis 地址
REDIS_PASS=""                              # Redis 密码（可选）
JWT_SECRET="your-secret-key"               # JWT 签名密钥（必填）
WX_APP_ID="wx538ae018ebe83b8a"             # 微信小程序 AppID
WX_APP_SECRET="your-appsecret"             # 微信小程序 AppSecret
```

### 前后端连接配置

- 小程序开发者工具 → `127.0.0.1:8080`（自动识别）
- 真机调试 → 需修改 `miniprogram/utils/api.js` 中的 `DEVICE_IP` 为电脑局域网 IP
- 生产环境 → 需在微信公众平台配置合法域名 + HTTPS

---

## 10. 快速启动

### 后端

```bash
cd server

# 设置环境变量后启动
export MYSQL_DSN="root:password@tcp(127.0.0.1:3306)/beat_fit?charset=utf8mb4&parseTime=True&loc=Local"
export REDIS_ADDR="127.0.0.1:6379"
export JWT_SECRET="dev-secret-key"
export WX_APP_ID="wx_app_id"
export WX_APP_SECRET="wx_app_secret"

go run main.go
# → Beat Fit 服务启动 → http://localhost:8080
```

### 前端

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. AppID 使用 `wx538ae018ebe83b8a`
4. 开发阶段勾选「不校验合法域名」

---

## 11. 开发注意事项

1. **DB 自动建库**：`main.go` 的 `ensureDatabase()` 会自动创建 `beat_fit` 数据库（如不存在）
2. **GORM AutoMigrate**：启动时自动建表/补字段，生产环境建议手动 SQL
3. **exercises 字段修复**：`main.go` 启动时执行 `ALTER TABLE rooms MODIFY COLUMN exercises JSON` 确保中文支持
4. **房间过期**：`expire_at` = 创建时间 + 4小时，列表查询过滤 `expire_at > NOW()`
5. **创建房间只提交当前页签动作**：`create-room.js` 的 `handleCreate()` 只收集 `activePart` 页签下的动作
6. **训练完成自动解散**：`training.js` 训练完成时调用 `dissolveRoom()`
7. **断线重连**：`app.js` 的 `reconnectIfNeeded()` 在小程序从后台恢复时检查活跃房间并恢复页面
8. **游客模式生成唯一ID**：`guest_` 前缀 + 16位随机hex字符串
9. **游客登录降级**：后端不可用时本地缓存用户信息继续使用（无房间功能）
10. **module.exports vs ES import**：前端使用 CommonJS 模块系统
11. **真机 IP 配置**：`utils/api.js` 中的 `DEVICE_IP` 需随 DHCP 分配的 IP 更新

---

## 12. 已有功能 vs 待开发

### 已实现功能
- [x] 微信登录 / 游客登录
- [x] 大厅房间列表（静态降级）
- [x] 4位邀请码创建/加入房间
- [x] 房间等待页（成员列表 + WS 实时同步）
- [x] 训练动作配置库（6部位×36动作）
- [x] 训练页（动作/休息交替倒计时）
- [x] 排行榜（三维 tab：时长/消耗/次数）
- [x] 个人中心（用户数据 + 退出登录）
- [x] JWT 鉴权
- [x] WebSocket 实时通信
- [x] Redis 排行榜缓存
- [x] 断线重连

### 待开发 / 可优化
- [ ] 用户头像上传（目前只有占位图）
- [ ] 成就徽章系统（profile 页菜单已预留入口）
- [ ] 训练记录历史页
- [ ] 房间背景音乐
- [ ] 房间人数上限可配置
- [ ] 训练动作参数可编辑（目前输入框只展示不可修改）
- [ ] 排行榜历史日期查询
- [ ] 用户等级升级逻辑
- [ ] HTTPS + 域名配置（生产环境）
