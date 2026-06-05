package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"beat_fit_server/internal/model"
	"beat_fit_server/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RoomHandler 房间相关接口处理器
type RoomHandler struct {
	db *gorm.DB
}

// NewRoomHandler 创建 RoomHandler 实例
func NewRoomHandler(db *gorm.DB) *RoomHandler {
	return &RoomHandler{db: db}
}

// Create 创建房间 POST /api/room
// 请求体: { "name": "晨间瑜伽", "max_members": 12, "exercises": [...] }
// 响应:   { "room": {...} }
func (h *RoomHandler) Create(c *gin.Context) {
	var req struct {
		Name       string          `json:"name" binding:"required"`
		MaxMembers int             `json:"max_members"`
		Exercises  json.RawMessage `json:"exercises"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "房间名称不能为空"})
		return
	}

	// 将 exercises 序列化为 JSON 字符串存入 DB
	exJSON := "[]"
	if len(req.Exercises) > 0 {
		exJSON = string(req.Exercises)
	}

	userID := getUserID(c)
	room, err := service.CreateRoom(h.db, userID, req.Name, req.MaxMembers, exJSON)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 广播新房间给大厅所有在线用户
	user, _ := model.FindByID(h.db, userID)
	service.Hub.BroadcastLobby(userID, &service.WSMessage{
		Type: "room_created",
		User: user,
		Data: gin.H{"room": room},
	})

	c.JSON(http.StatusOK, gin.H{"room": room})
}

// roomWithCount 房间列表项（含成员数）
type roomWithCount struct {
	model.Room
	MemberCount int64 `json:"member_count"`
}

// List 活跃房间列表 GET /api/rooms?page=1&size=20
// 响应: { "rooms": [...], "total": 3 }
func (h *RoomHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 50 {
		size = 20
	}

	rooms, total, err := model.ListActiveRooms(h.db, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败: " + err.Error()})
		return
	}

	// 为每个房间查询成员数
	result := make([]roomWithCount, len(rooms))
	for i, r := range rooms {
		count, _ := model.CountMembers(h.db, r.ID)
		result[i] = roomWithCount{Room: r, MemberCount: count}
	}

	c.JSON(http.StatusOK, gin.H{"rooms": result, "total": total})
}

// Join 加入房间 POST /api/room/join
// 请求体: { "invite_code": "4829" }
// 响应:   { "room": {...} }
func (h *RoomHandler) Join(c *gin.Context) {
	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "邀请码不能为空"})
		return
	}

	userID := getUserID(c)
	room, err := service.JoinRoom(h.db, userID, req.InviteCode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 广播 member_joined 给房间所有人（含房主）
	user, _ := model.FindByID(h.db, userID)
	count, _ := model.CountMembers(h.db, room.ID)
	service.Hub.BroadcastAll(room.InviteCode, &service.WSMessage{
		Type: "member_joined",
		User: user,
		Data: gin.H{"member_count": count},
	})

	c.JSON(http.StatusOK, gin.H{"room": room})
}

// Dissolve 解散房间 POST /api/room/dissolve
// 请求体: { "room_id": 1 }
func (h *RoomHandler) Dissolve(c *gin.Context) {
	var req struct {
		RoomID uint64 `json:"room_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "房间ID不能为空"})
		return
	}

	userID := getUserID(c)
	if err := service.DissolveRoom(h.db, req.RoomID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "房间已解散"})
}

// Start 开始训练 POST /api/room/start（仅房主，广播 training_started）
func (h *RoomHandler) Start(c *gin.Context) {
	var req struct {
		RoomID uint64 `json:"room_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "房间ID不能为空"})
		return
	}

	userID := getUserID(c)
	room, err := model.FindRoomByID(h.db, req.RoomID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "房间不存在"})
		return
	}
	if room.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有房主可以开始训练"})
		return
	}

	// 更新房间状态为进行中 + 记录开始时间
	now := time.Now()
	h.db.Model(room).Updates(map[string]interface{}{
		"status":     2,
		"started_at": now,
	})

	// 广播 training_started 给房间所有成员（含训练数据）
	user, _ := model.FindByID(h.db, userID)
	service.Hub.BroadcastAll(room.InviteCode, &service.WSMessage{
		Type: "training_started",
		User: user,
		Data: gin.H{
			"exercises":  room.Exercises,
			"started_at": now,
			"room_id":    room.ID,
		},
	})

	c.JSON(http.StatusOK, gin.H{"room": room})
}

// Members 获取房间成员 GET /api/room/members?room_id=1
func (h *RoomHandler) Members(c *gin.Context) {
	roomID, err := strconv.ParseUint(c.Query("room_id"), 10, 64)
	if err != nil || roomID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "房间ID无效"})
		return
	}

	members, err := model.ListMembers(h.db, roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"members": members})
}
