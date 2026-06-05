package cache

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"beat_fit_server/config"

	"github.com/redis/go-redis/v9"
)

var client *redis.Client // 全局 Redis 客户端实例

// Init 初始化 Redis 连接
func Init(cfg *config.Config) {
	client = redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	})
	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Redis 连接失败: %v", err)
	}
	log.Println("Redis 连接成功")
}

// GetClient 获取全局 Redis 客户端
func GetClient() *redis.Client { return client }

// ========== 排行榜缓存（ZSET） ==========

// leaderboardKey 生成排行榜 Redis key
func leaderboardKey(typ string) string {
	return fmt.Sprintf("leaderboard:%s", typ)
}

// ZIncrBy 更新指定排行榜中用户的分数
func ZIncrBy(typ string, userID uint64, score int) error {
	return client.ZIncrBy(
		context.Background(),
		leaderboardKey(typ),
		float64(score),
		strconv.FormatUint(userID, 10),
	).Err()
}

// ZRevRange 获取排行榜降序结果（分数从高到低）
func ZRevRange(typ string, start, stop int64) ([]redis.Z, error) {
	return client.ZRevRangeWithScores(
		context.Background(),
		leaderboardKey(typ),
		start, stop,
	).Result()
}

// SetLeaderboardExpire 设置所有排行榜 key 在次日凌晨过期
func SetLeaderboardExpire() {
	tomorrow := time.Now().Add(24 * time.Hour).Truncate(24 * time.Hour)
	types := []string{"duration", "calories", "count"}
	for _, typ := range types {
		client.ExpireAt(context.Background(), leaderboardKey(typ), tomorrow)
	}
}

// ========== 房间在线缓存（SET） ==========

// AddRoomMember 将用户加入房间在线集合
func AddRoomMember(code string, userID uint64) error {
	key := fmt.Sprintf("room:%s:members", code)
	return client.SAdd(context.Background(), key, userID).Err()
}

// RemoveRoomMember 从房间在线集合移除用户
func RemoveRoomMember(code string, userID uint64) error {
	key := fmt.Sprintf("room:%s:members", code)
	return client.SRem(context.Background(), key, userID).Err()
}

// GetRoomOnlineCount 获取房间当前在线人数
func GetRoomOnlineCount(code string) (int64, error) {
	key := fmt.Sprintf("room:%s:members", code)
	return client.SCard(context.Background(), key).Result()
}

// ========== Token 缓存 ==========

// SetToken 缓存用户 token（7天过期，用于强制登出校验）
func SetToken(userID uint64, token string) error {
	key := fmt.Sprintf("user:%d:token", userID)
	return client.Set(context.Background(), key, token, 7*24*time.Hour).Err()
}

// GetToken 获取缓存中的 token
func GetToken(userID uint64) (string, error) {
	key := fmt.Sprintf("user:%d:token", userID)
	return client.Get(context.Background(), key).Result()
}

// DelToken 删除缓存的 token（用户主动登出时调用）
func DelToken(userID uint64) error {
	key := fmt.Sprintf("user:%d:token", userID)
	return client.Del(context.Background(), key).Err()
}
