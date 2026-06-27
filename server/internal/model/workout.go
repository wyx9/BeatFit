package model

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// WorkoutLog 训练记录表
type WorkoutLog struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"not null" json:"user_id"`
	RoomID    uint64    `gorm:"default:0" json:"room_id"`
	Minutes   int       `gorm:"default:0" json:"minutes"`
	Kcal      int       `gorm:"default:0" json:"kcal"`
	Count     int       `gorm:"default:0" json:"count"`
	Exercises string    `gorm:"type:json;default:null" json:"exercises"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateLog 插入一条训练记录
func CreateLog(db *gorm.DB, log *WorkoutLog) error {
	return db.Create(log).Error
}

// ListWorkoutsByUser 查询用户训练历史（分页按时间倒序）
func ListWorkoutsByUser(db *gorm.DB, userID uint64, page, size int) ([]WorkoutLog, int64, error) {
	var logs []WorkoutLog
	var total int64
	db.Where("user_id = ?", userID).Count(&total)
	err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset((page - 1) * size).Limit(size).
		Find(&logs).Error
	return logs, total, err
}

// ListWorkoutsByUserMonth 查询用户指定月份的记录 + 当月训练日集合
// 返回 logs（按 created_at 倒序）、workoutDays（"2006-06-25" 格式的日期列表）
func ListWorkoutsByUserMonth(db *gorm.DB, userID uint64, year, month int) ([]WorkoutLog, []string, error) {
	var logs []WorkoutLog
	err := db.Where("user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?", userID, year, month).
		Order("created_at DESC").
		Find(&logs).Error
	if err != nil {
		return nil, nil, err
	}

	// 查询当月有训练记录的日期集合
	var days []string
	err = db.Model(&WorkoutLog{}).
		Select("DISTINCT DATE_FORMAT(created_at, '%Y-%m-%d') as day").
		Where("user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?", userID, year, month).
		Order("day ASC").
		Pluck("day", &days).Error
	if err != nil {
		return logs, nil, err
	}

	return logs, days, nil
}

// LeaderboardItem 排行榜聚合查询的结果项
type LeaderboardItem struct {
	UserID     uint64 `json:"user_id"`
	TotalValue int    `json:"total_value"`
	Rank       int    `json:"rank"` // 排名（非 DB 字段，计算填充）
}

// LeaderboardUserRank 查询单个用户在指定日期的排名和聚合值
// 返回 nil 表示用户在该日期无训练记录
func LeaderboardUserRank(db *gorm.DB, date, field string, userID uint64) (*LeaderboardItem, error) {
	allowed := map[string]bool{"minutes": true, "kcal": true, "count": true}
	if !allowed[field] {
		return nil, fmt.Errorf("invalid field: %s", field)
	}

	// 先查该用户的聚合值
	var item LeaderboardItem
	err := db.Model(&WorkoutLog{}).
		Select("user_id", "SUM("+field+") as total_value").
		Where("DATE(created_at) = ? AND user_id = ?", date, userID).
		Group("user_id").
		First(&item).Error
	if err != nil {
		return nil, nil // 无记录，不是错误
	}

	// 查有多少人比该用户分数高
	var rank int64
	db.Model(&WorkoutLog{}).
		Select("user_id", "SUM("+field+") as total_value").
		Where("DATE(created_at) = ?", date).
		Group("user_id").
		Having("SUM("+field+") > ?", item.TotalValue).
		Count(&rank)
	item.Rank = int(rank) + 1
	return &item, nil
}

// LeaderboardQuery 从 MySQL 聚合指定日期的排行榜数据
// field 为聚合字段名（minutes / kcal / count），date 为日期（如 "2026-06-05"）
func LeaderboardQuery(db *gorm.DB, date string, field string) ([]LeaderboardItem, error) {
	// 白名单校验 field，防止 SQL 注入
	allowed := map[string]bool{"minutes": true, "kcal": true, "count": true}
	if !allowed[field] {
		return nil, fmt.Errorf("invalid field: %s", field)
	}

	var items []LeaderboardItem
	err := db.Model(&WorkoutLog{}).
		Select("user_id", "SUM("+field+") as total_value").
		Where("DATE(created_at) = ?", date).
		Group("user_id").
		Order("total_value DESC").
		Limit(50).
		Find(&items).Error
	return items, err
}
