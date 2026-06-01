package store

import (
	"database/sql"
	"fmt"
	"time"

	"fitsync/model"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func New(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	db.SetMaxOpenConns(1)

	if err := initSchema(db); err != nil {
		return nil, fmt.Errorf("init schema: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func initSchema(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		openid TEXT UNIQUE NOT NULL,
		nickname TEXT NOT NULL,
		avatar_url TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS rooms (
		id TEXT PRIMARY KEY,
		code TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		owner_id TEXT NOT NULL,
		status TEXT DEFAULT 'waiting',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (owner_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS exercises (
		id TEXT PRIMARY KEY,
		room_id TEXT NOT NULL,
		name TEXT NOT NULL,
		duration_seconds INTEGER NOT NULL,
		sort_order INTEGER NOT NULL,
		FOREIGN KEY (room_id) REFERENCES rooms(id)
	);

	CREATE TABLE IF NOT EXISTS room_members (
		room_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (room_id, user_id),
		FOREIGN KEY (room_id) REFERENCES rooms(id),
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
	CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
	CREATE INDEX IF NOT EXISTS idx_exercises_room ON exercises(room_id);
	`

	_, err := db.Exec(schema)
	return err
}

// 用户操作

func (s *Store) CreateUser(user *model.User) error {
	_, err := s.db.Exec(
		"INSERT INTO users (id, openid, nickname, avatar_url) VALUES (?, ?, ?, ?)",
		user.ID, user.OpenID, user.Nickname, user.AvatarURL,
	)
	return err
}

func (s *Store) GetUserByID(id string) (*model.User, error) {
	user := &model.User{}
	err := s.db.QueryRow(
		"SELECT id, openid, nickname, avatar_url, created_at FROM users WHERE id = ?", id,
	).Scan(&user.ID, &user.OpenID, &user.Nickname, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *Store) GetUserByOpenID(openid string) (*model.User, error) {
	user := &model.User{}
	err := s.db.QueryRow(
		"SELECT id, openid, nickname, avatar_url, created_at FROM users WHERE openid = ?", openid,
	).Scan(&user.ID, &user.OpenID, &user.Nickname, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// 房间操作

func (s *Store) CreateRoom(room *model.Room) error {
	_, err := s.db.Exec(
		"INSERT INTO rooms (id, code, name, owner_id, status) VALUES (?, ?, ?, ?, ?)",
		room.ID, room.Code, room.Name, room.OwnerID, room.Status,
	)
	return err
}

func (s *Store) GetRoomByCode(code string) (*model.Room, error) {
	room := &model.Room{}
	err := s.db.QueryRow(
		"SELECT id, code, name, owner_id, status, created_at FROM rooms WHERE code = ?", code,
	).Scan(&room.ID, &room.Code, &room.Name, &room.OwnerID, &room.Status, &room.CreatedAt)
	if err != nil {
		return nil, err
	}
	return room, nil
}

func (s *Store) GetRoomByID(id string) (*model.Room, error) {
	room := &model.Room{}
	err := s.db.QueryRow(
		"SELECT id, code, name, owner_id, status, created_at FROM rooms WHERE id = ?", id,
	).Scan(&room.ID, &room.Code, &room.Name, &room.OwnerID, &room.Status, &room.CreatedAt)
	if err != nil {
		return nil, err
	}
	return room, nil
}

func (s *Store) ListActiveRooms() ([]model.Room, error) {
	rows, err := s.db.Query(
		"SELECT id, code, name, owner_id, status, created_at FROM rooms WHERE status = 'waiting' ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []model.Room
	for rows.Next() {
		var r model.Room
		if err := rows.Scan(&r.ID, &r.Code, &r.Name, &r.OwnerID, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, r)
	}
	return rooms, nil
}

func (s *Store) UpdateRoomStatus(id string, status model.RoomStatus) error {
	_, err := s.db.Exec("UPDATE rooms SET status = ? WHERE id = ?", status, id)
	return err
}

// 训练动作操作

func (s *Store) CreateExercises(exercises []model.Exercise) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, e := range exercises {
		_, err := tx.Exec(
			"INSERT INTO exercises (id, room_id, name, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?)",
			e.ID, e.RoomID, e.Name, e.DurationSeconds, e.SortOrder,
		)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) GetExercisesByRoomID(roomID string) ([]model.Exercise, error) {
	rows, err := s.db.Query(
		"SELECT id, room_id, name, duration_seconds, sort_order FROM exercises WHERE room_id = ? ORDER BY sort_order",
		roomID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []model.Exercise
	for rows.Next() {
		var e model.Exercise
		if err := rows.Scan(&e.ID, &e.RoomID, &e.Name, &e.DurationSeconds, &e.SortOrder); err != nil {
			return nil, err
		}
		exercises = append(exercises, e)
	}
	return exercises, nil
}

// 房间成员操作

func (s *Store) AddMember(roomID, userID string) error {
	_, err := s.db.Exec(
		"INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)",
		roomID, userID,
	)
	return err
}

func (s *Store) RemoveMember(roomID, userID string) error {
	_, err := s.db.Exec(
		"DELETE FROM room_members WHERE room_id = ? AND user_id = ?",
		roomID, userID,
	)
	return err
}

func (s *Store) GetMembersByRoomID(roomID string) ([]model.User, error) {
	rows, err := s.db.Query(
		`SELECT u.id, u.openid, u.nickname, u.avatar_url, u.created_at
		 FROM users u
		 JOIN room_members rm ON u.id = rm.user_id
		 WHERE rm.room_id = ?`, roomID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.OpenID, &u.Nickname, &u.AvatarURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (s *Store) IsMember(roomID, userID string) (bool, error) {
	var count int
	err := s.db.QueryRow(
		"SELECT COUNT(*) FROM room_members WHERE room_id = ? AND user_id = ?",
		roomID, userID,
	).Scan(&count)
	return count > 0, err
}

// 生成唯一房间码
func (s *Store) GenerateRoomCode() string {
	for {
		code := randomCode(6)
		var count int
		err := s.db.QueryRow("SELECT COUNT(*) FROM rooms WHERE code = ?", code).Scan(&count)
		if err != nil || count == 0 {
			return code
		}
	}
}

func randomCode(n int) string {
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, n)
	for i := range b {
		pos := time.Now().UnixNano() % int64(len(letters))
		b[i] = letters[pos]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}
