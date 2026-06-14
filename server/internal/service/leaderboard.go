package service

import (
	"log"
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
	entries := make([]LeaderboardEntry, 0, len(results))
	for i, z := range results {
		memberStr, ok := z.Member.(string)
		if !ok {
			log.Printf("[WARN] Redis ZSET member 类型异常 (期望 string)，跳过该条")
			continue
		}
		userID, err := strconv.ParseUint(memberStr, 10, 64)
		if err != nil {
			log.Printf("[WARN] Redis ZSET member 解析失败: %v，跳过该条", err)
			continue
		}
		entry := LeaderboardEntry{Rank: i + 1, UserID: userID, Value: int(z.Score)}
		if user, err := model.FindByID(db, userID); err == nil {
			entry.Nickname = user.Nickname
			entry.AvatarURL = user.AvatarUrl
			entry.Level = user.Level
			entry.Title = user.Title
		}
		entries = append(entries, entry)
	}
	return entries
}

// ReportWorkout 上报训练数据：写入训练记录 → 更新用户累计（事务包裹）→ 更新 Redis 排行榜
func ReportWorkout(db *gorm.DB, userID, roomID uint64, minutes, kcal, count int) (*model.WorkoutLog, error) {
	wlog := &model.WorkoutLog{
		UserID:  userID,
		RoomID:  roomID,
		Minutes: minutes,
		Kcal:    kcal,
		Count:   count,
	}

	// DB 操作包裹在事务中
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := model.CreateLog(tx, wlog); err != nil {
			return err
		}
		user, err := model.FindByID(tx, userID)
		if err != nil {
			return err
		}
		user.TotalMin += minutes
		user.TotalKcal += kcal
		user.TotalCount += count
		return user.Save(tx)
	})
	if err != nil {
		return nil, err
	}

	// Redis 更新放在事务外（非关键，best-effort）
	_ = cache.ZIncrBy("duration", userID, minutes)
	_ = cache.ZIncrBy("calories", userID, kcal)
	_ = cache.ZIncrBy("count", userID, count)

	return wlog, nil
}
