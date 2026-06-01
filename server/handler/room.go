package handler

import (
	"net/http"

	"beatfit/model"
	"beatfit/service"

	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	svc *service.RoomService
	hub *service.Hub
}

func NewRoomHandler(svc *service.RoomService, hub *service.Hub) *RoomHandler {
	return &RoomHandler{svc: svc, hub: hub}
}

func (h *RoomHandler) CreateRoom(c *gin.Context) {
	var req model.CreateRoomReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ownerID := c.Query("user_id")
	if ownerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query param required"})
		return
	}

	room, err := h.svc.CreateRoom(ownerID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 通知所有在首页的用户刷新房间列表
	h.hub.BroadcastLobby(model.WSMessage{
		Type: "room_list_changed",
	})

	c.JSON(http.StatusCreated, room)
}

func (h *RoomHandler) ListRooms(c *gin.Context) {
	rooms, err := h.svc.ListActiveRooms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rooms)
}

func (h *RoomHandler) GetRoom(c *gin.Context) {
	code := c.Param("code")
	detail, err := h.svc.GetRoomDetail(code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

func (h *RoomHandler) JoinRoom(c *gin.Context) {
	code := c.Param("code")

	var req model.JoinRoomReq
	_ = c.ShouldBindJSON(&req) // 忽略 body 解析错误，优先用 query

	userID := c.Query("user_id")
	if userID == "" {
		userID = req.UserID
	}
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	detail, err := h.svc.JoinRoom(code, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, detail)
}

func (h *RoomHandler) StartTraining(c *gin.Context) {
	code := c.Param("code")
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	if err := h.svc.StartTraining(code, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "训练已开始"})
}

func (h *RoomHandler) LeaveRoom(c *gin.Context) {
	code := c.Param("code")
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	if err := h.svc.LeaveRoom(code, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已离开"})
}

// 终止训练：房主主动停止，所有人返回大厅
func (h *RoomHandler) TerminateTraining(c *gin.Context) {
	code := c.Param("code")
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	if err := h.svc.TerminateTraining(code, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "训练已终止"})
}
