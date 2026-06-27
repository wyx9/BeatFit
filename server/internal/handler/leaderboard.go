package handler

import (
	"net/http"
	"time"

	"beat_fit_server/internal/model"
	"beat_fit_server/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LeaderboardHandler 排行榜 + 训练上报处理器
type LeaderboardHandler struct {
	db *gorm.DB
}

// NewLeaderboardHandler 创建 LeaderboardHandler 实例
func NewLeaderboardHandler(db *gorm.DB) *LeaderboardHandler {
	return &LeaderboardHandler{db: db}
}

// Get 获取排行榜 GET /api/leaderboard?type=duration&date=2026-06-05
// type: duration(时长) / calories(消耗) / count(次数)
func (h *LeaderboardHandler) Get(c *gin.Context) {
	typ := c.DefaultQuery("type", "duration")
	date := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	userID := getUserID(c)

	list, myRank, err := service.GetLeaderboard(h.db, typ, date, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询排行榜失败"})
		return
	}
	if list == nil {
		list = []service.LeaderboardEntry{} // 返回空数组而非 null
	}

	resp := gin.H{"list": list}
	if myRank != nil {
		resp["my_rank"] = myRank
	}
	c.JSON(http.StatusOK, resp)
}

// Report 上报训练数据 POST /api/workout/report
// 请求体: { "room_id": 1, "minutes": 30, "kcal": 200, "count": 120, "exercises": [...] }
func (h *LeaderboardHandler) Report(c *gin.Context) {
	var req struct {
		RoomID    uint64                   `json:"room_id"`
		Minutes   int                      `json:"minutes"`
		Kcal      int                      `json:"kcal"`
		Count     int                      `json:"count"`
		Exercises []map[string]interface{} `json:"exercises"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	userID := getUserID(c)

	// 校验房间成员身份（room_id=0 表示个人训练，跳过）
	if req.RoomID != 0 {
		var memberCount int64
		h.db.Model(&model.RoomMember{}).
			Where("room_id = ? AND user_id = ?", req.RoomID, userID).
			Count(&memberCount)
		if memberCount == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "你不是该房间的成员"})
			return
		}
	}

	wlog, err := service.ReportWorkout(h.db, userID, req.RoomID, req.Minutes, req.Kcal, req.Count, req.Exercises)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "上报训练数据失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"log": wlog})
}
