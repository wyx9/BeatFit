package service

import (
	"encoding/json"
	"sync"
	"time"

	"beatfit/model"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type RoomSession struct {
	Code       string
	OwnerID    string
	Exercises  []model.ExerciseInfo
	Clients    map[string]*Client
	Broadcast  chan []byte

	// 训练状态
	training          bool
	currentIdx        int
	currentSet        int       // 当前第几组 (1-based)
	currentPhase      string    // "active" 或 "rest"
	exerciseStartTime time.Time // 当前阶段开始时间，用于计算重连时剩余秒数
	timerStop         chan struct{}
	timerPause        chan bool

	mu sync.RWMutex
}

type Hub struct {
	rooms       map[string]*RoomSession
	lobbyClients map[string]*Client // 大厅客户端（在首页的用户），不在任何房间内
	mu          sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms:        make(map[string]*RoomSession),
		lobbyClients: make(map[string]*Client),
	}
}

// 添加大厅客户端（用户在首页时连接）
func (h *Hub) AddLobbyClient(userID string, conn *websocket.Conn) {
	client := &Client{
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 64),
	}
	h.mu.Lock()
	h.lobbyClients[userID] = client
	h.mu.Unlock()

	go h.writeLobbyPump(client)
}

// 移除大厅客户端（用户离开首页或进入房间时）
func (h *Hub) RemoveLobbyClient(userID string) {
	h.mu.Lock()
	if c, ok := h.lobbyClients[userID]; ok {
		close(c.Send)
		delete(h.lobbyClients, userID)
	}
	h.mu.Unlock()
}

// 向所有大厅客户端广播消息（如新房创建通知）
func (h *Hub) BroadcastLobby(msg model.WSMessage) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, c := range h.lobbyClients {
		select {
		case c.Send <- data:
		default:
		}
	}
}

