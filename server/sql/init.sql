-- Beat Fit 数据库初始化脚本
CREATE DATABASE IF NOT EXISTS beat_fit DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beat_fit;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    openid      VARCHAR(64)  NOT NULL UNIQUE COMMENT '微信openid',
    nickname    VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '昵称',
    avatar_url  VARCHAR(512) NOT NULL DEFAULT '' COMMENT '头像URL',
    level       INT          NOT NULL DEFAULT 1 COMMENT '等级',
    title       VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '称号(健身达人等)',
    total_min   INT          NOT NULL DEFAULT 0 COMMENT '累计运动时长(分钟)',
    total_kcal  INT          NOT NULL DEFAULT 0 COMMENT '累计消耗(千卡)',
    total_count INT          NOT NULL DEFAULT 0 COMMENT '累计运动次数',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='用户表';

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id    BIGINT UNSIGNED NOT NULL COMMENT '房主用户ID',
    name        VARCHAR(64)  NOT NULL COMMENT '房间名称',
    invite_code VARCHAR(8)   NOT NULL UNIQUE COMMENT '4位数字邀请码',
    max_members INT          NOT NULL DEFAULT 20 COMMENT '最大人数',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '1=进行中 0=已结束',
    total_min   INT          NOT NULL DEFAULT 0 COMMENT '房间累计时长',
    total_kcal  INT          NOT NULL DEFAULT 0 COMMENT '房间累计消耗',
    total_count INT          NOT NULL DEFAULT 0 COMMENT '房间累计次数',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invite_code (invite_code),
    INDEX idx_status (status)
) COMMENT='房间表';

-- 房间成员表
CREATE TABLE IF NOT EXISTS room_members (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT UNSIGNED NOT NULL,
    user_id    BIGINT UNSIGNED NOT NULL,
    joined_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_room_user (room_id, user_id),
    INDEX idx_room_id (room_id)
) COMMENT='房间成员表';

-- 训练记录表
CREATE TABLE IF NOT EXISTS workout_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    room_id     BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '关联房间ID,0=个人训练',
    minutes     INT      NOT NULL DEFAULT 0 COMMENT '本次训练时长(分钟)',
    kcal        INT      NOT NULL DEFAULT 0 COMMENT '本次消耗(千卡)',
    count       INT      NOT NULL DEFAULT 0 COMMENT '本次动作次数',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_created_at (created_at)
) COMMENT='训练记录表';
