-- Cosplay舞台剧视频数据库初始化脚本
-- 创建数据库（如果不存在）
-- CREATE DATABASE cosplay_db;

-- 使用数据库
-- \c cosplay_db;

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 视频表 (videos)
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    bv_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    description TEXT,
    upload_date DATE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    performance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 社团表 (groups)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo TEXT,
    founded_date DATE,
    description TEXT,
    website TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    weibo TEXT,
    wechat VARCHAR(50),
    qq_group VARCHAR(20),
    bilibili TEXT,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    video_count INTEGER DEFAULT 0,
    award_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 比赛表 (competitions) - 简化版本
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 奖项表 (awards) - 删除rank字段
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level VARCHAR(20),
    prize_money DECIMAL(10,2),
    prize_description TEXT,
    winner_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 标签表 (tags)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category)
);

-- 视频-标签关联表 (video_tags)
CREATE TABLE video_tags (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, tag_id)
);

-- 视频-社团关联表 (video_groups)
CREATE TABLE video_groups (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, group_id)
);

-- 获奖记录表 (award_records) - 删除performance_id字段
CREATE TABLE award_records (
    id SERIAL PRIMARY KEY,
    award_id INTEGER REFERENCES awards(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id),
    group_id INTEGER REFERENCES groups(id),
    year INTEGER NOT NULL,
    description TEXT,
    certificate_url TEXT,
    prize_received BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表（简化版本，仅供管理员使用）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role VARCHAR(20) DEFAULT 'editor', -- admin, editor
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据导入日志表
CREATE TABLE import_logs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    import_type VARCHAR(50), -- videos, groups, competitions, etc.
    status VARCHAR(20), -- pending, processing, completed, failed
    total_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    error_details TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引提高查询性能

-- 视频表索引
CREATE INDEX idx_videos_title ON videos USING gin(title gin_trgm_ops);
CREATE INDEX idx_videos_upload_date ON videos(upload_date);
CREATE INDEX idx_videos_performance_date ON videos(performance_date);
CREATE INDEX idx_videos_view_count ON videos(view_count);
CREATE INDEX idx_videos_bv_number ON videos(bv_number);

-- 社团表索引
CREATE INDEX idx_groups_name ON groups USING gin(name gin_trgm_ops);
CREATE INDEX idx_groups_founded_date ON groups(founded_date);
CREATE INDEX idx_groups_is_active ON groups(is_active);
CREATE INDEX idx_groups_is_verified ON groups(is_verified);
CREATE INDEX idx_groups_is_featured ON groups(is_featured);

-- 比赛表索引
CREATE INDEX idx_competitions_name ON competitions USING gin(name gin_trgm_ops);
CREATE INDEX idx_competitions_year ON competitions(year);

-- 奖项表索引
CREATE INDEX idx_awards_competition_id ON awards(competition_id);
CREATE INDEX idx_awards_level ON awards(level);

-- 标签表索引
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_name_category ON tags(name, category);

-- 获奖记录表索引
CREATE INDEX idx_award_records_year ON award_records(year);
CREATE INDEX idx_award_records_award_id ON award_records(award_id);
CREATE INDEX idx_award_records_group_id ON award_records(group_id);
CREATE INDEX idx_award_records_video_id ON award_records(video_id);

-- 关联表索引
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_groups_video_id ON video_groups(video_id);
CREATE INDEX idx_video_groups_group_id ON video_groups(group_id);

-- 用户相关索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 导入日志索引
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_import_type ON import_logs(import_type);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_records_updated_at BEFORE UPDATE ON award_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_logs_updated_at BEFORE UPDATE ON import_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据用于测试

-- 插入示例管理员用户
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@cosplay.com', 'hashed_password_here', 'admin'),
('editor1', 'editor1@cosplay.com', 'hashed_password_here', 'editor');

-- 插入示例社团
INSERT INTO groups (name, description, founded_date, website, location, is_active, is_verified) VALUES 
('星河cosplay社', '北京知名cosplay社团，专注于舞台剧表演', '2018-03-15', 'http://xinghe-cosplay.com', '北京', TRUE, TRUE),
('梦境工作室', '上海专业cosplay制作团队', '2019-07-20', NULL, '上海', TRUE, FALSE),
('次元空间', '广州大学cosplay社团', '2020-01-10', 'http://ciyuan-space.cn', '广州', TRUE, TRUE);

-- 插入示例比赛
INSERT INTO competitions (name, year, description) VALUES 
('全国cosplay大赛', 2023, '全国性的cosplay比赛，汇聚各地优秀社团'),
('次元文化节', 2023, '以二次元文化为主题的大型文化活动'),
('漫展cosplay比赛', 2024, '漫展期间举办的cosplay竞赛活动');

-- 插入示例奖项
INSERT INTO awards (competition_id, name, description, level, winner_count) VALUES 
(1, '最佳舞台剧表演奖', '全国cosplay大赛舞台剧类别最高奖项', '金奖', 1),
(1, '最佳服装制作奖', '服装工艺最佳奖项', '金奖', 1),
(2, '人气奖', '观众投票选出的人气奖', '特别奖', 3),
(3, '创意奖', '最具创意的表演奖项', '银奖', 2);

-- 插入示例标签分类
INSERT INTO tags (name, category) VALUES 
('原神', '游戏IP'),
('崩坏3', '游戏IP'),
('明日方舟', '游戏IP'),
('2023年', '年份'),
('2024年', '年份'),
('舞台剧', '类型'),
('个人solo', '类型'),
('群体表演', '类型'),
('古风', '风格'),
('现代', '风格'),
('奇幻', '风格');

-- 插入示例视频（注意：这里的BV号是示例，实际使用时需要真实的B站视频）
INSERT INTO videos (bv_number, title, url, description, upload_date, view_count, like_count, performance_date) VALUES 
('BV1Uy3vzbEEo', '【cosplay舞台剧】原神璃月篇完整版', 'https://www.bilibili.com/video/BV1Uy3vzbEEo/', '星河cosplay社原创舞台剧，历时3个月制作', '2023-06-20', 150000, 8500, '2023-06-15'),
('BV1Uy3vzbEEp', '【崩坏3】律者觉醒舞台剧精华版', 'https://www.bilibili.com/video/BV1Uy3vzbEEp/', '梦境工作室出品，特效制作精良', '2023-08-25', 89000, 4200, '2023-08-20'),
('BV1Uy3vzbEEq', '【明日方舟】切尔诺伯格事件舞台剧', 'https://www.bilibili.com/video/BV1Uy3vzbEEq/', '次元空间社团倾力打造', '2024-01-15', 67000, 3100, '2024-01-10');

-- 建立视频与社团的关联
INSERT INTO video_groups (video_id, group_id) VALUES 
(1, 1), (2, 2), (3, 3);

-- 建立视频与标签的关联
INSERT INTO video_tags (video_id, tag_id) VALUES 
(1, 1), (1, 4), (1, 6), (1, 9),  -- 原神, 2023年, 舞台剧, 古风
(2, 2), (2, 4), (2, 6), (2, 11), -- 崩坏3, 2023年, 舞台剧, 奇幻
(3, 3), (3, 5), (3, 6), (3, 10); -- 明日方舟, 2024年, 舞台剧, 现代

-- 插入获奖记录
INSERT INTO award_records (award_id, video_id, group_id, year, description) VALUES 
(1, 1, 1, 2023, '《原神·璃月篇》获得全国cosplay大赛最佳舞台剧表演奖'),
(2, 2, 2, 2023, '《崩坏3·律者觉醒》获得全国cosplay大赛最佳服装制作奖');

-- 创建视图以便查询

-- 视频详情视图（包含关联信息）
CREATE VIEW video_details AS
SELECT 
    v.*,
    ARRAY_AGG(DISTINCT g.name) AS group_names,
    ARRAY_AGG(DISTINCT t.name) AS tag_names,
    ARRAY_AGG(DISTINCT CONCAT(t.name, ':', t.category)) AS tag_details
FROM videos v
LEFT JOIN video_groups vg ON v.id = vg.video_id
LEFT JOIN groups g ON vg.group_id = g.id
LEFT JOIN video_tags vt ON v.id = vt.video_id
LEFT JOIN tags t ON vt.tag_id = t.id
GROUP BY v.id;

-- 社团统计视图
CREATE VIEW group_statistics AS
SELECT 
    g.*,
    COUNT(DISTINCT vg.video_id) AS video_count,
    COUNT(DISTINCT ar.award_id) AS award_count
FROM groups g
LEFT JOIN video_groups vg ON g.id = vg.group_id
LEFT JOIN award_records ar ON g.id = ar.group_id
GROUP BY g.id;

-- 比赛统计视图
CREATE VIEW competition_statistics AS
SELECT 
    c.*,
    COUNT(DISTINCT a.id) AS award_count,
    COUNT(DISTINCT ar.id) AS award_record_count
FROM competitions c
LEFT JOIN awards a ON c.id = a.competition_id
LEFT JOIN award_records ar ON a.id = ar.award_id
GROUP BY c.id;

-- 表注释
COMMENT ON TABLE videos IS '视频信息表';
COMMENT ON TABLE groups IS '社团信息表';
COMMENT ON TABLE competitions IS '比赛信息表';
COMMENT ON TABLE awards IS '奖项信息表';
COMMENT ON TABLE tags IS '标签信息表';
COMMENT ON TABLE award_records IS '获奖记录表';
COMMENT ON TABLE users IS '用户管理表（仅管理员）'; 