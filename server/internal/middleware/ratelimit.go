package middleware

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"beat_fit_server/internal/cache"

	"github.com/gin-gonic/gin"
)

// RateLimit 基于 Redis 的速率限制中间件
// limit: 时间窗口内最大请求数
// window: 时间窗口长度
// keyPrefix: Redis key 前缀（如 "ratelimit:login"）
func RateLimit(limit int, window time.Duration, keyPrefix string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 以客户端 IP 作为限流标识
		clientIP := c.ClientIP()
		key := fmt.Sprintf("ratelimit:%s:%s", keyPrefix, clientIP)

		allowed, err := cache.RateLimitCheck(key, limit, window)
		if err != nil {
			// Redis 不可用时放行（避免限流组件拖垮服务）
			log.Printf("[WARN] 速率限制检查失败 key=%s err=%v", key, err)
			c.Next()
			return
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "请求过于频繁，请稍后再试",
			})
			return
		}
		c.Next()
	}
}
