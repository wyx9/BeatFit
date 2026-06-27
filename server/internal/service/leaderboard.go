package service

import (
	"encoding/json"
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

// GetLeaderboard 获取排行榜 + 当前用户的排名
// 返回：Top50 列表、当前用户排名（nil 表示无今日训练）、错误
func GetLeaderboard(db *gorm.DB, typ string, date string, userID uint64) ([]LeaderboardEntry, *LeaderboardEntry, error) {
	fieldMap := map[string]string{
		"duration": "minutes",
		"calories": "kcal",
		"count":    "count",
	}
	field := fieldMap[typ]
	if field == "" {
		field = "minutes"
	}

	// 1. 尝试从 Redis ZSET 读取
	results, err := cache.ZRevRange(typ, 0, 49)
	if err == nil && len(results) > 0 {
		entries := redisToEntries(db, results)
		myRank := getMyRankRedis(db, typ, userID)
		return entries, myRank, nil
	}

	// 2. Redis 无数据，从 MySQL 聚合查询
	items, err := model.LeaderboardQuery(db, date, field)
	if err != nil {
		return nil, nil, err
	}

	// 3. 异步回填 Redis，设置次日凌晨过期
	go func() {
		for _, item := range items {
			cache.ZIncrBy(typ, item.UserID, item.TotalValue)
		}
		cache.SetLeaderboardExpire()
	}()

	// 4. 构建 Top50 返回结果，补全用户信息
	entries := make([]LeaderboardEntry, len(items))
	for i, item := range items {
		entries[i] = LeaderboardEntry{Rank: i + 1, UserID: item.UserID, Value: item.TotalValue}
		fillEntryUser(db, &entries[i])
	}

	// 5. 查询当前用户的排名（MySQL 回退）
	myRank := getMyRankMySQL(db, date, field, userID)
	return entries, myRank, nil
}

// getMyRankRedis 从 Redis 获取单个用户的排名信息
func getMyRankRedis(db *gorm.DB, typ string, userID uint64) *LeaderboardEntry {
	rank, err := cache.ZRevRank(typ, userID)
	if err != nil || rank < 0 {
		return nil
	}
	score, err := cache.ZScore(typ, userID)
	if err != nil {
		return nil
	}
	entry := &LeaderboardEntry{Rank: int(rank) + 1, UserID: userID, Value: int(score)}
	fillEntryUser(db, entry)
	return entry
}

// getMyRankMySQL 从 MySQL 查询单个用户在今日的排名
func getMyRankMySQL(db *gorm.DB, date, field string, userID uint64) *LeaderboardEntry {
	item, err := model.LeaderboardUserRank(db, date, field, userID)
	if err != nil || item == nil {
		return nil
	}
	entry := &LeaderboardEntry{Rank: item.Rank, UserID: userID, Value: item.TotalValue}
	fillEntryUser(db, entry)
	return entry
}

// fillEntryUser 用数据库中的用户信息填充排行条目
func fillEntryUser(db *gorm.DB, entry *LeaderboardEntry) {
	if user, err := model.FindByID(db, entry.UserID); err == nil {
		entry.Nickname = user.Nickname
		entry.AvatarURL = user.AvatarUrl
		entry.Level = user.Level
		entry.Title = user.Title
	}
	if entry.Nickname == "" {
		entry.Nickname = "运动达人"
	}
	if entry.Level == 0 {
		entry.Level = 1
	}
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
		fillEntryUser(db, &entry)
		entries = append(entries, entry)
	}
	return entries
}

// ReportWorkout 上报训练数据：写入训练记录 → 更新用户累计（事务包裹）→ 更新 Redis 排行榜
func ReportWorkout(db *gorm.DB, userID, roomID uint64, minutes, kcal, count int, exercises []map[string]interface{}) (*model.WorkoutLog, error) {
	var exercisesJSON string
	if len(exercises) > 0 {
		b, err := json.Marshal(exercises)
		if err == nil {
			exercisesJSON = string(b)
		}
	}

	wlog := &model.WorkoutLog{
		UserID:    userID,
		RoomID:    roomID,
		Minutes:   minutes,
		Kcal:      kcal,
		Count:     count,
		Exercises: exercisesJSON,
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
	cache.SetLeaderboardExpire() // 确保每日 0 点重置

	return wlog, nil
}
