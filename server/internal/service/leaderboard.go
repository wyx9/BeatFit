package service

import (
	"strconv"

	"beat_fit_server/internal/cache"
	"beat_fit_server/internal/model"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// LeaderboardEntry 排行榜单条记录
type LeaderboardEntry struct {
	Rank      int    `json:"rank"`
	UserID    uint64 `json:"user_id"`
	Nickname  string `json:"nickname"`
	AvatarURL string `json:"avatar_url"`
	Level     int    `json:"level"`
	Title     string `json:"title"`
	Value     int    `json:"value"`
}

// GetLeaderboard 获取排行榜：优先从 Redis ZSET 读取，无数据时从 MySQL 聚合并回填
func GetLeaderboard(db *gorm.DB, typ string, date string) ([]LeaderboardEntry, error) {
	// 1. 尝试从 Redis ZSET 读取
	results, err := cache.ZRevRange(typ, 0, 49)
	if err == nil && len(results) > 0 {
		return redisToEntries(db, results), nil
	}

	// 2. Redis 无数据，从 MySQL 聚合查询
	fieldMap := map[string]string{
		"duration": "minutes",
		"calories": "kcal",
		"count":    "count",
	}
	field := fieldMap[typ]
	if field == "" {
		field = "minutes" // 默认按时长
	}

	items, err := model.LeaderboardQuery(db, date, field)
	if err != nil {
		return nil, err
	}

	// 3. 异步回填 Redis，设置次日凌晨过期
	go func() {
		for _, item := range items {
			cache.ZIncrBy(typ, item.UserID, item.TotalValue)
		}
		cache.SetLeaderboardExpire()
	}()

	// 4. 构建返回结果，补全用户信息
	entries := make([]LeaderboardEntry, len(items))
	for i, item := range items {
		entries[i] = LeaderboardEntry{Rank: i + 1, UserID: item.UserID, Value: item.TotalValue}
		if user, err := model.FindByID(db, item.UserID); err == nil {
			entries[i].Nickname = user.Nickname
			entries[i].AvatarURL = user.AvatarUrl
			entries[i].Level = user.Level
			entries[i].Title = user.Title
		}
	}
	return entries, nil
}

// redisToEntries 将 Redis ZSET 结果转换为排行条目列表
func redisToEntries(db *gorm.DB, results []redis.Z) []LeaderboardEntry {
	entries := make([]LeaderboardEntry, len(results))
	for i, z := range results {
		userID, _ := strconv.ParseUint(z.Member.(string), 10, 64)
		entries[i] = LeaderboardEntry{Rank: i + 1, UserID: userID, Value: int(z.Score)}
		if user, err := model.FindByID(db, userID); err == nil {
			entries[i].Nickname = user.Nickname
			entries[i].AvatarURL = user.AvatarUrl
			entries[i].Level = user.Level
			entries[i].Title = user.Title
		}
	}
	return entries
}

// ReportWorkout 上报训练数据：写入训练记录 → 更新用户累计 → 更新 Redis 排行榜
func ReportWorkout(db *gorm.DB, userID, roomID uint64, minutes, kcal, count int) (*model.WorkoutLog, error) {
	// 1. 写入训练记录
	log := &model.WorkoutLog{
		UserID:  userID,
		RoomID:  roomID,
		Minutes: minutes,
		Kcal:    kcal,
		Count:   count,
	}
	if err := model.CreateLog(db, log); err != nil {
		return nil, err
	}

	// 2. 更新用户累计数据
	user, err := model.FindByID(db, userID)
	if err == nil {
		user.TotalMin += minutes
		user.TotalKcal += kcal
		user.TotalCount += count
		_ = user.Save(db) // 非致命错误，忽略
	}

	// 3. 更新 Redis 排行榜 ZSET
	_ = cache.ZIncrBy("duration", userID, minutes)
	_ = cache.ZIncrBy("calories", userID, kcal)
	_ = cache.ZIncrBy("count", userID, count)

	return log, nil
}
