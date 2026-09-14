-- 业务表（pgvector 向量表由 spring-ai pgvector starter 自动创建）

CREATE EXTENSION IF NOT EXISTS vector;

-- 知识分类
CREATE TABLE IF NOT EXISTS kb_category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT DEFAULT 0,
    sort        INT DEFAULT 0,
    create_time TIMESTAMP DEFAULT now(),
    update_time TIMESTAMP DEFAULT now(),
    deleted     SMALLINT DEFAULT 0
);

-- 知识文档
CREATE TABLE IF NOT EXISTS kb_document (
    id          BIGSERIAL PRIMARY KEY,
    category_id BIGINT,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    status      SMALLINT DEFAULT 0,
    create_time TIMESTAMP DEFAULT now(),
    update_time TIMESTAMP DEFAULT now(),
    deleted     SMALLINT DEFAULT 0
);

-- 客户
CREATE TABLE IF NOT EXISTS customer (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100),
    phone       VARCHAR(20) UNIQUE,
    wechat      VARCHAR(100),
    is_new      BOOLEAN DEFAULT TRUE,
    tags        VARCHAR(500),
    create_time TIMESTAMP DEFAULT now(),
    update_time TIMESTAMP DEFAULT now(),
    deleted     SMALLINT DEFAULT 0
);

-- 订单
CREATE TABLE IF NOT EXISTS orders (
    id               BIGSERIAL PRIMARY KEY,
    order_no         VARCHAR(64) UNIQUE,
    customer_id      BIGINT,
    product_name     VARCHAR(200),
    status           VARCHAR(20),
    logistics_no     VARCHAR(64),
    logistics_status VARCHAR(100),
    amount           NUMERIC(12, 2),
    create_time      TIMESTAMP DEFAULT now(),
    deleted          SMALLINT DEFAULT 0
);

-- 风险预警
CREATE TABLE IF NOT EXISTS risk_alert (
    id          BIGSERIAL PRIMARY KEY,
    session_id  VARCHAR(64),
    customer_id VARCHAR(64),
    message     TEXT,
    level       VARCHAR(20),
    reason      VARCHAR(255),
    handled     BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP DEFAULT now(),
    deleted     SMALLINT DEFAULT 0
);

-- 转人工工单
CREATE TABLE IF NOT EXISTS human_handoff (
    id            BIGSERIAL PRIMARY KEY,
    risk_alert_id BIGINT,
    session_id    VARCHAR(64),
    customer_id   VARCHAR(64),
    summary       TEXT,
    status        VARCHAR(20),
    create_time   TIMESTAMP DEFAULT now(),
    deleted       SMALLINT DEFAULT 0
);

-- ============ 种子数据（幂等） ============

INSERT INTO kb_category (id, name, parent_id, sort) VALUES (1, '售后政策', 0, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO kb_category (id, name, parent_id, sort) VALUES (2, '物流配送', 0, 2) ON CONFLICT (id) DO NOTHING;

INSERT INTO kb_document (id, category_id, title, content, status) VALUES
    (1, 1, '七天无理由退货政策',
     '自签收之日起 7 天内，商品完好且不影响二次销售，可申请无理由退货。食品、定制类商品除外。退货流程：订单详情页点击「申请售后」→ 选择退货原因 → 提交后等待审核。审核通过后 48 小时内安排上门取件或提供退货地址。',
     0) ON CONFLICT (id) DO NOTHING;

INSERT INTO kb_document (id, category_id, title, content, status) VALUES
    (2, 2, '物流时效说明',
     '默认发货仓库为华东仓，工作日 16:00 前付款订单当日发货，其余次日发货。江浙沪皖一般 1-2 天送达，其他地区 3-5 天。偏远地区（新疆、西藏、内蒙古）7-10 天。节假日顺延。',
     0) ON CONFLICT (id) DO NOTHING;

INSERT INTO customer (id, name, phone, is_new) VALUES (1, '张三', '13800000001', FALSE) ON CONFLICT (id) DO NOTHING;
INSERT INTO customer (id, name, phone, is_new) VALUES (2, '李四', '13800000002', FALSE) ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, order_no, customer_id, product_name, status, logistics_no, logistics_status, amount) VALUES
    (1, 'SO202609010001', 1, '无线蓝牙耳机', 'SHIPPED', 'SF1234567890', '运输中，预计今日送达', 299.00)
    ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, order_no, customer_id, product_name, status, logistics_no, logistics_status, amount) VALUES
    (2, 'SO202609010002', 2, '智能手环', 'COMPLETED', 'SF1234567891', '已签收', 199.00)
    ON CONFLICT (id) DO NOTHING;
