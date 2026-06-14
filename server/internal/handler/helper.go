package handler

import "github.com/gin-gonic/gin"

// getUserID 从 Gin Context 中提取 user_id（由 JWT 中间件注入）
func getUserID(c *gin.Context) uint64 {
	v, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	uid, ok := v.(uint64)
	if !ok {
		return 0
	}
	return uid
}
