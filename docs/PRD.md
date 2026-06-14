# Beat Fit（律动健身）产品需求文档

> 最后更新: 2026-06-14 | 状态: 开发中 | 新增: 视觉动效设计

---

## 1. 产品概述

Beat Fit 是一个微信小程序，实现**好友之间同步健身**。用户通过 4 位邀请码进入房间，房主选择训练动作后开始训练，训练过程中各成员独立计时完成动作/休息交替循环，训练数据实时上报排行榜。

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

| 层 | 技术 |
|-----|------|
| 前端 | 微信小程序原生框架 |
| 后端 | Go 1.22+ / Gin 1.9 / GORM 1.25 |
| 数据库 | MySQL 8.0（4 张核心表） |
| 缓存 | Redis 7（ZSET 排行榜 + SET 在线人数 + STRING Token） |
| 实时通信 | gorilla/websocket 1.5（Hub 模式） |
| 鉴权 | JWT HS256（Header Bearer + Query Token） |

---

## 3. 用户决策记录

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-06-14 | 优先解决训练体验，其他功能后续迭代 | 训练是核心体验，直接影响用户留存 |
| 2026-06-14 | Profile MVP 只实现：训练记录 + 设置 | 成就徽章、关于页面非核心，暂缓 |
| 2026-06-14 | 底部导航「记录」按钮暂时隐藏 | 功能未实现，避免空壳入口 |
| 2026-06-14 | 训练动作图片 MVP 先不管 | 有图的展示，没图的用占位 |
| 2026-06-14 | 语音提示暂不实现，先用震动反馈 | 降低 MVP 复杂度，语音后续迭代 |

---

## 4. 当前开发重点：训练体验优化

> **优先级：最高** | **改动范围：纯前端，3 个文件**

### 4.1 计时器精度修复

**问题**：当前使用 `setInterval` 每 1000ms 递减 `countdownSec`，无时间戳补偿。JavaScript 单线程 + 小程序渲染流水线导致实际间隔 > 1000ms，长时间训练累积误差可达数十秒。

**方案**：改用 `Date.now()` 基准计时

```
elapsedMs = Date.now() - phaseStartTime - accumulatedPauseMs
remaining = totalPhaseSec - floor(elapsedMs / 1000)
```

**涉及函数**：`startCountdown()` → 完全重写

### 4.2 生命周期处理

**问题**：`training.js` 完全没有 `onShow`/`onHide`。切后台时计时器可能继续跑或被系统挂起，恢复后时间错乱。

**方案**：
- `onHide`：记录 `hiddenAt`，自动暂停计时器
- `onShow`：计算后台停留时长，补偿 `totalElapsedSec` 和 `phaseStartTime`

### 4.3 震动反馈

**问题**：阶段切换（动作→休息、休息→动作）纯视觉，用户低头看手机就会错过。

**方案**：使用微信 `wx.vibrateShort()` / `wx.vibrateLong()` API

| 时机 | 震动类型 |
|------|----------|
| 3-2-1 每次倒数 | 短震（light） |
| 动作阶段开始 | 中震（medium） |
| 进入休息阶段 | 短震（light） |
| 训练完成 | 长震（long） |

### 4.4 3-2-1 准备倒计时

**问题**：动作直接开始，用户没有准备时间。

**方案**：每个动作开始前弹出全屏半透明浮层，大字显示 3→2→1→开始，配合缩放动画 + 震动。

### 4.5 暂停体验优化

**问题**：暂停后 `setInterval` 仍在空转，每秒仍执行 `setData`，浪费性能。

**方案**：暂停时真正 `clearInterval`，恢复时用修正后的 `phaseStartTime` 重建计时器。

### 4.6 热量计算优化

**问题**：`kcal = elapsed * 5`，硬编码热耗率，不管动作类型。

**方案**：按动作标签使用不同 MET 系数

| 标签 | MET | kcal/秒（70kg） |
|------|-----|-----------------|
| 力量 | 6 | 0.117 |
| 塑形 | 5 | 0.097 |
| 肥大 | 6 | 0.117 |
| 复合 | 8 | 0.156 |
| 耐力 | 4 | 0.078 |
| 康复 | 3 | 0.058 |

### 4.7 涉及文件

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `miniprogram/pages/training/training.js` | 重写 | 主逻辑：计时器、生命周期、震动、倒计时、暂停、热量 |
| `miniprogram/pages/training/training.wxml` | 新增 | 3-2-1 倒计时浮层 |
| `miniprogram/pages/training/training.wxss` | 新增 | 倒计时浮层样式 |

---

## 5. 视觉动效设计

> **目标**：让 Beat Fit 的「律动」品牌名有视觉支撑，健身过程充满能量感和节奏感。
> **原则**：纯 CSS animation/keyframes/transition 实现，不依赖第三方库，性能优先（GPU 加速属性）。

### 5.1 训练页动效（🔴 最高优先级）

