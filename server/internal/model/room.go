package model

import (
	"time"

	"gorm.io/gorm"
)

// Room 房间表
type Room struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	OwnerID    uint64    `gorm:"not null" json:"owner_id"`
	Name       string    `gorm:"size:64;not null" json:"name"`
	InviteCode string    `gorm:"size:8;uniqueIndex;not null" json:"invite_code"`
	MaxMembers int       `gorm:"default:20" json:"max_members"`
	Status     int       `gorm:"default:1" json:"status"` // 1=等待中 2=进行中 0=已结束
	Exercises  string    `gorm:"type:json" json:"exercises"`      // 训练动作JSON (MySQL JSON类型支持utf8mb4)
	ExpireAt   time.Time `json:"expire_at"`                      // 房间过期时间（创建+4小时）
	StartedAt  *time.Time `json:"started_at"`                     // 训练开始时间（NULL=未开始）
	TotalMin   int       `gorm:"default:0" json:"total_min"`
	TotalKcal  int       `gorm:"default:0" json:"total_kcal"`
	TotalCount int       `gorm:"default:0" json:"total_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateRoom 插入一条房间记录
func CreateRoom(db *gorm.DB, room *Room) error {
	return db.Create(room).Error
}

// FindRoomByCode 根据邀请码查找房间
func FindRoomByCode(db *gorm.DB, code string) (*Room, error) {
	var room Room
	err := db.Where("invite_code = ?", code).First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// FindRoomByID 根据主键查找房间
func FindRoomByID(db *gorm.DB, id uint64) (*Room, error) {
	var room Room
	err := db.First(&room, id).Error
	return &room, err
}

// ListActiveRooms 分页查询活跃房间列表（未过期、status!=0, 按创建时间倒序）
func ListActiveRooms(db *gorm.DB, page, size int) ([]Room, int64, error) {
	var rooms []Room
	var total int64
	base := db.Where("status != ? AND expire_at > ?", 0, time.Now())
	base.Count(&total)
	err := db.Where("status != ? AND expire_at > NOW()", 0).
		Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&rooms).Error
	return rooms, total, err
}

// FindActiveRoomByUser 查询用户当前所在的活跃房间
func FindActiveRoomByUser(db *gorm.DB, userID uint64) (*Room, error) {
	var room Room
	err := db.Table("rooms").
		Select("rooms.*").
		Joins("JOIN room_members ON room_members.room_id = rooms.id").
		Where("room_members.user_id = ? AND rooms.status IN (1,2) AND rooms.expire_at > ?", userID, time.Now()).
		Order("rooms.created_at DESC").
		First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// DissolveRoom 解散房间（设置 status=0，只有房主可调用）
func DissolveRoom(db *gorm.DB, roomID, userID uint64) error {
	return db.Model(&Room{}).Where("id = ? AND owner_id = ?", roomID, userID).Update("status", 0).Error
}

// RoomMember 房间成员关联表
type RoomMember struct {
	ID       uint64    `gorm:"primaryKey" json:"id"`
	RoomID   uint64    `gorm:"not null" json:"room_id"`
	UserID   uint64    `gorm:"not null" json:"user_id"`
	JoinedAt time.Time `gorm:"autoCreateTime" json:"joined_at"`
}

// AddMember 添加房间成员（幂等：已存在时不报错）
func AddMember(db *gorm.DB, roomID, userID uint64) error {
	m := RoomMember{RoomID: roomID, UserID: userID}
	return db.Where("room_id = ? AND user_id = ?", roomID, userID).FirstOrCreate(&m).Error
}

// CountMembers 统计房间已加入的成员数
func CountMembers(db *gorm.DB, roomID uint64) (int64, error) {
	var count int64
	err := db.Model(&RoomMember{}).Where("room_id = ?", roomID).Count(&count).Error
	return count, err
}

// MemberInfo 成员信息（含用户昵称头像）
type MemberInfo struct {
	UserID    uint64    `json:"user_id"`
	Nickname  string    `json:"nickname"`
	AvatarURL string    `json:"avatar_url"`
	Level     int       `json:"level"`
	JoinedAt  time.Time `json:"joined_at"`
}

// ListMembers 获取房间成员列表（含用户信息）
func ListMembers(db *gorm.DB, roomID uint64) ([]MemberInfo, error) {
	var members []MemberInfo
	err := db.Table("room_members").
		Select("room_members.user_id, users.nickname, users.avatar_url, users.level, room_members.joined_at").
		Joins("LEFT JOIN users ON users.id = room_members.user_id").
		Where("room_members.room_id = ?", roomID).
		Order("room_members.joined_at ASC").
		Find(&members).Error
	return members, err
}
