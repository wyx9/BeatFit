package model

import "time"

type RoomStatus string

const (
	RoomStatusWaiting  RoomStatus = "waiting"
	RoomStatusActive   RoomStatus = "active"
	RoomStatusFinished RoomStatus = "finished"
)

type User struct {
	ID        string    `json:"id"`
	OpenID    string    `json:"-"`
	Nickname  string    `json:"nickname"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

type Room struct {
	ID        string     `json:"id"`
	Code      string     `json:"code"`
	Name      string     `json:"name"`
	OwnerID   string     `json:"owner_id"`
	Status    RoomStatus `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
}

type Exercise struct {
	ID              string `json:"id"`
	RoomID          string `json:"room_id"`
	Name            string `json:"name"`
	DurationSeconds int    `json:"duration_seconds"`
	SortOrder       int    `json:"sort_order"`
}

type RoomMember struct {
	RoomID   string    `json:"room_id"`
	UserID   string    `json:"user_id"`
	JoinedAt time.Time `json:"joined_at"`
}

// API 请求/响应类型

type CreateRoomReq struct {
	Name      string            `json:"name" binding:"required"`
	Exercises []CreateExercise  `json:"exercises" binding:"required,min=1"`
}

type CreateExercise struct {
	Name            string `json:"name" binding:"required"`
	DurationSeconds int    `json:"duration_seconds" binding:"required,min=1"`
}

type JoinRoomReq struct {
	UserID string `json:"user_id" binding:"required"`
}

type LoginReq struct {
	Code string `json:"code" binding:"required"`
}

type LoginResp struct {
	UserID   string `json:"user_id"`
	Nickname string `json:"nickname"`
	Token    string `json:"token"`
}

type RoomDetail struct {
	Room      Room        `json:"room"`
	Exercises []Exercise  `json:"exercises"`
	Members   []User      `json:"members"`
}

// WebSocket 消息类型

type WSMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data,omitempty"`
	UserID    string      `json:"user_id,omitempty"`
	Timestamp int64       `json:"timestamp,omitempty"`
}

type ExerciseInfo struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	DurationSeconds int    `json:"duration_seconds"`
	SortOrder       int    `json:"sort_order"`
}

type TrainingStartData struct {
	Exercises     []ExerciseInfo `json:"exercises"`
	CurrentIndex  int            `json:"current_index"`
	TotalDuration int            `json:"total_duration"`
}

type TimerTickData struct {
	SecondsLeft   int `json:"seconds_left"`
	ExerciseIndex int `json:"exercise_index"`
	TotalSeconds  int `json:"total_seconds"`
}

type ExerciseChangeData struct {
	ExerciseIndex int          `json:"exercise_index"`
	Exercise      ExerciseInfo `json:"exercise"`
	TotalDuration int          `json:"total_duration"`
}

// 训练重连：新客户端连入时，服务端下发的当前进度
type TrainingResumeData struct {
	Exercises     []ExerciseInfo `json:"exercises"`
	CurrentIndex  int            `json:"current_index"`
	SecondsLeft   int            `json:"seconds_left"`
	TotalSeconds  int            `json:"total_seconds"`
}