> 核心体验页面，动效收益最大。改动集中在 `training.wxss` + `training.wxml`。

#### A. 圆环呼吸感 — 持续

圆环做微弱的缩放呼吸（scale 1.0 ↔ 1.02，2 秒周期 ease-in-out 循环），模拟心跳节奏。

| 属性 | 值 |
|------|-----|
| 实现 | `.timer-ring-wrap { animation: breathe 2s ease-in-out infinite }` |
| 性能 | 极低（transform GPU 加速） |
| 暂停时 | 移除 animation / 设为 paused |

#### B. 阶段切换波纹 — 动作 ↔ 休息切换时

从圆环中心向外扩散一个圆形波纹，300ms 展开 + 淡出消失。

| 属性 | 值 |
|------|-----|
| 颜色 | 绿色波纹 = 进入动作阶段，蓝色波纹 = 进入休息阶段 |
| 实现 | 绝对定位 `<view>` 在圆环中心，动画 scale(0)→scale(3) + opacity 1→0 |
| 触发 | `nextPhase()` 中 setData 切换 phase 后触发 |

#### C. 组/动作完成粒子爆发 — 阶段完成时

圆环周围爆出 6-8 个绿色小光点，向外飞出 + 淡出。

| 属性 | 值 |
|------|-----|
| 实现 | WXML 中预置 6-8 个 `<view class="particle">`，CSS animation 控制 translate + opacity |
| 触发 | 一组或一个动作完成时 |
| 时长 | 600ms，一次性 |

#### D. 动作卡片滑入 — 切换动作时

旧卡片向左滑出，新卡片从右边滑入。

| 属性 | 值 |
|------|-----|
| 实现 | `.exercise-card { animation: slideInRight 0.3s ease-out }` |
| 触发 | `loadExercise()` 切换动作时 |

#### E. 3-2-1 倒计时动效 — 动作开始前

数字缩放 + 脉冲 + 归零时全屏绿色闪一下。

| 属性 | 值 |
|------|-----|
| 数字动画 | scale 0.3→1.15→1，300ms ease-out |
| 归零闪光 | `.countdown-flash { background: rgba(34,197,94,0.3); animation: flash 0.3s }` |
| 配合 | 震动反馈（4.3 节已定义） |

#### F. 训练完成彩带飘落 — 训练结束

屏幕顶部飘落绿色+金色纸屑（旋转的细长 view，不同延迟和速度）。

| 属性 | 值 |
|------|-----|
| 实现 | 10-15 个 `.confetti` view，不同 `animation-delay` 和 `animation-duration` |
| 动画 | translateY(0)→translateY(120vh) + rotate(0→720deg) + 水平摆动 |
| 时长 | 2-3s，一次性 |

---

### 5.2 大厅动效（🟡 中等优先级）

| # | 效果 | 说明 | 实现方式 |
|---|------|------|----------|
| A | 房间卡片 stagger 入场 | 列表加载后卡片依次从下方淡入，间隔 80ms | `.room-card:nth-child(n) { animation: fadeSlideUp 0.4s ease-out both; animation-delay: calc(n * 0.08s) }` |
| B | 在线人数呼吸点 | 房间卡片「进行中」绿色圆点做 1.5s 呼吸闪烁 | `.status-dot { animation: pulse 1.5s ease-in-out infinite }` |

---

### 5.3 排行榜动效（🟡 中等优先级）

| # | 效果 | 说明 | 实现方式 |
|---|------|------|----------|
| A | 领奖台搭建动画 | 前三名柱子从底部「长」起，带轻微 overshoot | `transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` |
| B | 皇冠光晕 | 第一名皇冠图标做金色光晕旋转 | `.icon-crown { animation: crownGlow 2s ease-in-out infinite }` + box-shadow |
| C | 排名数字滚动 | 用户自己的排名从 0 快速递增到实际值 | JS setInterval + setData，持续 800ms |

---

### 5.4 房间等待动效（🟢 较低优先级）

| # | 效果 | 说明 | 实现方式 |
|---|------|------|----------|
| A | 成员加入弹跳 | 新成员头像从右侧滑入 + 缩放弹跳 | `@keyframes bounceIn { 0%{scale:0.3} 50%{scale:1.1} 100%{scale:1} }` |
| B | 邀请码脉冲 | 4 位数字边框做微弱光晕脉冲 | `box-shadow: 0 0 0 0 rgba(34,197,94,0.4)` → `0 0 0 16rpx rgba(34,197,94,0)` |

---

### 5.5 全局动效（🟢 较低优先级）

| # | 效果 | 说明 |
|---|------|------|
| A | 页面过渡动画 | 统一页面进入/离开的滑动方向（前进左滑、后退右滑） |
| B | 按钮点击反馈增强 | 在现有 scale(0.96) 基础上加 50ms 的轻微弹性 |
| C | 数字跳动 | 用户累计数据（时长/消耗/次数）加载时从 0 递增到实际值 |

---

