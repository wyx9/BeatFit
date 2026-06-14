package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"beat_fit_server/internal/model"
	"beat_fit_server/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// 允许的 WebSocket 来源域名（逗号分隔），由 WS_ORIGINS 环境变量配置
var allowedWSOrigins = loadWSOrigins()

func loadWSOrigins() map[string]bool {
	origins := make(map[string]bool)
	if env := os.Getenv("WS_ORIGINS"); env != "" {
		for _, o := range strings.Split(env, ",") {
			if t := strings.TrimSpace(o); t != "" {
				origins[t] = true
			}
		}
	}
	return origins
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // 非浏览器客户端（小程序/curl），Origin 为空直接放行
		}
		// WS_ORIGINS 未配置时，允许所有来源（开发模式）
		if len(allowedWSOrigins) == 0 {
			return true
		}
		return allowedWSOrigins[origin]
	},
}

const wsReadLimit = 4096 // WebSocket 读取消息大小上限
type WSHandler struct {
	db *gorm.DB
}

// NewWSHandler 创建 WSHandler 实例
func NewWSHandler(db *gorm.DB) *WSHandler {
	return &WSHandler{db: db}
}

// handleWS 通用 WebSocket 连接处理
func (h *WSHandler) handleWS(c *gin.Context, channel string) {
	userID := getUserID(c)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WS] 升级失败: %v", err)
		return
	}

	user, err := model.FindByID(h.db, userID)
	if err != nil {
		conn.Close()
		return
	}

	client := &service.WSClient{
		UserID:   userID,
		RoomCode: channel,
		Conn:     conn,
		Send:     make(chan []byte, 64),
	}
	if err := service.Hub.Register(client); err != nil {
		log.Printf("[WS] 注册失败: %v", err)
		conn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.ClosePolicyViolation, err.Error()))
		conn.Close()
		return
	}

	// 发送加入成功消息
	joinMsg := &service.WSMessage{
		Type: "joined",
		User: user,
		Data: gin.H{"online_count": service.Hub.RoomOnlineCount(channel)},
	}
	joinData, _ := json.Marshal(joinMsg)
	client.Send <- joinData

	go h.writePump(client)
	go h.readPump(client)
}

// HandleRoomWS 处理房间 WebSocket GET /ws/room/:code
func (h *WSHandler) HandleRoomWS(c *gin.Context) {
	h.handleWS(c, c.Param("code"))
}

// HandleLobbyWS 处理大厅 WebSocket GET /ws/lobby
func (h *WSHandler) HandleLobbyWS(c *gin.Context) {
	h.handleWS(c, "lobby")
}

// writePump 写协程
func (h *WSHandler) writePump(client *service.WSClient) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump 读协程
func (h *WSHandler) readPump(client *service.WSClient) {
	defer func() {
		service.Hub.Unregister(client)
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(wsReadLimit)
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
