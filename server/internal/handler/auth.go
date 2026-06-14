package handler

import (
	"net/http"
	"strconv"

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
// 请求体: { "nickname": "运动达人" }
// 响应:   { "token": "jwt", "user": {...} }
func (h *AuthHandler) GuestLogin(c *gin.Context) {
	var req struct {
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	token, user, err := service.GuestLogin(h.db, h.cfg, req.Nickname)
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

// WorkoutHistory 获取用户训练历史 GET /api/user/workouts?page=1&size=20
func (h *AuthHandler) WorkoutHistory(c *gin.Context) {
	userID := getUserID(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page < 1 { page = 1 }
	if size < 1 || size > 50 { size = 20 }

	logs, total, err := model.ListWorkoutsByUser(h.db, userID, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs, "total": total})
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
