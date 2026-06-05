package model

import (
	"time"

	"gorm.io/gorm"
)

// User 用户表
type User struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	Openid     string    `gorm:"size:64;uniqueIndex;not null" json:"-"`
	Nickname   string    `gorm:"size:64" json:"nickname"`
	AvatarUrl  string    `gorm:"size:512" json:"avatar_url"`
	Level      int       `gorm:"default:1" json:"level"`
	Title      string    `gorm:"size:32" json:"title"`
	TotalMin   int       `gorm:"default:0" json:"total_min"`
	TotalKcal  int       `gorm:"default:0" json:"total_kcal"`
	TotalCount int       `gorm:"default:0" json:"total_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// FindOrCreateByOpenid 根据 openid 查找用户，不存在时创建新用户
func FindOrCreateByOpenid(db *gorm.DB, openid string) (*User, error) {
	var user User
	err := db.Where("openid = ?", openid).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		user = User{Openid: openid}
		if err = db.Create(&user).Error; err != nil {
			return nil, err
		}
		return &user, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID 根据主键查找用户
func FindByID(db *gorm.DB, id uint64) (*User, error) {
	var user User
	err := db.First(&user, id).Error
	return &user, err
}

// Save 保存用户信息到数据库
func (u *User) Save(db *gorm.DB) error {
	return db.Save(u).Error
}
