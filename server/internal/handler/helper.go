package handler

import "github.com/gin-gonic/gin"

// getUserID 从 Gin Context 中提取 user_id（由 JWT 中间件注入）
func getUserID(c *gin.Context) uint64 {
	v, _ := c.Get("user_id")
	return v.(uint64)
}
