package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"fitsync/model"
	"fitsync/service"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSHandler struct {
	hub *service.Hub
}

func NewWSHandler(h *service.Hub) *WSHandler {
	return &WSHandler{hub: h}
}

// 大厅 WebSocket：用户在首页时连接，接收全局通知（如新房创建）
func (h *WSHandler) HandleLobbyWS(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("lobby ws upgrade error: %v", err)
		return
	}

	h.hub.AddLobbyClient(userID, conn)

	// 保持连接，检测断开
	go func() {
		defer func() {
			h.hub.RemoveLobbyClient(userID)
			conn.Close()
		}()
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}()
}

func (h *WSHandler) HandleWS(c *gin.Context) {
	code := c.Param("code")
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query param required"})
		return
	}

	// 进入房间时从大厅移除，避免双重连接
	h.hub.RemoveLobbyClient(userID)

	rs := h.hub.GetRoom(code)
	if rs == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	rs.AddClient(userID, conn)

	// 通知其他成员
	rs.BroadcastMessage(model.WSMessage{
		Type:   "user_joined",
		UserID: userID,
	})

	// 发送当前成员列表
	members := rs.GetMembers()
	rs.BroadcastMessage(model.WSMessage{
		Type: "members",
		Data: members,
	})

	// 读取客户端消息
	go func() {
		defer func() {
			rs.RemoveClient(userID)
			rs.BroadcastMessage(model.WSMessage{
				Type:   "user_left",
				UserID: userID,
			})
			conn.Close()
		}()

		for {
			_, msgBytes, err := conn.ReadMessage()
			if err != nil {
				break
			}

			var msg model.WSMessage
			if err := json.Unmarshal(msgBytes, &msg); err != nil {
				continue
			}

			msg.UserID = userID

			switch msg.Type {
			case "chat":
				rs.BroadcastMessage(msg)
			default:
				// 转发消息到房间
				rs.BroadcastMessage(msg)
			}
		}
	}()
}
