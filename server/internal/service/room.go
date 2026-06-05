package service

import (
	"fmt"
	"math/rand"
	"time"

	"beat_fit_server/internal/model"

	"gorm.io/gorm"
)

// CreateRoom 创建房间：生成4位邀请码 → 写入 DB → 房主自动加入
func CreateRoom(db *gorm.DB, ownerID uint64, name string, maxMembers int, exercises string) (*model.Room, error) {
	if maxMembers <= 0 || maxMembers > 50 {
		maxMembers = 20
	}

	code, err := generateInviteCode(db)
	if err != nil {
		return nil, err
	}

	room := &model.Room{
		OwnerID:    ownerID,
		Name:       name,
		InviteCode: code,
		MaxMembers: maxMembers,
		Status:     1,                                             // 1=等待中
		Exercises:  exercises,
		ExpireAt:   time.Now().Add(4 * time.Hour),                 // 4小时后过期
	}
	if err := model.CreateRoom(db, room); err != nil {
		return nil, fmt.Errorf("创建房间失败: %w", err)
	}

	if err := model.AddMember(db, room.ID, ownerID); err != nil {
		return nil, fmt.Errorf("房主加入失败: %w", err)
	}

	return room, nil
}

// DissolveRoom 解散房间：仅房主可操作
func DissolveRoom(db *gorm.DB, roomID, userID uint64) error {
	room, err := model.FindRoomByID(db, roomID)
	if err != nil {
		return fmt.Errorf("房间不存在")
	}
	if room.OwnerID != userID {
		return fmt.Errorf("只有房主可以解散房间")
	}
	if room.Status == 0 {
		return fmt.Errorf("房间已解散")
	}
	return model.DissolveRoom(db, roomID, userID)
}

// JoinRoom 加入房间：根据邀请码查找 → 校验状态和人数上限 → 加入
func JoinRoom(db *gorm.DB, userID uint64, inviteCode string) (*model.Room, error) {
	// 查找房间
	room, err := model.FindRoomByCode(db, inviteCode)
	if err != nil {
		return nil, fmt.Errorf("房间不存在，请检查邀请码")
	}
	if room.Status == 0 {
		return nil, fmt.Errorf("房间已解散")
	}
	if room.ExpireAt.Before(time.Now()) {
		return nil, fmt.Errorf("房间已过期")
	}

	// 检查人数上限
	count, _ := model.CountMembers(db, room.ID)
	if int(count) >= room.MaxMembers {
		return nil, fmt.Errorf("房间已满 (%d/%d)", count, room.MaxMembers)
	}

	// 加入（幂等：重复加入不报错）
	if err := model.AddMember(db, room.ID, userID); err != nil {
		return nil, fmt.Errorf("加入房间失败: %w", err)
	}

	return room, nil
}

// generateInviteCode 生成4位不重复的数字邀请码（最多尝试100次）
func generateInviteCode(db *gorm.DB) (string, error) {
	for range 100 {
		code := fmt.Sprintf("%04d", rand.Intn(10000))
		_, err := model.FindRoomByCode(db, code)
		if err == gorm.ErrRecordNotFound {
			return code, nil // 唯一，返回
		}
	}
	return "", fmt.Errorf("无法生成唯一邀请码，请重试")
}
