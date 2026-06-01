package service

import (
	"fmt"

	"fitsync/model"
	"fitsync/store"

	"github.com/google/uuid"
)

type RoomService struct {
	store *store.Store
	hub   *Hub
}

func NewRoomService(s *store.Store, h *Hub) *RoomService {
	return &RoomService{store: s, hub: h}
}

func (svc *RoomService) CreateRoom(ownerID string, req model.CreateRoomReq) (*model.Room, error) {
	// 校验用户是否存在
	_, err := svc.store.GetUserByID(ownerID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	code := svc.store.GenerateRoomCode()

	room := &model.Room{
		ID:      uuid.New().String(),
		Code:    code,
		Name:    req.Name,
		OwnerID: ownerID,
		Status:  model.RoomStatusWaiting,
	}

	if err := svc.store.CreateRoom(room); err != nil {
		return nil, fmt.Errorf("create room: %w", err)
	}

	// 创建训练动作
	exercises := make([]model.Exercise, len(req.Exercises))
	exerciseInfos := make([]model.ExerciseInfo, len(req.Exercises))
	for i, e := range req.Exercises {
		exercises[i] = model.Exercise{
			ID:              uuid.New().String(),
			RoomID:          room.ID,
			Name:            e.Name,
			DurationSeconds: e.DurationSeconds,
			SortOrder:       i,
		}
		exerciseInfos[i] = model.ExerciseInfo{
			ID:              exercises[i].ID,
			Name:            e.Name,
			DurationSeconds: e.DurationSeconds,
			SortOrder:       i,
		}
	}

	if err := svc.store.CreateExercises(exercises); err != nil {
		return nil, fmt.Errorf("create exercises: %w", err)
	}

	// 将房主添加为成员
	if err := svc.store.AddMember(room.ID, ownerID); err != nil {
		return nil, fmt.Errorf("add owner as member: %w", err)
	}

	// 初始化 WebSocket 房间会话
	svc.hub.GetOrCreateRoom(code, ownerID, exerciseInfos)

	return room, nil
}

func (svc *RoomService) JoinRoom(code, userID string) (*model.RoomDetail, error) {
	room, err := svc.store.GetRoomByCode(code)
	if err != nil {
		return nil, fmt.Errorf("room not found")
	}

	if room.Status != model.RoomStatusWaiting {
		return nil, fmt.Errorf("room is not accepting members")
	}

	if err := svc.store.AddMember(room.ID, userID); err != nil {
		return nil, fmt.Errorf("join room: %w", err)
	}

	return svc.GetRoomDetail(code)
}

func (svc *RoomService) GetRoomDetail(code string) (*model.RoomDetail, error) {
	room, err := svc.store.GetRoomByCode(code)
	if err != nil {
		return nil, fmt.Errorf("room not found")
	}

	exercises, err := svc.store.GetExercisesByRoomID(room.ID)
	if err != nil {
		return nil, fmt.Errorf("get exercises: %w", err)
	}

	members, err := svc.store.GetMembersByRoomID(room.ID)
	if err != nil {
		return nil, fmt.Errorf("get members: %w", err)
	}

	if members == nil {
		members = []model.User{}
	}

	return &model.RoomDetail{
		Room:      *room,
		Exercises: exercises,
		Members:   members,
	}, nil
}

func (svc *RoomService) ListActiveRooms() ([]model.Room, error) {
	rooms, err := svc.store.ListActiveRooms()
	if err != nil {
		return nil, err
	}
	if rooms == nil {
		rooms = []model.Room{}
	}
	return rooms, nil
}

func (svc *RoomService) StartTraining(code, userID string) error {
	room, err := svc.store.GetRoomByCode(code)
	if err != nil {
		return fmt.Errorf("room not found")
	}

	if room.OwnerID != userID {
		return fmt.Errorf("only the room owner can start training")
	}

	if room.Status != model.RoomStatusWaiting {
		return fmt.Errorf("room is not in waiting status")
	}

	if err := svc.store.UpdateRoomStatus(room.ID, model.RoomStatusActive); err != nil {
		return fmt.Errorf("update room status: %w", err)
	}

	rs := svc.hub.GetRoom(code)
	if rs == nil {
		return fmt.Errorf("room session not found")
	}

	rs.StartTraining()
	return nil
}

// 终止训练：仅房主可调用，停止计时，所有成员返回大厅
func (svc *RoomService) TerminateTraining(code, userID string) error {
	room, err := svc.store.GetRoomByCode(code)
	if err != nil {
		return fmt.Errorf("房间不存在")
	}

	if room.OwnerID != userID {
		return fmt.Errorf("只有房主可以终止训练")
	}

	if room.Status != model.RoomStatusActive {
		return fmt.Errorf("房间不在训练中")
	}

	// 更新房间状态为已完成
	if err := svc.store.UpdateRoomStatus(room.ID, model.RoomStatusFinished); err != nil {
		return fmt.Errorf("更新房间状态失败: %w", err)
	}

	// 终止训练计时，广播 training_terminated，关闭所有客户端
	rs := svc.hub.GetRoom(code)
	if rs != nil {
		rs.Terminate()
	}

	return nil
}

func (svc *RoomService) LeaveRoom(code, userID string) error {
	room, err := svc.store.GetRoomByCode(code)
	if err != nil {
		return err
	}

	if err := svc.store.RemoveMember(room.ID, userID); err != nil {
		return err
	}

	rs := svc.hub.GetRoom(code)
	if rs != nil {
		rs.RemoveClient(userID)
		rs.BroadcastMessage(model.WSMessage{
			Type:   "user_left",
			UserID: userID,
		})
	}

	return nil
}
