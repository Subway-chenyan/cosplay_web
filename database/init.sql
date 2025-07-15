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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 比赛表 (competitions)
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER,
    location VARCHAR(100),
    website TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 奖项表 (awards)
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 剧目表 (performances)
CREATE TABLE performances (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    group_id INTEGER REFERENCES groups(id),
    original_work VARCHAR(255),
    description TEXT,
    type VARCHAR(50),
    debut_date DATE,
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

-- 视频-剧目关联表 (video_performances)
CREATE TABLE video_performances (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    performance_id INTEGER REFERENCES performances(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, performance_id)
);

-- 获奖记录表 (award_records)
CREATE TABLE award_records (
    id SERIAL PRIMARY KEY,
    award_id INTEGER REFERENCES awards(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id),
    performance_id INTEGER REFERENCES performances(id),
    group_id INTEGER REFERENCES groups(id),
    year INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表（支持多用户管理）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer', -- admin, editor, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 视频收藏表
CREATE TABLE video_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- 视频评分表
CREATE TABLE video_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
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

-- 比赛表索引
CREATE INDEX idx_competitions_name ON competitions USING gin(name gin_trgm_ops);
CREATE INDEX idx_competitions_year ON competitions(year);
CREATE INDEX idx_competitions_start_date ON competitions(start_date);

-- 标签表索引
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_name_category ON tags(name, category);

-- 剧目表索引
CREATE INDEX idx_performances_title ON performances USING gin(title gin_trgm_ops);
CREATE INDEX idx_performances_group_id ON performances(group_id);
CREATE INDEX idx_performances_type ON performances(type);
CREATE INDEX idx_performances_debut_date ON performances(debut_date);

-- 获奖记录表索引
CREATE INDEX idx_award_records_year ON award_records(year);
CREATE INDEX idx_award_records_award_id ON award_records(award_id);
CREATE INDEX idx_award_records_group_id ON award_records(group_id);
CREATE INDEX idx_award_records_video_id ON award_records(video_id);
CREATE INDEX idx_award_records_performance_id ON award_records(performance_id);

-- 关联表索引
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_groups_video_id ON video_groups(video_id);
CREATE INDEX idx_video_groups_group_id ON video_groups(group_id);
CREATE INDEX idx_video_performances_video_id ON video_performances(video_id);
CREATE INDEX idx_video_performances_performance_id ON video_performances(performance_id);

-- 用户相关索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_video_favorites_user_id ON video_favorites(user_id);
CREATE INDEX idx_video_favorites_video_id ON video_favorites(video_id);
CREATE INDEX idx_video_ratings_user_id ON video_ratings(user_id);
CREATE INDEX idx_video_ratings_video_id ON video_ratings(video_id);

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

CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON performances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_records_updated_at BEFORE UPDATE ON award_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_ratings_updated_at BEFORE UPDATE ON video_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_logs_updated_at BEFORE UPDATE ON import_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据用于测试

-- 插入示例社团
INSERT INTO groups (name, description, founded_date, website) VALUES 
('星河cosplay社', '北京知名cosplay社团，专注于舞台剧表演', '2018-03-15', 'http://xinghe-cosplay.com'),
('梦境工作室', '上海专业cosplay制作团队', '2019-07-20', NULL),
('次元空间', '广州大学cosplay社团', '2020-01-10', 'http://ciyuan-space.cn');

-- 插入示例比赛
INSERT INTO competitions (name, year, location, website, start_date, end_date) VALUES 
('全国cosplay大赛', 2023, '北京', 'http://national-cosplay.com', '2023-08-15', '2023-08-17'),
('次元文化节', 2023, '上海', 'http://ciyuan-festival.com', '2023-10-01', '2023-10-03'),
('漫展cosplay比赛', 2024, '广州', NULL, '2024-02-15', '2024-02-17');

-- 插入示例奖项
INSERT INTO awards (competition_id, name, description, rank) VALUES 
(1, '最佳舞台剧表演奖', '全国cosplay大赛舞台剧类别最高奖项', 1),
(1, '最佳服装制作奖', '服装工艺最佳奖项', 1),
(2, '人气奖', '观众投票选出的人气奖', 2),
(3, '创意奖', '最具创意的表演奖项', 1);

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

-- 插入示例剧目
INSERT INTO performances (title, group_id, original_work, description, type, debut_date) VALUES 
('原神·璃月篇', 1, '原神', '以原神璃月地区为背景的舞台剧', '舞台剧', '2023-06-15'),
('崩坏3·律者觉醒', 2, '崩坏3', '展现律者力量觉醒的表演', '舞台剧', '2023-08-20'),
('明日方舟·切尔诺伯格事件', 3, '明日方舟', '重现游戏经典剧情', '舞台剧', '2024-01-10');

-- 插入示例视频（注意：这里的BV号是示例，实际使用时需要真实的B站视频）
INSERT INTO videos (bv_number, title, url, description, upload_date, view_count, performance_date) VALUES 
('BV1Uy3vzbEEo', '【cosplay舞台剧】原神璃月篇完整版', 'https://www.bilibili.com/video/BV1Uy3vzbEEo/', '星河cosplay社原创舞台剧，历时3个月制作', '2023-06-20', 150000, '2023-06-15'),
('BV1Uy3vzbEEo', '【崩坏3】律者觉醒舞台剧精华版', 'https://www.bilibili.com/video/BV1Uy3vzbEEo/', '梦境工作室出品，特效制作精良', '2023-08-25', 89000, '2023-08-20'),
('BV1Uy3vzbEEo', '【明日方舟】切尔诺伯格事件舞台剧', 'https://www.bilibili.com/video/BV1Uy3vzbEEo/', '次元空间社团倾力打造', '2024-01-15', 67000, '2024-01-10');

-- 建立视频与社团的关联
INSERT INTO video_groups (video_id, group_id) VALUES 
(1, 1), (2, 2), (3, 3);

-- 建立视频与剧目的关联
INSERT INTO video_performances (video_id, performance_id) VALUES 
(1, 1), (2, 2), (3, 3);

-- 建立视频与标签的关联
INSERT INTO video_tags (video_id, tag_id) VALUES 
(1, 1), (1, 4), (1, 6), (1, 9),  -- 原神, 2023年, 舞台剧, 古风
(2, 2), (2, 4), (2, 6), (2, 11), -- 崩坏3, 2023年, 舞台剧, 奇幻
(3, 3), (3, 5), (3, 6), (3, 10); -- 明日方舟, 2024年, 舞台剧, 现代

-- 插入获奖记录
INSERT INTO award_records (award_id, video_id, performance_id, group_id, year, description) VALUES 
(1, 1, 1, 1, 2023, '《原神·璃月篇》获得全国cosplay大赛最佳舞台剧表演奖'),
(2, 2, 2, 2, 2023, '《崩坏3·律者觉醒》获得全国cosplay大赛最佳服装制作奖');

-- 创建视图以便查询

-- 视频详情视图（包含关联信息）
CREATE VIEW video_details AS
SELECT 
    v.*,
    ARRAY_AGG(DISTINCT g.name) AS group_names,
    ARRAY_AGG(DISTINCT p.title) AS performance_titles,
    ARRAY_AGG(DISTINCT t.name) AS tag_names,
    ARRAY_AGG(DISTINCT CONCAT(t.name, ':', t.category)) AS tag_details
FROM videos v
LEFT JOIN video_groups vg ON v.id = vg.video_id
LEFT JOIN groups g ON vg.group_id = g.id
LEFT JOIN video_performances vp ON v.id = vp.video_id
LEFT JOIN performances p ON vp.performance_id = p.id
LEFT JOIN video_tags vt ON v.id = vt.video_id
LEFT JOIN tags t ON vt.tag_id = t.id
GROUP BY v.id;

-- 社团统计视图
CREATE VIEW group_statistics AS
SELECT 
    g.*,
    COUNT(DISTINCT vg.video_id) AS video_count,
    COUNT(DISTINCT p.id) AS performance_count,
    COUNT(DISTINCT ar.award_id) AS award_count
FROM groups g
LEFT JOIN video_groups vg ON g.id = vg.group_id
LEFT JOIN performances p ON g.id = p.group_id
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

COMMENT ON DATABASE cosplay_db IS 'Cosplay舞台剧视频数据库';
COMMENT ON TABLE videos IS '视频信息表';
COMMENT ON TABLE groups IS '社团信息表';
COMMENT ON TABLE competitions IS '比赛信息表';
COMMENT ON TABLE awards IS '奖项信息表';
COMMENT ON TABLE performances IS '剧目信息表';
COMMENT ON TABLE tags IS '标签信息表';
COMMENT ON TABLE award_records IS '获奖记录表'; 