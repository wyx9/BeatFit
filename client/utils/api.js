const app = getApp()

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = app.globalData.baseUrl + path
    const params = {}
    if (data && data.user_id) {
      params.user_id = data.user_id
      delete data.user_id
    }
    // 始终附带 user_id
    if (app.globalData.userId && !params.user_id) {
      params.user_id = app.globalData.userId
    }
    const query = Object.keys(params).map(k => k + '=' + params[k]).join('&')
    const fullUrl = query ? url + '?' + query : url

    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  login: (nickname) => request('POST', '/api/login', { code: 'dev', nickname }),
  createRoom: (name, exercises) => request('POST', '/api/rooms', { name, exercises }),
  listRooms: () => request('GET', '/api/rooms'),
  getRoom: (code) => request('GET', '/api/rooms/' + code),
  joinRoom: (code) => request('POST', '/api/rooms/' + code + '/join', {}),
  startTraining: (code) => request('POST', '/api/rooms/' + code + '/start', {}),
  leaveRoom: (code) => request('POST', '/api/rooms/' + code + '/leave', {}),
  terminateTraining: (code) => request('POST', '/api/rooms/' + code + '/terminate', {})
}
