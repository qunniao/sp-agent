-- ============================================================
-- 日志管理 - 建表语句
-- 数据库：sp_base
-- 说明：操作日志和登录日志共用同一库，通过表名区分
-- ============================================================

-- 操作日志表
CREATE TABLE IF NOT EXISTS `t_operation_log` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `operator`    VARCHAR(50)  DEFAULT ''    COMMENT '操作人',
    `action`      VARCHAR(100) DEFAULT ''    COMMENT '操作类型（如：用户管理、角色管理）',
    `method`      VARCHAR(10)  DEFAULT ''    COMMENT '请求方法 GET/POST/PUT/DELETE',
    `path`        VARCHAR(200) DEFAULT ''    COMMENT '请求路径',
    `ip`          VARCHAR(50)  DEFAULT ''    COMMENT 'IP 地址',
    `status`      TINYINT      DEFAULT 1     COMMENT '状态：1=成功 0=失败',
    `error_msg`   TEXT                       COMMENT '错误信息',
    `cost_time`   BIGINT       DEFAULT 0     COMMENT '耗时（毫秒）',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    INDEX `idx_operator` (`operator`),
    INDEX `idx_action` (`action`),
    INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 登录日志表
CREATE TABLE IF NOT EXISTS `t_login_log` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`   VARCHAR(50)  DEFAULT ''    COMMENT '用户名',
    `ip`         VARCHAR(50)  DEFAULT ''    COMMENT 'IP 地址',
    `browser`    VARCHAR(50)  DEFAULT ''    COMMENT '浏览器',
    `os`         VARCHAR(50)  DEFAULT ''    COMMENT '操作系统',
    `status`     TINYINT      DEFAULT 1     COMMENT '状态：1=成功 0=失败',
    `error_msg`  TEXT                       COMMENT '错误信息',
    `login_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    PRIMARY KEY (`id`),
    INDEX `idx_username` (`username`),
    INDEX `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';
