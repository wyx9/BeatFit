package config

import (
	"log"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Config 全局配置结构体
type Config struct {
	ServerPort  string `json:"server_port" yaml:"server_port"`   // 服务端口
	MySQLDSN    string `json:"mysql_dsn" yaml:"mysql_dsn"`       // MySQL 连接串
	RedisAddr   string `json:"redis_addr" yaml:"redis_addr"`     // Redis 地址
	RedisPass   string `json:"redis_pass" yaml:"redis_pass"`     // Redis 密码
	JWTSecret   string `json:"jwt_secret" yaml:"jwt_secret"`     // JWT 签名密钥
	WxAppID     string `json:"wx_app_id" yaml:"wx_app_id"`       // 微信小程序 AppID
	WxAppSecret string `json:"wx_app_secret" yaml:"wx_app_secret"` // 微信小程序 AppSecret
}

// yamlConfig 用于解析 YAML 文件的中间结构
type yamlConfig struct {
	Server  struct {
		Port string `yaml:"port"`
	} `yaml:"server"`
	MySQL struct {
		DSN string `yaml:"dsn"`
	} `yaml:"mysql"`
	Redis struct {
		Addr     string `yaml:"addr"`
		Password string `yaml:"password"`
	} `yaml:"redis"`
	JWT struct {
		Secret string `yaml:"secret"`
	} `yaml:"jwt"`
	Wechat struct {
		AppID     string `yaml:"app_id"`
		AppSecret string `yaml:"app_secret"`
	} `yaml:"wechat"`
}

// defaultConfig 返回内置默认配置（兜底）
func defaultConfig() *Config {
	return &Config{
		ServerPort:  "8080",
		MySQLDSN:    "root:123456@tcp(127.0.0.1:3306)/beat_fit?charset=utf8mb4&parseTime=True&loc=Local",
		RedisAddr:   "127.0.0.1:6379",
		RedisPass:   "",
		JWTSecret:   "beat-fit-dev-secret-2026",
		WxAppID:     "",
		WxAppSecret: "",
	}
}

// Load 加载配置：YAML 文件 → 环境变量覆盖 → 硬编码兜底
//
// 优先级（从高到低）：
//  1. 环境变量（SERVER_PORT, MYSQL_DSN, REDIS_ADDR, REDIS_PASS, JWT_SECRET, WX_APP_ID, WX_APP_SECRET）
//  2. YAML 配置文件（默认路径 config.yaml，可通过 CONFIG_PATH 环境变量指定）
//  3. 硬编码默认值
func Load() *Config {
	cfg := defaultConfig()

	// 1. 尝试加载 YAML 配置文件
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		// 优先查找可执行文件同级目录，其次当前工作目录
		if exe, err := os.Executable(); err == nil {
			candidate := filepath.Join(filepath.Dir(exe), "config.yaml")
			if _, err := os.Stat(candidate); err == nil {
				configPath = candidate
			}
		}
		if configPath == "" {
			configPath = "config.yaml"
		}
	}

	if data, err := os.ReadFile(configPath); err == nil {
		var yc yamlConfig
		if err := yaml.Unmarshal(data, &yc); err == nil {
			applyYAML(cfg, &yc)
			log.Printf("[INFO] 已加载配置文件: %s", configPath)
		} else {
			log.Printf("[WARN] 配置文件解析失败 (%s): %v，使用默认值", configPath, err)
		}
	} else {
		log.Printf("[INFO] 未找到配置文件 (%s)，使用默认值与环境变量", configPath)
	}

	// 2. 环境变量覆盖（优先级最高）
	applyEnvOverrides(cfg)

	// 3. 安全警告
	if cfg.JWTSecret == "beat-fit-dev-secret-2026" {
		log.Println("[WARN] JWT_SECRET 使用默认值，生产环境请务必修改")
	}

	return cfg
}

// applyYAML 将 YAML 配置写入 Config（非零值覆盖）
func applyYAML(cfg *Config, yc *yamlConfig) {
	if yc.Server.Port != "" {
		cfg.ServerPort = yc.Server.Port
	}
	if yc.MySQL.DSN != "" {
		cfg.MySQLDSN = yc.MySQL.DSN
	}
	if yc.Redis.Addr != "" {
		cfg.RedisAddr = yc.Redis.Addr
	}
	if yc.Redis.Password != "" {
		cfg.RedisPass = yc.Redis.Password
	}
	if yc.JWT.Secret != "" {
		cfg.JWTSecret = yc.JWT.Secret
	}
	if yc.Wechat.AppID != "" {
		cfg.WxAppID = yc.Wechat.AppID
	}
	if yc.Wechat.AppSecret != "" {
		cfg.WxAppSecret = yc.Wechat.AppSecret
	}
}

// applyEnvOverrides 环境变量覆盖配置（非空才覆盖）
func applyEnvOverrides(cfg *Config) {
	if v := os.Getenv("SERVER_PORT"); v != "" {
		cfg.ServerPort = v
	}
	if v := os.Getenv("MYSQL_DSN"); v != "" {
		cfg.MySQLDSN = v
	}
	if v := os.Getenv("REDIS_ADDR"); v != "" {
		cfg.RedisAddr = v
	}
	if v := os.Getenv("REDIS_PASS"); v != "" {
		cfg.RedisPass = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWTSecret = v
	}
	if v := os.Getenv("WX_APP_ID"); v != "" {
		cfg.WxAppID = v
	}
	if v := os.Getenv("WX_APP_SECRET"); v != "" {
		cfg.WxAppSecret = v
	}
}
