package service

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"beat_fit_server/internal/model"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// WSMessage WebSocket 通信消息结构
type WSMessage struct {
	Type      string      `json:"type"`           // joined/member_join/member_leave/training_started/room_created/room_closed
	User      *model.User `json:"user,omitempty"` // 关联用户信息
	Data      interface{} `json:"data,omitempty"` // 附加数据
	Timestamp int64       `json:"timestamp"`      // 毫秒时间戳
}

// WSClient 单个 WebSocket 客户端连接
type WSClient struct {
	UserID   uint64          // 用户ID
	RoomCode string          // 所在房间邀请码（大厅连接为 "lobby"）
	Conn     *websocket.Conn // WebSocket 连接
	Send     chan []byte     // 发送消息的缓冲通道
}

// WSHub 管理所有房间和大厅的 WebSocket 连接
type WSHub struct {
	mu    sync.RWMutex
	rooms map[string]map[*WSClient]bool // roomCode → 客户端集合（包括 "lobby" 大厅频道）
	db    *gorm.DB
}

// Hub 全局 WebSocket Hub 单例
var Hub *WSHub

// InitHub 初始化全局 WebSocket Hub
func InitHub(db *gorm.DB) {
	Hub = &WSHub{
		rooms: make(map[string]map[*WSClient]bool),
		db:    db,
	}
	log.Println("[WS] Hub 初始化完成")
}

// Register 注册新客户端连接到指定频道
func (h *WSHub) Register(client *WSClient) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[client.RoomCode] == nil {
		h.rooms[client.RoomCode] = make(map[*WSClient]bool)
	}
	h.rooms[client.RoomCode][client] = true
	log.Printf("[WS] 用户 %d 进入频道 %s (当前在线: %d)", client.UserID, client.RoomCode, len(h.rooms[client.RoomCode]))
}

// Unregister 从频道移除客户端连接
func (h *WSHub) Unregister(client *WSClient) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.rooms[client.RoomCode]; ok {
		if _, exists := clients[client]; exists {
			delete(clients, client)
			close(client.Send)
			log.Printf("[WS] 用户 %d 离开频道 %s", client.UserID, client.RoomCode)
		}
		if len(clients) == 0 {
			delete(h.rooms, client.RoomCode)
			log.Printf("[WS] 频道 %s 已清空", client.RoomCode)
		}
	}
}

// Broadcast 向频道内广播消息（排除发送者）
func (h *WSHub) Broadcast(channel string, senderID uint64, msg *WSMessage) {
	msg.Timestamp = time.Now().UnixMilli()
	h.mu.RLock()
	defer h.mu.RUnlock()

	data, _ := json.Marshal(msg)
	for client := range h.rooms[channel] {
		if client.UserID == senderID {
			continue
		}
		select {
		case client.Send <- data:
		default:
			go h.Unregister(client)
		}
	}
}

// BroadcastAll 向频道内所有成员广播消息
func (h *WSHub) BroadcastAll(channel string, msg *WSMessage) {
	msg.Timestamp = time.Now().UnixMilli()
	h.mu.RLock()
	defer h.mu.RUnlock()

	data, _ := json.Marshal(msg)
	for client := range h.rooms[channel] {
		select {
		case client.Send <- data:
		default:
			go h.Unregister(client)
		}
	}
}

// BroadcastLobby 向大厅所有在线用户广播
func (h *WSHub) BroadcastLobby(senderID uint64, msg *WSMessage) {
	h.Broadcast("lobby", senderID, msg)
}

// RoomOnlineCount 获取频道当前在线连接数
func (h *WSHub) RoomOnlineCount(channel string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[channel])
}
