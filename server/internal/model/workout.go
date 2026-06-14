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

// LeaderboardItem 排行榜聚合查询的结果项
type LeaderboardItem struct {
	UserID     uint64 `json:"user_id"`
	TotalValue int    `json:"total_value"`
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
