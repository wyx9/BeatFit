package handler

import (
	"net/http"

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
