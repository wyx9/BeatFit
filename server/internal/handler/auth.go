package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"beat_fit_server/config"
	"beat_fit_server/internal/cache"
	"beat_fit_server/internal/model"
	"beat_fit_server/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthHandler 登录相关接口处理器
type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

// NewAuthHandler 创建 AuthHandler 实例
func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

// Login 处理微信登录请求 POST /api/login
// 请求体: { "code": "wx.login()返回的code" }
// 响应:   { "token": "jwt", "user": {...} }
func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 code 参数"})
		return
	}

	token, user, err := service.Login(h.db, h.cfg, req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// GuestLogin 游客登录 POST /api/guest-login
// 请求体: { "code": "wx.login()返回的code", "nickname": "运动达人" }
// 通过 wx.login 静默获取 openid，无需用户授权弹窗，实现数据持久化
// 响应:   { "token": "jwt", "user": {...} }
func (h *AuthHandler) GuestLogin(c *gin.Context) {
	var req struct {
		Code     string `json:"code" binding:"required"`
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 code 参数"})
		return
	}

	token, user, err := service.GuestLogin(h.db, h.cfg, req.Code, req.Nickname)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// Profile 获取用户信息 GET /api/user/profile
func (h *AuthHandler) Profile(c *gin.Context) {
	userID := getUserID(c)
	user, err := model.FindByID(h.db, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateProfile 更新用户信息 PUT /api/user/profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := getUserID(c)
	var req struct {
		Nickname  string `json:"nickname"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	updates := map[string]interface{}{}
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无更新内容"})
		return
	}
	if err := h.db.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}
	user, _ := model.FindByID(h.db, userID)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// workoutLogItem 训练记录响应项（exercises 字段输出为 JSON 数组而非字符串）
type workoutLogItem struct {
	ID        uint64          `json:"id"`
	UserID    uint64          `json:"user_id"`
	RoomID    uint64          `json:"room_id"`
	Minutes   int             `json:"minutes"`
	Kcal      int             `json:"kcal"`
	Count     int             `json:"count"`
	Exercises json.RawMessage `json:"exercises"`
	CreatedAt time.Time       `json:"created_at"`
}

// convertLogs 将 model.WorkoutLog 转为 API 响应格式，处理 exercises JSON 字段
func convertLogs(logs []model.WorkoutLog) []workoutLogItem {
	items := make([]workoutLogItem, 0, len(logs))
	for _, l := range logs {
		item := workoutLogItem{
			ID:        l.ID,
			UserID:    l.UserID,
			RoomID:    l.RoomID,
			Minutes:   l.Minutes,
			Kcal:      l.Kcal,
			Count:     l.Count,
			CreatedAt: l.CreatedAt,
		}
		if l.Exercises != "" {
			item.Exercises = json.RawMessage(l.Exercises)
		} else {
			item.Exercises = json.RawMessage("null")
		}
		items = append(items, item)
	}
	return items
}

// WorkoutHistory 获取用户训练历史 GET /api/user/workouts?page=1&size=20&year=2026&month=6
func (h *AuthHandler) WorkoutHistory(c *gin.Context) {
	userID := getUserID(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	year, _ := strconv.Atoi(c.DefaultQuery("year", "0"))
	month, _ := strconv.Atoi(c.DefaultQuery("month", "0"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 200 {
		size = 20
	}

	// 指定年月时走按月查询，返回 logs + workout_days
	if year > 0 && month > 0 {
		logs, days, err := model.ListWorkoutsByUserMonth(h.db, userID, year, month)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
			return
		}
		if logs == nil {
			logs = []model.WorkoutLog{}
		}
		if days == nil {
			days = []string{}
		}
		c.JSON(http.StatusOK, gin.H{
			"logs":         convertLogs(logs),
			"workout_days": days,
			"total":        len(logs),
		})
		return
	}

	// 无年月参数时走原有分页查询（兼容旧调用方）
	logs, total, err := model.ListWorkoutsByUser(h.db, userID, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	if logs == nil {
		logs = []model.WorkoutLog{}
	}
	c.JSON(http.StatusOK, gin.H{"logs": convertLogs(logs), "total": total})
}

// ActiveRoom 查询用户当前活跃房间 GET /api/user/active-room
func (h *AuthHandler) ActiveRoom(c *gin.Context) {
	userID := getUserID(c)
	room, err := model.FindActiveRoomByUser(h.db, userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"room": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room": room})
}

// Logout 退出登录 POST /api/logout
// 清除 Redis 中的 token，使后续请求鉴权失败
func (h *AuthHandler) Logout(c *gin.Context) {
	userID := getUserID(c)
	_ = cache.DelToken(userID)
	c.JSON(http.StatusOK, gin.H{"message": "已退出"})
}
