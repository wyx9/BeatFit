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
	Sets            int    `json:"sets"`             // 组数，默认5
	Reps            int    `json:"reps"`             // 每组次数，默认8
	DurationSeconds int    `json:"duration_seconds"` // 每组时长(秒)，默认6
	RestSeconds     int    `json:"rest_seconds"`     // 组间休息(秒)，默认20
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
	Sets            int    `json:"sets"`
	Reps            int    `json:"reps"`
	DurationSeconds int    `json:"duration_seconds"`
	RestSeconds     int    `json:"rest_seconds"`
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
	Sets            int    `json:"sets"`
	Reps            int    `json:"reps"`
	DurationSeconds int    `json:"duration_seconds"`
	RestSeconds     int    `json:"rest_seconds"`
	SortOrder       int    `json:"sort_order"`
}

type TrainingStartData struct {
	Exercises     []ExerciseInfo `json:"exercises"`
	CurrentIndex  int            `json:"current_index"`
	TotalDuration int            `json:"total_duration"`
}

type TimerTickData struct {
	SecondsLeft   int    `json:"seconds_left"`
	ExerciseIndex int    `json:"exercise_index"`
	TotalSeconds  int    `json:"total_seconds"`
	SetNumber     int    `json:"set_number"`     // 当前第几组
	TotalSets     int    `json:"total_sets"`     // 总共多少组
	Phase         string `json:"phase"`          // "active" 或 "rest"
	ExerciseName  string `json:"exercise_name"`  // 当前动作名
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
	SetNumber     int            `json:"set_number"`
	SecondsLeft   int            `json:"seconds_left"`
	TotalSeconds  int            `json:"total_seconds"`
	Phase         string         `json:"phase"`
}
