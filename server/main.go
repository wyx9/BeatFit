package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"syscall"
	"time"

	"beatfit/handler"
	"beatfit/service"
	"beatfit/store"

	"github.com/gin-gonic/gin"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
	// 兜底：捕获所有未处理的 panic，打印堆栈后退出
	// 避免 panic 导致进程无声崩溃
	defer func() {
		if r := recover(); r != nil {
			log.Printf("【PANIC】%v\n%s", r, debug.Stack())
		}
	}()

	// 将主逻辑放入 run()，return 退出码
	// 这样 defer 能正常执行（数据库关闭等清理工作）
	code := run()
	os.Exit(code)
}

func run() int {
	// 初始化数据库
	dbPath := "sport.db"
	if p := os.Getenv("SPORT_DB_PATH"); p != "" {
		dbPath = p
	}

	st, err := store.New(dbPath)
	if err != nil {
		log.Printf("数据库初始化失败: %v", err)
		return 1
	}
	defer st.Close()

	// 初始化 Hub 和 Service
	hub := service.NewHub()
	roomSvc := service.NewRoomService(st, hub)

	// 初始化 Handler
	userH := handler.NewUserHandler(st)
	roomH := handler.NewRoomHandler(roomSvc, hub)
	wsH := handler.NewWSHandler(hub)

	// 配置路由
	r := gin.Default()

	// 静态文件
	staticFS, _ := fs.Sub(staticFiles, "static")
	r.StaticFS("/static", http.FS(staticFS))

	// API 路由
	api := r.Group("/api")
	{
		api.POST("/login", userH.Login)
		api.GET("/user", userH.GetUser)

		api.POST("/rooms", roomH.CreateRoom)
		api.GET("/rooms", roomH.ListRooms)
		api.GET("/rooms/:code", roomH.GetRoom)
		api.POST("/rooms/:code/join", roomH.JoinRoom)
		api.POST("/rooms/:code/start", roomH.StartTraining)
		api.POST("/rooms/:code/terminate", roomH.TerminateTraining)
		api.POST("/rooms/:code/leave", roomH.LeaveRoom)
	}

	// WebSocket 路由
	r.GET("/ws/lobby", wsH.HandleLobbyWS)     // 大厅：首页用户接收全局通知
	r.GET("/ws/room/:code", wsH.HandleWS)     // 房间：训练实时同步

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 端口配置
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// 监听系统信号，收到 SIGINT/SIGTERM 时优雅关闭 HTTP 服务
	// 先停止接受新请求 → 等待进行中的请求完成（最多 5 秒）→ 退出
	shutdown := make(chan struct{})
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		sig := <-quit
		log.Printf("收到信号 %v，正在优雅关闭...", sig)

		// 给进行中的请求 5 秒缓冲时间
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("HTTP 关闭异常: %v", err)
		}
		close(shutdown) // 通知主协程可以退出了
	}()

	log.Printf("服务启动: http://localhost:%s", port)
	log.Printf("测试页面: http://localhost:%s/static/test.html", port)

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("服务启动失败: %v", err)
		return 1
	}

	// 阻塞等待关闭信号，确保所有资源清理完毕才退出
	<-shutdown
	log.Println("服务已安全停止")
	return 0
}
