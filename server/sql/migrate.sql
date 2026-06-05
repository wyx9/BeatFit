-- Beat Fit 数据库迁移脚本（已有数据库升级用）

-- 1. 修复 exercises 字段编码（原 TEXT 类型不支持中文，改为 JSON 类型）
ALTER TABLE rooms MODIFY COLUMN exercises JSON COMMENT '训练动作JSON';

-- 2. 如果没有 expire_at 字段则添加
-- ALTER TABLE rooms ADD COLUMN expire_at DATETIME NOT NULL DEFAULT (NOW() + INTERVAL 4 HOUR) COMMENT '房间过期时间';

-- 3. 更新已存在的空 expire_at
-- UPDATE rooms SET expire_at = DATE_ADD(created_at, INTERVAL 4 HOUR) WHERE expire_at IS NULL OR expire_at = '0000-00-00';