func (h *Hub) writeLobbyPump(client *Client) {
	defer client.Conn.Close()
	for msg := range client.Send {
		if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (h *Hub) GetOrCreateRoom(code, ownerID string, exercises []model.ExerciseInfo) *RoomSession {
	h.mu.Lock()
	defer h.mu.Unlock()

	if rs, ok := h.rooms[code]; ok {
		return rs
	}

	rs := &RoomSession{
		Code:       code,
		OwnerID:    ownerID,
		Exercises:  exercises,
		Clients:    make(map[string]*Client),
		Broadcast:  make(chan []byte, 256),
		timerStop:  make(chan struct{}),
		timerPause: make(chan bool),
	}
	h.rooms[code] = rs

	go rs.run()
	return rs
}

func (h *Hub) GetRoom(code string) *RoomSession {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[code]
}

func (h *Hub) RemoveRoom(code string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if rs, ok := h.rooms[code]; ok {
		rs.stopTimer()
		close(rs.Broadcast)
		delete(h.rooms, code)
	}
}

func (rs *RoomSession) run() {
	for msg := range rs.Broadcast {
		rs.mu.RLock()
		for _, c := range rs.Clients {
			select {
			case c.Send <- msg:
			default:
			}
		}
		rs.mu.RUnlock()
	}
}

func (rs *RoomSession) AddClient(userID string, conn *websocket.Conn) {
	client := &Client{
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 64),
	}

	rs.mu.Lock()
	if old, ok := rs.Clients[userID]; ok {
		close(old.Send)
	}
	rs.Clients[userID] = client

	// 如果训练正在进行，向新客户端发送当前进度
	if rs.training && rs.currentIdx < len(rs.Exercises) {
		elapsed := int(time.Since(rs.exerciseStartTime).Seconds())
		var totalSec int
		if rs.currentPhase == "rest" {
			totalSec = rs.Exercises[rs.currentIdx].RestSeconds
		} else {
			totalSec = rs.Exercises[rs.currentIdx].DurationSeconds
		}
		remaining := totalSec - elapsed
		if remaining < 0 {
			remaining = 0
		}
		resume := model.TrainingResumeData{
			Exercises:    rs.Exercises,
			CurrentIndex: rs.currentIdx,
			SetNumber:    rs.currentSet,
			SecondsLeft:  remaining,
			TotalSeconds: totalSec,
			Phase:        rs.currentPhase,
		}
		data, _ := json.Marshal(model.WSMessage{Type: "training_resume", Data: resume})
		select {
		case client.Send <- data:
		default:
		}
	}
	rs.mu.Unlock()

	go rs.writePump(client)
}

func (rs *RoomSession) RemoveClient(userID string) {
	rs.mu.Lock()
	if c, ok := rs.Clients[userID]; ok {
		close(c.Send)
		delete(rs.Clients, userID)
	}
	rs.mu.Unlock()
}

func (rs *RoomSession) ClientCount() int {
	rs.mu.RLock()
	defer rs.mu.RUnlock()
	return len(rs.Clients)
}

func (rs *RoomSession) BroadcastMessage(msg model.WSMessage) {
	data, _ := json.Marshal(msg)
	rs.Broadcast <- data
}

func (rs *RoomSession) writePump(client *Client) {
	defer client.Conn.Close()
	for msg := range client.Send {
		if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

// 训练逻辑

func (rs *RoomSession) StartTraining() {
	rs.mu.Lock()
	if rs.training {
		rs.mu.Unlock()
		return
	}
	rs.training = true
	rs.currentIdx = 0
	rs.currentSet = 1
	rs.currentPhase = "active"
	rs.exerciseStartTime = time.Now()
	rs.mu.Unlock()

	// 计算总时长（所有动作的总秒数）
	totalDuration := 0
	for _, e := range rs.Exercises {
		for s := 0; s < e.Sets; s++ {
			totalDuration += e.DurationSeconds
			if s < e.Sets-1 {
				totalDuration += e.RestSeconds
			}
		}
	}

	rs.BroadcastMessage(model.WSMessage{
		Type: "training_started",
		Data: model.TrainingStartData{
			Exercises:     rs.Exercises,
			CurrentIndex:  0,
			TotalDuration: totalDuration,
		},
	})

	go rs.runTimer()
}

// 训练计时器：动作循环内嵌套组循环，每组 active → rest
func (rs *RoomSession) runTimer() {
	for {
		rs.mu.RLock()
		if !rs.training || rs.currentIdx >= len(rs.Exercises) {
			rs.mu.RUnlock()
			return
		}
		idx := rs.currentIdx
		exercise := rs.Exercises[idx]
		rs.mu.RUnlock()

		// 遍历该动作的每一组
		for set := 1; set <= exercise.Sets; set++ {
			// ---- 动作阶段 ----
			rs.mu.Lock()
			rs.currentSet = set
			rs.currentPhase = "active"
			rs.exerciseStartTime = time.Now()
			rs.mu.Unlock()

			if !rs.countdown(exercise.DurationSeconds, idx, set, "active", exercise.Name) {
				return // 被终止
			}

			// 最后一组不需要休息
			if set == exercise.Sets {
				break
			}

			// ---- 休息阶段 ----
			rs.mu.Lock()
			rs.currentPhase = "rest"
			rs.exerciseStartTime = time.Now()
			rs.mu.Unlock()

			if !rs.countdown(exercise.RestSeconds, idx, set, "rest", exercise.Name) {
				return // 被终止
			}
		}

		// 切换到下一个动作
		rs.mu.Lock()
		rs.currentIdx++
		rs.currentSet = 1
		rs.currentPhase = "active"
		rs.exerciseStartTime = time.Now()
		nextIdx := rs.currentIdx
		rs.mu.Unlock()

		if nextIdx >= len(rs.Exercises) {
			rs.BroadcastMessage(model.WSMessage{
				Type: "training_complete",
				Data: nil,
			})
			rs.mu.Lock()
			rs.training = false
			rs.mu.Unlock()
			return
		}

		nextEx := rs.Exercises[nextIdx]
		rs.BroadcastMessage(model.WSMessage{
			Type: "exercise_change",
			Data: model.ExerciseChangeData{
				ExerciseIndex: nextIdx,
				Exercise:      nextEx,
				TotalDuration: nextEx.DurationSeconds,
			},
		})
	}
}

// countdown 倒计时 total 秒，每秒广播 timer_tick，被终止返回 false
func (rs *RoomSession) countdown(totalSec int, exIdx, setNum int, phase, exName string) bool {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	remaining := totalSec
	for remaining > 0 {
		select {
		case <-ticker.C:
			remaining--
			rs.BroadcastMessage(model.WSMessage{
				Type: "timer_tick",
				Data: model.TimerTickData{
					SecondsLeft:   remaining,
					ExerciseIndex: exIdx,
					TotalSeconds:  totalSec,
					SetNumber:     setNum,
					TotalSets:     rs.Exercises[exIdx].Sets,
					Phase:         phase,
					ExerciseName:  exName,
				},
			})
		case <-rs.timerStop:
			return false
		}
	}
	return true
}

func (rs *RoomSession) stopTimer() {
	select {
	case rs.timerStop <- struct{}{}:
	default:
	}
}

// 终止训练：房主主动停止，所有玩家返回大厅
func (rs *RoomSession) Terminate() {
	rs.mu.Lock()
	if !rs.training {
		rs.mu.Unlock()
		return
	}
	rs.stopTimer()
	rs.training = false
	rs.mu.Unlock()

	// 广播终止消息到所有客户端，客户端收到后跳回首页
	rs.BroadcastMessage(model.WSMessage{
		Type: "training_terminated",
		Data: nil,
	})

	// 短暂延迟后关闭所有客户端连接，触发各客户端断开
	time.Sleep(200 * time.Millisecond)
	rs.mu.RLock()
	for _, c := range rs.Clients {
		c.Conn.Close()
	}
	rs.mu.RUnlock()
}

func (rs *RoomSession) GetMembers() []string {
	rs.mu.RLock()
	defer rs.mu.RUnlock()

	members := make([]string, 0, len(rs.Clients))
	for uid := range rs.Clients {
		members = append(members, uid)
	}
	return members
}
