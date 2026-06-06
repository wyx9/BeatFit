// ===== API 工具层 =====

// 后端服务地址（自动适配模拟器和真机）
// 模拟器用 127.0.0.1，真机用电脑局域网 IP
// ★ IP 地址从 DHCP 动态分配，如果变了需要改这里的 DEVICE_IP
const DEVICE_IP = '192.168.1.23'  // ← PC 局域网 IP（用 ipconfig 查看）

function getBaseUrl() {
  const platform = wx.getSystemInfoSync().platform
  if (platform === 'devtools') {
    return 'http://127.0.0.1:8080'
  }
  return 'http://' + DEVICE_IP + ':8080'
}

// ===== Token 管理 =====

// 获取本地存储的 token
function getToken() {
  return wx.getStorageSync('token') || ''
}

// 保存 token 到本地
function setToken(token) {
  wx.setStorageSync('token', token)
}

// 清除 token（退出登录）
function clearToken() {
  wx.removeStorageSync('token')
}

// 保存用户信息到本地
function setUserInfo(user) {
  wx.setStorageSync('userInfo', user)
}

// 获取本地缓存的用户信息
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null
}

// ===== 通用请求封装 =====

// request 封装 wx.request，自动携带 Authorization header
function request(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken()

    // 需要鉴权的接口，如果没有 token 则拒绝，让调用方处理
    const authPaths = ['/api/rooms', '/api/room', '/api/leaderboard', '/api/workout']
    const needAuth = authPaths.some(p => path.startsWith(p))
    if (needAuth && !token) {
      reject(new Error('请先登录'))
      return
    }

    wx.request({
      url: getBaseUrl() + path,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const msg = (res.data && res.data.error) ? res.data.error : '请求失败'
          reject(new Error(msg))
        }
      },
      fail(err) {
        reject(new Error('网络连接失败，请检查后端服务是否启动'))
      }
    })
  })
}

// ===== API 接口 =====

// 退出登录
function logout() {
  return request('POST', '/api/logout')
}

// 游客登录
function guestLogin(nickname) {
  return request('POST', '/api/guest-login', { nickname: nickname })
}

// 微信登录
function login(code) {
  return request('POST', '/api/login', { code: code })
}

// 获取活跃房间列表
function getRooms(page = 1, size = 20) {
  return request('GET', '/api/rooms?page=' + page + '&size=' + size)
}

// 创建房间
function createRoom(name, maxMembers = 20, exercises = []) {
  return request('POST', '/api/room', { name: name, max_members: maxMembers, exercises: exercises })
}

// 查询当前用户活跃房间（断线重连用）
function getActiveRoom() {
  return request('GET', '/api/user/active-room')
}

// 获取房间成员
function getRoomMembers(roomId) {
  return request('GET', '/api/room/members?room_id=' + roomId)
}

// 开始训练（仅房主）
function startRoom(roomId) {
  return request('POST', '/api/room/start', { room_id: roomId })
}

// 带过渡动画的页面跳转（半透明遮罩 → 新页面 onShow 自动清除）
function navTo(url, method) {
  method = method || 'navigateTo'
  wx.showLoading({ mask: true, title: '' })
  wx[method]({ url: url, fail: () => wx.hideLoading() })
}

// 解散房间
function dissolveRoom(roomId) {
  return request('POST', '/api/room/dissolve', { room_id: roomId })
}

// 加入房间（通过邀请码）
function joinRoom(inviteCode) {
  return request('POST', '/api/room/join', { invite_code: inviteCode })
}

// 获取排行榜 type: duration / calories / count
function getLeaderboard(type = 'duration', date = '') {
  if (!date) {
    // 计算当日日期
    const now = new Date()
    date = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0')
  }
  return request('GET', '/api/leaderboard?type=' + type + '&date=' + date)
}

// 上报训练数据
function reportWorkout(roomId, minutes, kcal, count) {
  return request('POST', '/api/workout/report', {
    room_id: roomId,
    minutes: minutes,
    kcal: kcal,
    count: count
  })
}

// ===== WebSocket 连接 =====

function connectWS(path, onMessage) {
  const token = getToken()
  if (!token) return null

  // 构造 WebSocket URL：ws://ip:port/path?token=xxx
  const baseUrl = getBaseUrl()
  const wsUrl = baseUrl.replace(/^http/, 'ws') + path
  const url = wsUrl + (wsUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)

  const ws = wx.connectSocket({ url: url })

  ws.onOpen(() => { console.log('[WS] 已连接:', path) })
  ws.onMessage((res) => {
    try {
      const msg = JSON.parse(res.data)
      if (onMessage) onMessage(msg)
    } catch(e) {}
  })
  ws.onError((err) => { console.log('[WS] 失败:', path, err.errMsg || '') })
  ws.onClose(() => { console.log('[WS] 断开:', path) })

  return ws
}

function closeWS(ws) {
  if (!ws) return
  // 延迟关闭避免连接未就绪时报 task not found
  setTimeout(() => {
    try { ws.close({ code: 1000, reason: 'page unload' }) } catch(e) {}
  }, 100)
}

module.exports = {
  getToken,
  setToken,
  clearToken,
  setUserInfo,
  getUserInfo,
  logout,
  guestLogin,
  login,
  getRooms,
  createRoom,
  dissolveRoom,
  joinRoom,
  getLeaderboard,
  reportWorkout,
  startRoom,
  getActiveRoom,
  navTo,
  getRoomMembers,
  connectWS,
  closeWS
}
