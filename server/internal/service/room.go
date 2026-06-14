package service

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"beat_fit_server/internal/model"

	"gorm.io/gorm"
)

// CreateRoom 创建房间：生成4位邀请码 → 写入 DB → 房主自动加入（事务包裹）
func CreateRoom(db *gorm.DB, ownerID uint64, name string, maxMembers int, exercises string) (*model.Room, error) {
	if maxMembers <= 0 || maxMembers > 50 {
		maxMembers = 20
	}

	var room *model.Room
	err := db.Transaction(func(tx *gorm.DB) error {
		code, err := generateInviteCode(tx)
		if err != nil {
			return err
		}

		room = &model.Room{
			OwnerID:    ownerID,
			Name:       name,
			InviteCode: code,
			MaxMembers: maxMembers,
			Status:     1,
			Exercises:  exercises,
			ExpireAt:   time.Now().Add(4 * time.Hour),
		}
		if err := model.CreateRoom(tx, room); err != nil {
			return fmt.Errorf("创建房间失败: %w", err)
		}
		if err := model.AddMember(tx, room.ID, ownerID); err != nil {
			return fmt.Errorf("房主加入失败: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return room, nil
}

// DissolveRoom 解散房间：事务内更新状态+清理成员+设过期，事务外广播 room_closed
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

	// 事务内完成所有 DB 操作
	err = db.Transaction(func(tx *gorm.DB) error {
		// 设置 status=0 + expire_at=now
		if err := tx.Model(&model.Room{}).Where("id = ?", roomID).
			Updates(map[string]interface{}{"status": 0, "expire_at": time.Now()}).Error; err != nil {
			return fmt.Errorf("更新房间状态失败: %w", err)
		}
		// 清理房间成员
		if err := tx.Where("room_id = ?", roomID).Delete(&model.RoomMember{}).Error; err != nil {
			log.Printf("[WARN] 清理房间成员失败 room=%d err=%v", roomID, err)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// 事务外广播 room_closed（WS 广播不影响 DB 回滚）
	if Hub != nil {
		msg := &WSMessage{
			Type: "room_closed",
			Data: map[string]interface{}{"room_id": roomID},
		}
		Hub.BroadcastAll(room.InviteCode, msg)
	}

	return nil
}

// JoinRoom 加入房间：根据邀请码查找 → 校验状态和人数上限 → 加入（事务+行锁防竞态）
func JoinRoom(db *gorm.DB, userID uint64, inviteCode string) (*model.Room, error) {
	var room *model.Room
	err := db.Transaction(func(tx *gorm.DB) error {
		// 查找房间（带行锁，防止并发超员）
		r, err := model.FindRoomByCodeForUpdate(tx, inviteCode)
		if err != nil {
			return fmt.Errorf("房间不存在，请检查邀请码")
		}
		if r.Status == 0 {
			return fmt.Errorf("房间已解散")
		}
		if r.Status == 2 {
			return fmt.Errorf("房间训练已开始")
		}
		if r.ExpireAt.Before(time.Now()) {
			return fmt.Errorf("房间已过期")
		}

		// 在行锁保护下重新检查人数
		count, _ := model.CountMembers(tx, r.ID)
		if int(count) >= r.MaxMembers {
			return fmt.Errorf("房间已满 (%d/%d)", count, r.MaxMembers)
		}

		// 加入（幂等：重复加入不报错）
		if err := model.AddMember(tx, r.ID, userID); err != nil {
			return fmt.Errorf("加入房间失败: %w", err)
		}
		room = r
		return nil
	})
	if err != nil {
		return nil, err
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