### 5.6 现有动效保留清单

以下动效已实现且效果良好，保留不动：

| 页面 | 动效 | 评价 |
|------|------|------|
| splash | `pulseRing`（英雄区光环脉冲） | ✅ 品牌感强 |
| splash | `fadeZoomIn`（Logo 入场） | ✅ 启动仪式感 |
| splash | `fadeSlideUp`（标语入场） | ✅ 层次感 |
| splash | `fadeSlideIn`（按钮入场） | ✅ 引导视线 |
| 全局 | `shimmerFlow`（按钮流光） | ✅ 吸引点击 |
| 全局 | `hover-class` + `scale(0.96-0.98)` | ✅ 统一反馈 |
| training | 进度条 `transition: width 0.5s ease` | ✅ 平滑过渡 |
| guest-login | `fadeIn` + `slideUp` | ✅ 入场自然 |

---

### 5.7 动效实施优先级总览

| 优先级 | 范围 | 改动量 | 建议时机 |
|--------|------|--------|----------|
| 🔴 最高 | 训练页 A-F（6 项） | ~150 行 CSS + ~30 行 WXML | 与训练体验优化一起做 |
| 🟡 中等 | 大厅 A-B + 排行榜 A-C | ~80 行 CSS + 少量 JS | 功能稳定后追加 |
| 🟢 较低 | 房间等待 A-B + 全局 A-C | ~60 行 CSS | 上线前润色 |

---

## 6. 上线准备计划（5 个 Phase）

### Phase 1 — 致命阻断（审核必须先修）

- 隐私协议页面 + 授权弹窗（`miniprogram/pages/privacy/`、`miniprogram/pages/terms/`）
- HTTPS/WSS 改造（`api.js` + 后端 TLS）
- 域名白名单配置（微信公众平台操作）

### Phase 2 — 安全底线

- JWT 密钥保护：空密钥 → `log.Fatalf` 拒绝启动
- Logout 真正生效：中间件校验 Redis token 存在
- 速率限制：登录/加入房间接口添加令牌桶限流

### Phase 3 — 功能可用

- 创建房间动作参数可编辑（4 个 `<input>` 添加 `bindinput`）
- Profile「我的训练记录」→ 新建训练历史列表页
- Profile「设置」→ 新建设置页（清除缓存、版本号）
- 底部导航隐藏「记录」按钮（4 个 WXML）
- WebSocket 断线重连（指数退避，最多 5 次）

### Phase 4 — 稳定性加固

- 类型断言 panic 修复（`helper.go`、`auth.go`、`leaderboard.go`）
- WebSocket 安全加固（ReadLimit 512→4096、CheckOrigin 收窄、连接数上限）
- 数据库事务包裹（CreateRoom、ReportWorkout）
- GORM 连接池配置（MaxIdleConns=10, MaxOpenConns=100）
- 关键错误日志（Redis、WebSocket、Handler）

### Phase 5 — 运维就绪

- 前端：全局错误捕获、版本更新检测、网络状态监听
- 后端：优雅关闭（SIGINT/SIGTERM）、结构化日志（slog）
- 健康检查升级（DB Ping + Redis Ping）
- Docker 化（Dockerfile + docker-compose.yml）

---

## 7. 后续迭代（功能优化）

> 以下为已讨论但暂不实施的方向，按优先级排列

### 6.1 社交/房间体验
- 房间聊天（文字 + 快捷表情）
- 房主踢人 / 转让房主
- 创建房间支持多部位混合训练

### 6.2 激励体系
- 排行榜增加周榜 / 总榜
- 用户等级升级规则（根据训练时长/次数自动升级）
- 连续打卡机制

### 6.3 数据价值
- 训练周报 / 月报
- 个人中心趋势变化图

### 6.4 训练体验进阶
- 语音提示（TTS 或预录音频）
- 训练中实时查看同房间成员进度
- 弱网/离线场景数据补传

### 6.5 内容运营
- 用户头像上传
- 成就徽章系统
- 房间背景音乐

---

## 8. 实施顺序（推荐）

```
训练体验优化 + 训练页动效（当前优先，纯前端）
    ↓
Phase 1: 致命阻断（审核必须先修，可并行）
    ↓
Phase 2: 安全底线
    ↓
Phase 3: 功能可用
    ↓
Phase 4: 稳定性加固
    ↓
Phase 5: 运维就绪
    ↓
全局动效润色（大厅/排行榜/房间等待 🟡🟢 优先级动效）
    ↓
后续迭代（按需）
```

训练体验优化和训练页动效（🔴 最高优先级）是纯前端改动，集中在 `training.*` 三个文件，可以与 Phase 1（后端为主）并行推进。

---

## 9. 相关文档

- [CLAUDE.md](../CLAUDE.md) — 项目技术基础文档
- [实施计划](../.claude/plans/1-2-claude-md-3-4-wobbly-turtle.md) — 详细实施计划（Phase 1-5）
