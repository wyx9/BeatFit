package main

import (
	"database/sql"
	"fmt"
	"log"

	"beat_fit_server/config"
	"beat_fit_server/internal/cache"
	"beat_fit_server/internal/handler"
	"beat_fit_server/internal/middleware"
	"beat_fit_server/internal/model"
	"beat_fit_server/internal/service"

	"github.com/gin-gonic/gin"
	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// ensureDatabase 连接 MySQL 并确保目标数据库存在（不存在则创建）
func ensureDatabase(dsn string) {
	cfg, err := mysqlDriver.ParseDSN(dsn)
	if err != nil {
		log.Fatalf("DSN 解析失败: %v", err)
	}

	dbName := cfg.DBName
	cfg.DBName = ""

	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatalf("MySQL 连接失败: %v", err)
	}
	defer db.Close()

	createSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)
	if _, err := db.Exec(createSQL); err != nil {
		log.Fatalf("数据库创建失败: %v", err)
	}
	log.Printf("数据库 %s 已就绪", dbName)
}

func main() {
	// 1. 加载配置
	cfg := config.Load()

	// 2. 确保数据库存在
	ensureDatabase(cfg.MySQLDSN)

	// 3. 连接目标数据库
	db, err := gorm.Open(mysql.Open(cfg.MySQLDSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	db.AutoMigrate(&model.User{}, &model.Room{}, &model.RoomMember{}, &model.WorkoutLog{})

	// 修复已存在的 exercises 列类型（TEXT → JSON 以支持 utf8mb4 中文）
	_ = db.Exec("ALTER TABLE rooms MODIFY COLUMN exercises JSON COMMENT '训练动作JSON'").Error

	log.Println("数据库初始化完成")

	// 4. 初始化 Redis
	cache.Init(cfg)

	// 5. 初始化 WebSocket Hub
	service.InitHub(db)

	// 6. 创建 Handler 实例
	authHandler := handler.NewAuthHandler(db, cfg)
	roomHandler := handler.NewRoomHandler(db)
	lbHandler := handler.NewLeaderboardHandler(db)
	wsHandler := handler.NewWSHandler(db)

	// 7. 创建路由
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 公开接口
	r.POST("/api/login", authHandler.Login)
	r.POST("/api/guest-login", authHandler.GuestLogin)

	// 需要鉴权的接口
	auth := r.Group("/api")
	auth.Use(middleware.AuthRequired(cfg))
	{
		auth.POST("/logout", authHandler.Logout)     // 退出登录
		auth.GET("/user/active-room", authHandler.ActiveRoom) // 当前活跃房间
		auth.GET("/rooms", roomHandler.List)          // 活跃房间列表
		auth.POST("/room", roomHandler.Create)        // 创建房间
		auth.POST("/room/join", roomHandler.Join)     // 加入房间
		auth.POST("/room/dissolve", roomHandler.Dissolve) // 解散房间
		auth.POST("/room/start", roomHandler.Start)     // 开始训练（广播）
		auth.GET("/room/members", roomHandler.Members) // 房间成员列表
		auth.GET("/leaderboard", lbHandler.Get)       // 排行榜
		auth.POST("/workout/report", lbHandler.Report) // 训练上报
	}

	// WebSocket
	r.GET("/ws/room/:code", middleware.AuthRequired(cfg), wsHandler.HandleRoomWS)
	r.GET("/ws/lobby", middleware.AuthRequired(cfg), wsHandler.HandleLobbyWS)

	// 8. 启动
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Beat Fit 服务启动 → http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
