package service

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"beat_fit_server/config"
	"beat_fit_server/internal/cache"
	"beat_fit_server/internal/model"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Login 微信登录：code 换取 openid → 查找/创建用户 → 生成 JWT
func Login(db *gorm.DB, cfg *config.Config, code string) (string, *model.User, error) {
	// 1. 调用微信 code2session 接口换取 openid
	openid, err := code2session(cfg.WxAppID, cfg.WxAppSecret, code)
	if err != nil {
		return "", nil, fmt.Errorf("微信登录失败: %w", err)
	}

	// 2. 根据 openid 查找或创建用户
	user, err := model.FindOrCreateByOpenid(db, openid)
	if err != nil {
		return "", nil, fmt.Errorf("用户创建失败: %w", err)
	}

	// 3. 生成 JWT Token（7天有效）
	token, err := generateJWT(cfg.JWTSecret, user.ID, user.Openid)
	if err != nil {
		return "", nil, err
	}

	// 4. 缓存 token 到 Redis（用于登出校验）
	if err := cache.SetToken(user.ID, token); err != nil {
		log.Printf("[WARN] 缓存token失败 user=%d err=%v", user.ID, err)
	}

	return token, user, nil
}

// code2session 调用微信小程序 code2session 接口
func code2session(appID, appSecret, code string) (string, error) {
	url := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		appID, appSecret, code,
	)

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("请求微信接口失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result struct {
		Openid     string `json:"openid"`
		SessionKey string `json:"session_key"`
		ErrCode    int    `json:"errcode"`
		ErrMsg     string `json:"errmsg"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("微信返回解析失败: %w", err)
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("微信返回错误 [%d]: %s", result.ErrCode, result.ErrMsg)
	}
	return result.Openid, nil
}

// GuestLogin 游客登录：生成唯一游客标识 → 创建用户 → 签发 JWT
func GuestLogin(db *gorm.DB, cfg *config.Config, nickname string) (string, *model.User, error) {
	// 生成唯一游客 openid: guest_ + 16位随机hex
	b := make([]byte, 16)
	rand.Read(b)
	guestOpenid := "guest_" + hex.EncodeToString(b)

	// 创建游客用户
	user, err := model.FindOrCreateByOpenid(db, guestOpenid)
	if err != nil {
		return "", nil, fmt.Errorf("游客创建失败: %w", err)
	}

	// 保存昵称
	if nickname != "" {
		_ = db.Model(user).Update("nickname", nickname).Error
		user.Nickname = nickname // 同步到返回对象
	}

	token, err := generateJWT(cfg.JWTSecret, user.ID, user.Openid)
	if err != nil {
		return "", nil, err
	}

	// 缓存 token 到 Redis（用于登出校验）
	if err := cache.SetToken(user.ID, token); err != nil {
		log.Printf("[WARN] 缓存token失败 user=%d err=%v", user.ID, err)
	}

	return token, user, nil
}

// generateJWT 签发 JWT Token，包含 user_id 和 openid，7天过期
func generateJWT(secret string, userID uint64, openid string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"openid":  openid,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
