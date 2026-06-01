const app = getApp()

class WsClient {
  constructor() {
    this.socket = null
    this.listeners = {}
    this.reconnectTimer = null
    this.url = ''
  }

  // 连接房间 WebSocket
  connect(code) {
    const wsUrl = app.globalData.wsBaseUrl + '/ws/room/' + code + '?user_id=' + app.globalData.userId
    this._doConnect(wsUrl)
  }

  // 连接大厅 WebSocket（直接传完整 URL）
  connectRaw(url) {
    this._doConnect(url)
  }

  _doConnect(wsUrl) {
    this.url = wsUrl
    this.socket = wx.connectSocket({ url: wsUrl })

    this.socket.onOpen(() => {
      console.log('WS connected')
      this.emit('connected')
    })

    this.socket.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data)
        this.emit(msg.type, msg)
        this.emit('message', msg)
      } catch (e) {
        console.error('WS parse error:', e)
      }
    })

    this.socket.onClose(() => {
      console.log('WS closed')
      this.emit('disconnected')
    })

    this.socket.onError((err) => {
      console.error('WS error:', err)
    })
  }

  send(msg) {
    if (this.socket) {
      this.socket.send({ data: JSON.stringify(msg) })
    }
  }

  on(event, cb) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(cb)
  }

  off(event, cb) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(fn => fn !== cb)
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data))
    }
  }

  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}

module.exports = { WsClient }
