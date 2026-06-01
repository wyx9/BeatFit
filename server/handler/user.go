package handler

import (
	"net/http"

	"fitsync/model"
	"fitsync/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	store *store.Store
}

func NewUserHandler(s *store.Store) *UserHandler {
	return &UserHandler{store: s}
}

func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Code     string `json:"code"`
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.Nickname == "" && req.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nickname or code required"})
		return
	}

	nickname := req.Nickname
	if nickname == "" {
		// 正式微信登录：code 换取 openid
		nickname = "user_" + req.Code
		if len(nickname) > 32 {
			nickname = nickname[:32]
		}
	}

	user, err := h.getOrCreateDevUser(nickname)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create user failed"})
		return
	}

	c.JSON(http.StatusOK, model.LoginResp{
		UserID:   user.ID,
		Nickname: user.Nickname,
		Token:    user.ID,
	})
}

func (h *UserHandler) getOrCreateDevUser(nickname string) (*model.User, error) {
	openid := "dev_" + nickname
	user, err := h.store.GetUserByOpenID(openid)
	if err == nil {
		return user, nil
	}

	user = &model.User{
		ID:        uuid.New().String(),
		OpenID:    openid,
		Nickname:  nickname,
		AvatarURL: "",
	}
	if err := h.store.CreateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	user, err := h.store.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
