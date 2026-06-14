package middleware

import (
	"log"
	"net/http"
	"strings"

	"beat_fit_server/config"
	"beat_fit_server/internal/cache"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired JWT 鉴权中间件
// 优先从 Header 取 Authorization: Bearer <token>
// WebSocket 无法设 Header 时，从 Query 参数 token 取值
func AuthRequired(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 提取 Token（Header 优先，Query 兜底）
		tokenStr := ""
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			tokenStr = c.Query("token")
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			return
		}

		// 2. 解析 JWT
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token 无效或已过期"})
			return
		}

		// 3. 提取 user_id
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token 解析失败"})
			return
		}
		userIDClaim, exists := claims["user_id"]
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token 无效"})
			return
		}
		userIDFloat, ok := userIDClaim.(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token 无效"})
			return
		}
		userID := uint64(userIDFloat)

		// 4. 校验 Redis 中的 token（支持登出失效）
		cachedToken, err := cache.GetToken(userID)
		if err == nil && cachedToken != tokenStr {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token 已登出或已失效"})
			return
		}
		if err != nil {
			// Redis 不可用时不阻断请求，仅记录日志
			log.Printf("[WARN] Redis token 校验失败 user=%d err=%v", userID, err)
		}

		// 5. 注入 Context，后续 Handler 通过 c.Get("user_id") 获取
		c.Set("user_id", userID)
		c.Next()

	}
}
