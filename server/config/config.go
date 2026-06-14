package config

import (
	"log"
	"os"
)

// Config 全局配置结构体
type Config struct {
	ServerPort  string // 服务端口
	MySQLDSN    string // MySQL 连接串
	RedisAddr   string // Redis 地址
	RedisPass   string // Redis 密码
	JWTSecret   string // JWT 签名密钥
	WxAppID     string // 微信小程序 AppID
	WxAppSecret string // 微信小程序 AppSecret
}

// Load 从环境变量加载配置，缺失时使用默认值
func Load() *Config {
	cfg := &Config{
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		MySQLDSN:    getEnv("MYSQL_DSN", "root:123456@tcp(127.0.0.1:3306)/beat_fit?charset=utf8mb4&parseTime=True&loc=Local"),
		RedisAddr:   getEnv("REDIS_ADDR", "127.0.0.1:6379"),
		RedisPass:   getEnv("REDIS_PASS", ""),
		JWTSecret:   getEnv("JWT_SECRET", "beat-fit-dev-secret-2026"),
		WxAppID:     getEnv("WX_APP_ID", ""),
		WxAppSecret: getEnv("WX_APP_SECRET", ""),
	}

	// 生产环境请通过环境变量覆盖默认值
	if cfg.JWTSecret == "beat-fit-dev-secret-2026" {
		log.Println("[WARN] JWT_SECRET 使用默认值，生产环境请务必设置环境变量 JWT_SECRET")
	}

	return cfg
}

// getEnv 读取环境变量，不存在时返回默认值
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
