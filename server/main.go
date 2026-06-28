package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os/signal"
	"syscall"
	"time"

	"beat_fit_server/config"
	"beat_fit_server/internal/cache"
	"beat_fit_server/internal/handler"
	applog "beat_fit_server/internal/log"
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
	// 0. 初始化结构化日志
	applog.Init("info")
	applog.Info("Beat Fit 服务启动中...")

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

	// 配置 GORM 连接池
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

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

	// 动作图片静态文件服务（公开访问）
	r.GET("/static/exercises/*filepath", func(c *gin.Context) {
		fp := c.Param("filepath")
		if decoded, err := url.PathUnescape(fp); err == nil {
			fp = decoded
		}
		c.File("./static/exercises" + fp)
	})

	r.GET("/health", func(c *gin.Context) {
		healthy := true
		details := gin.H{}

		// DB 检查
		sqlDB, _ := db.DB()
		if err := sqlDB.PingContext(c.Request.Context()); err != nil {
			healthy = false
			details["db"] = "unreachable"
		} else {
			details["db"] = "ok"
		}

		// Redis 检查
		if err := cache.GetClient().Ping(c.Request.Context()).Err(); err != nil {
			healthy = false
			details["redis"] = "unreachable"
		} else {
			details["redis"] = "ok"
		}

		status := http.StatusOK
		if !healthy {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{"status": details})
	})

	// 公开接口（带速率限制）
	r.POST("/api/login", middleware.RateLimit(10, time.Minute, "login"), authHandler.Login)
	r.POST("/api/guest-login", middleware.RateLimit(30, time.Minute, "guest-login"), authHandler.GuestLogin)

	// 需要鉴权的接口
	auth := r.Group("/api")
	auth.Use(middleware.AuthRequired(cfg))
	{
		auth.POST("/logout", authHandler.Logout)               // 退出登录
		auth.GET("/user/active-room", authHandler.ActiveRoom)  // 当前活跃房间
		auth.GET("/user/profile", authHandler.Profile)         // 用户信息
		auth.PUT("/user/profile", authHandler.UpdateProfile)   // 更新用户信息
		auth.GET("/user/workouts", authHandler.WorkoutHistory) // 训练历史
		auth.GET("/rooms", roomHandler.List)                   // 活跃房间列表
		auth.POST("/room", roomHandler.Create)                 // 创建房间
		auth.POST("/room/join", middleware.RateLimit(30, time.Minute, "join-room"), roomHandler.Join) // 加入房间
		auth.POST("/room/dissolve", roomHandler.Dissolve)      // 解散房间
		auth.POST("/room/start", roomHandler.Start)            // 开始训练（广播）
		auth.GET("/room/members", roomHandler.Members)         // 房间成员列表
		auth.GET("/leaderboard", lbHandler.Get)                // 排行榜
		auth.POST("/workout/report", lbHandler.Report)         // 训练上报
	}

	// WebSocket
	r.GET("/ws/room/:code", middleware.AuthRequired(cfg), wsHandler.HandleRoomWS)
	r.GET("/ws/lobby", middleware.AuthRequired(cfg), wsHandler.HandleLobbyWS)

	// 8. 创建 HTTP Server（支持优雅关闭）
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	// 在 goroutine 中启动服务
	go func() {
		log.Printf("Beat Fit 服务启动 → http://localhost%s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()

	// 9. 等待关闭信号
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	<-ctx.Done()
	stop()

	log.Println("正在优雅关闭服务...")

	// 关闭 HTTP Server（等待活跃请求完成，最多 10s）
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP 关闭超时: %v", err)
	}

	// 关闭 WebSocket 连接
	service.Hub.Shutdown()

	// 关闭数据库
	if err := sqlDB.Close(); err != nil {
		log.Printf("数据库关闭失败: %v", err)
	}

	// 关闭 Redis
	if err := cache.Close(); err != nil {
		log.Printf("Redis 关闭失败: %v", err)
	}

	log.Println("服务已关闭")
}
