-- Cosplay舞台剧视频数据库初始化脚本
-- 基于Django模型结构创建

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表 (users) - 基于Django User模型
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) UNIQUE NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 社团表 (groups) - 基于Group模型
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    logo VARCHAR(100),
    founded_date DATE,
    location VARCHAR(100),
    website VARCHAR(200),
    email VARCHAR(254),
    phone VARCHAR(20),
    weibo VARCHAR(200),
    wechat VARCHAR(50),
    qq_group VARCHAR(20),
    bilibili VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    video_count INTEGER NOT NULL DEFAULT 0,
    award_count INTEGER NOT NULL DEFAULT 0,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 比赛表 (competitions) - 基于Competition模型
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    website VARCHAR(200),
    year INTEGER NOT NULL DEFAULT 2024,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 标签表 (tags) - 基于Tag模型
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color VARCHAR(7) NOT NULL DEFAULT '#007bff',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category)
);

-- 视频表 (videos) - 基于Video模型
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bv_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    url VARCHAR(200) NOT NULL,
    thumbnail VARCHAR(200),
    duration INTERVAL,
    resolution VARCHAR(20),
    file_size BIGINT,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    upload_date TIMESTAMP,
    performance_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_original BOOLEAN NOT NULL DEFAULT TRUE,
    competition_year INTEGER,
    uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 奖项表 (awards) - 基于Award模型
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    level VARCHAR(20),
    prize_money DECIMAL(10,2),
    prize_description TEXT NOT NULL DEFAULT '',
    winner_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 获奖记录表 (award_records) - 基于AwardRecord模型
CREATE TABLE award_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    year INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 视频标签关联表 (video_tags) - 基于VideoTag模型
CREATE TABLE video_tags (
    id SERIAL PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, tag_id)
);

-- 创建索引提高查询性能

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 社团表索引
CREATE INDEX idx_groups_name ON groups USING gin(name gin_trgm_ops);
CREATE INDEX idx_groups_is_active ON groups(is_active);
CREATE INDEX idx_groups_is_verified ON groups(is_verified);
CREATE INDEX idx_groups_is_featured ON groups(is_featured);
CREATE INDEX idx_groups_created_by ON groups(created_by_id);

-- 比赛表索引
CREATE INDEX idx_competitions_name ON competitions USING gin(name gin_trgm_ops);
CREATE INDEX idx_competitions_year ON competitions(year);

-- 标签表索引
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_is_active ON tags(is_active);
CREATE INDEX idx_tags_usage_count ON tags(usage_count);

-- 视频表索引
CREATE INDEX idx_videos_bv_number ON videos(bv_number);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_is_featured ON videos(is_featured);
CREATE INDEX idx_videos_performance_date ON videos(performance_date);
CREATE INDEX idx_videos_upload_date ON videos(upload_date);
CREATE INDEX idx_videos_group_id ON videos(group_id);
CREATE INDEX idx_videos_competition_id ON videos(competition_id);
CREATE INDEX idx_videos_competition_year ON videos(competition_year);
CREATE INDEX idx_videos_uploaded_by ON videos(uploaded_by_id);

-- 奖项表索引
CREATE INDEX idx_awards_competition_id ON awards(competition_id);
CREATE INDEX idx_awards_level ON awards(level);

-- 获奖记录表索引
CREATE INDEX idx_award_records_award_id ON award_records(award_id);
CREATE INDEX idx_award_records_video_id ON award_records(video_id);
CREATE INDEX idx_award_records_group_id ON award_records(group_id);
CREATE INDEX idx_award_records_year ON award_records(year);

-- 视频标签关联表索引
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_records_updated_at BEFORE UPDATE ON award_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据

-- 插入示例用户
INSERT INTO users (username, email, password, first_name, last_name, role, is_staff, is_superuser) VALUES 
('admin', 'admin@cosplay.com', 'pbkdf2_sha256$600000$hashed_password_here', '管理员', '系统', 'admin', TRUE, TRUE),
('editor1', 'editor1@cosplay.com', 'pbkdf2_sha256$600000$hashed_password_here', '编辑', '一号', 'editor', FALSE, FALSE),
('editor2', 'editor2@cosplay.com', 'pbkdf2_sha256$600000$hashed_password_here', '编辑', '二号', 'editor', FALSE, FALSE);

-- 插入示例社团
INSERT INTO groups (name, description, founded_date, location, website, email, phone, weibo, wechat, qq_group, bilibili, is_active, is_verified, is_featured, created_by_id) VALUES 
('星河cosplay社', '北京知名cosplay社团，专注于舞台剧表演，成立于2018年。擅长原神、崩坏3等游戏IP的cosplay制作。', '2018-03-15', '北京', 'http://xinghe-cosplay.com', 'contact@xinghe-cosplay.com', '13800138001', 'https://weibo.com/xinghecosplay', 'xinghe_cosplay', '123456789', 'https://space.bilibili.com/xinghecosplay', TRUE, TRUE, TRUE, 1),
('梦境工作室', '上海专业cosplay制作团队，擅长特效和服装制作。专注于动漫IP的cosplay，如鬼灭之刃、进击的巨人等。', '2019-07-20', '上海', '', 'dream@studio.com', '13800138002', 'https://weibo.com/dreamstudio', 'dream_studio', '987654321', 'https://space.bilibili.com/dreamstudio', TRUE, FALSE, FALSE, 1),
('次元空间', '广州大学cosplay社团，大学生为主，创意丰富。擅长王者荣耀、英雄联盟等游戏IP的cosplay。', '2020-01-10', '广州', 'http://ciyuan-space.cn', 'info@ciyuan-space.cn', '13800138003', 'https://weibo.com/ciyuanspace', 'ciyuan_space', '456789123', 'https://space.bilibili.com/ciyuanspace', TRUE, TRUE, FALSE, 1),
('星辰剧团', '深圳新兴cosplay社团，专注于舞蹈和剧情表演。擅长刀剑神域、海贼王等动漫IP。', '2021-05-08', '深圳', 'http://xingchen-troupe.com', 'info@xingchen-troupe.com', '13800138004', 'https://weibo.com/xingchentroupe', 'xingchen_troupe', '789123456', 'https://space.bilibili.com/xingchentroupe', TRUE, FALSE, TRUE, 1);

-- 插入示例比赛
INSERT INTO competitions (name, description, website, year) VALUES 
('全国cosplay大赛', '全国性的cosplay比赛，汇聚各地优秀社团。每年举办一次，是cosplay界的重要赛事。', 'https://cosplay-competition.com', 2024),
('次元文化节', '以二次元文化为主题的大型文化活动，包含cosplay比赛、动漫展览等多个环节。', 'https://acg-festival.com', 2023),
('漫展cosplay比赛', '漫展期间举办的cosplay竞赛活动，为coser提供展示平台。', 'https://comic-con-cosplay.com', 2024),
('高校cosplay联赛', '面向高校学生的cosplay比赛，鼓励大学生参与cosplay文化。', 'https://university-cosplay.com', 2023);

-- 插入示例标签
INSERT INTO tags (name, category, description, color) VALUES 
-- 游戏IP
('原神', '游戏IP', '米哈游开发的开放世界冒险RPG游戏', '#FF6B35'),
('崩坏3', '游戏IP', '米哈游开发的3D动作手游', '#FF69B4'),
('明日方舟', '游戏IP', '鹰角网络开发的塔防策略游戏', '#4169E1'),
('王者荣耀', '游戏IP', '腾讯开发的MOBA手游', '#FFD700'),
('英雄联盟', '游戏IP', '拳头游戏开发的MOBA游戏', '#FF4500'),
-- 动漫IP
('鬼灭之刃', '动漫IP', '吾峠呼世晴创作的日本漫画', '#DC143C'),
('火影忍者', '动漫IP', '岸本齐史创作的日本漫画', '#FF8C00'),
('海贼王', '动漫IP', '尾田荣一郎创作的日本漫画', '#FF6347'),
('进击的巨人', '动漫IP', '谏山创创作的日本漫画', '#2F4F4F'),
('刀剑神域', '动漫IP', '川原砾创作的轻小说系列', '#4B0082'),
-- 年份
('2023年', '年份', '2023年作品', '#32CD32'),
('2024年', '年份', '2024年作品', '#00CED1'),
('2022年', '年份', '2022年作品', '#FF69B4'),
-- 类型
('舞台剧', '类型', '舞台表演类型', '#8A2BE2'),
('个人solo', '类型', '个人表演', '#FF1493'),
('群体表演', '类型', '多人群体表演', '#00BFFF'),
('舞蹈', '类型', '舞蹈表演', '#FF69B4'),
('剧情', '类型', '剧情表演', '#FF4500'),
-- 风格
('古风', '风格', '古代风格', '#8B4513'),
('现代', '风格', '现代风格', '#696969'),
('奇幻', '风格', '奇幻风格', '#9370DB'),
('科幻', '风格', '科幻风格', '#00CED1'),
('可爱', '风格', '可爱风格', '#FFB6C1'),
('帅气', '风格', '帅气风格', '#4169E1'),
-- 地区
('北京', '地区', '北京地区', '#DC143C'),
('上海', '地区', '上海地区', '#FFD700'),
('广州', '地区', '广州地区', '#32CD32'),
('深圳', '地区', '深圳地区', '#00CED1');

-- 插入示例奖项
INSERT INTO awards (name, description, competition_id, level, prize_money, prize_description, winner_count) VALUES 
('最佳舞台剧表演奖', '全国cosplay大赛 最佳舞台剧表演奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), '金奖', 10000.00, '金奖奖杯 + 10000元奖金', 1),
('最佳服装制作奖', '全国cosplay大赛 最佳服装制作奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), '金奖', 8000.00, '金奖奖杯 + 8000元奖金', 1),
('最佳化妆奖', '全国cosplay大赛 最佳化妆奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), '银奖', 5000.00, '银奖奖杯 + 5000元奖金', 2),
('最佳道具制作奖', '全国cosplay大赛 最佳道具制作奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), '银奖', 5000.00, '银奖奖杯 + 5000元奖金', 2),
('最佳创意奖', '全国cosplay大赛 最佳创意奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), '铜奖', 3000.00, '铜奖奖杯 + 3000元奖金', 3),
('最佳人气奖', '次元文化节 最佳人气奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '次元文化节'), '特别奖', 2000.00, '特别奖奖杯 + 2000元奖金', 3),
('优秀表演奖', '次元文化节 优秀表演奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '次元文化节'), '优秀奖', 1000.00, '优秀奖奖杯 + 1000元奖金', 5),
('优秀团队奖', '漫展cosplay比赛 优秀团队奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '漫展cosplay比赛'), '优秀奖', 1000.00, '优秀奖奖杯 + 1000元奖金', 3),
('最具潜力奖', '高校cosplay联赛 最具潜力奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '高校cosplay联赛'), '潜力奖', 500.00, '潜力奖奖杯 + 500元奖金', 5),
('最佳舞蹈奖', '漫展cosplay比赛 最佳舞蹈奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '漫展cosplay比赛'), '银奖', 4000.00, '银奖奖杯 + 4000元奖金', 2),
('最佳剧情奖', '高校cosplay联赛 最佳剧情奖，奖励优秀cosplay作品', (SELECT id FROM competitions WHERE name = '高校cosplay联赛'), '铜奖', 3000.00, '铜奖奖杯 + 3000元奖金', 3);

-- 插入示例视频
INSERT INTO videos (bv_number, title, description, url, thumbnail, upload_date, performance_date, status, is_featured, is_original, competition_year, uploaded_by_id, group_id, competition_id, view_count, like_count, share_count, duration, resolution, file_size) VALUES 
('BV1Uy3vzbEEo', '【cosplay舞台剧】原神璃月篇完整版 - 星河cosplay社', '历时3个月制作的原神璃月篇大型舞台剧，还原度极高的服装道具，精彩的剧情演绎。包含钟离、甘雨、胡桃等角色的精彩表演。', 'https://www.bilibili.com/video/BV1Uy3vzbEEo/', 'https://i0.hdslb.com/bfs/archive/thumbnail.jpg', CURRENT_TIMESTAMP - INTERVAL '30 days', '2023-06-15', 'published', TRUE, TRUE, 2023, 1, (SELECT id FROM groups WHERE name = '星河cosplay社'), (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), 150000, 8500, 1200, INTERVAL '25 minutes', '1080p', 250000000),
('BV2Xy4wzaFFp', '【崩坏3】律者觉醒舞台剧精华版 - 次元工作室', '次元工作室出品，特效制作精良，服装华丽，表演震撼。琪亚娜、芽衣、布洛妮娅等角色的精彩演绎。', 'https://www.bilibili.com/video/BV2Xy4wzaFFp/', 'https://i0.hdslb.com/bfs/archive/thumbnail2.jpg', CURRENT_TIMESTAMP - INTERVAL '25 days', '2023-08-20', 'published', TRUE, TRUE, 2023, 2, (SELECT id FROM groups WHERE name = '梦境工作室'), (SELECT id FROM competitions WHERE name = '次元文化节'), 89000, 4200, 800, INTERVAL '20 minutes', '1080p', 180000000),
('BV3Zx5yaGGq', '【明日方舟】切尔诺伯格事件舞台剧 - 梦境剧团', '梦境剧团倾力打造，大学生cosplay社团的用心之作。阿米娅、陈、德克萨斯等角色的精彩表演。', 'https://www.bilibili.com/video/BV3Zx5yaGGq/', 'https://i0.hdslb.com/bfs/archive/thumbnail3.jpg', CURRENT_TIMESTAMP - INTERVAL '20 days', '2024-01-10', 'published', FALSE, TRUE, 2024, 3, (SELECT id FROM groups WHERE name = '次元空间'), (SELECT id FROM competitions WHERE name = '漫展cosplay比赛'), 67000, 3100, 600, INTERVAL '18 minutes', '720p', 150000000),
('BV4Ay6zaHHr', '【鬼灭之刃】无限列车篇 煉獄杏寿郎solo - 个人作品', '致敬炎柱煉獄杏寿郎的个人cosplay作品，燃烧的意志永不熄灭。服装制作精良，表演感人至深。', 'https://www.bilibili.com/video/BV4Ay6zaHHr/', 'https://i0.hdslb.com/bfs/archive/thumbnail4.jpg', CURRENT_TIMESTAMP - INTERVAL '15 days', '2023-12-05', 'published', TRUE, TRUE, 2023, 1, (SELECT id FROM groups WHERE name = '星辰剧团'), (SELECT id FROM competitions WHERE name = '高校cosplay联赛'), 45000, 2800, 400, INTERVAL '12 minutes', '1080p', 120000000),
('BV5Bz7zaIIs', '【王者荣耀】貂蝉·仲夏夜之梦 solo表演', '唯美的貂蝉cosplay，梦幻的舞蹈表演。服装华丽，舞蹈优美，完美还原游戏中的角色。', 'https://www.bilibili.com/video/BV5Bz7zaIIs/', 'https://i0.hdslb.com/bfs/archive/thumbnail5.jpg', CURRENT_TIMESTAMP - INTERVAL '10 days', '2024-02-14', 'published', FALSE, TRUE, 2024, 2, (SELECT id FROM groups WHERE name = '星河cosplay社'), (SELECT id FROM competitions WHERE name = '漫展cosplay比赛'), 38000, 2200, 300, INTERVAL '8 minutes', '1080p', 80000000),
('BV6Ca8zaJJt', '【英雄联盟】阿狸·灵魂莲华 精美还原', 'LOL阿狸皮肤cosplay，精美的服装制作和化妆技术。完美还原游戏中的角色形象。', 'https://www.bilibili.com/video/BV6Ca8zaJJt/', 'https://i0.hdslb.com/bfs/archive/thumbnail6.jpg', CURRENT_TIMESTAMP - INTERVAL '5 days', '2024-03-01', 'published', TRUE, TRUE, 2024, 3, (SELECT id FROM groups WHERE name = '次元空间'), (SELECT id FROM competitions WHERE name = '高校cosplay联赛'), 52000, 3500, 500, INTERVAL '15 minutes', '4K', 300000000),
('BV7Dd9zaKKu', '【火影忍者】鸣人vs佐助 经典对决舞台剧', '火影忍者经典对决场景的舞台剧演绎，特效制作精良，表演震撼。', 'https://www.bilibili.com/video/BV7Dd9zaKKu/', 'https://i0.hdslb.com/bfs/archive/thumbnail7.jpg', CURRENT_TIMESTAMP - INTERVAL '3 days', '2024-03-15', 'published', FALSE, TRUE, 2024, 1, (SELECT id FROM groups WHERE name = '梦境工作室'), (SELECT id FROM competitions WHERE name = '全国cosplay大赛'), 28000, 1800, 250, INTERVAL '22 minutes', '1080p', 200000000),
('BV8Ee0zaLLv', '【海贼王】路飞vs艾尼路 空岛篇舞台剧', '海贼王空岛篇经典战斗场景的舞台剧演绎，服装道具制作精良。', 'https://www.bilibili.com/video/BV8Ee0zaLLv/', 'https://i0.hdslb.com/bfs/archive/thumbnail8.jpg', CURRENT_TIMESTAMP - INTERVAL '1 day', '2024-03-20', 'published', TRUE, TRUE, 2024, 2, (SELECT id FROM groups WHERE name = '星辰剧团'), (SELECT id FROM competitions WHERE name = '次元文化节'), 35000, 2400, 350, INTERVAL '28 minutes', '1080p', 280000000);

-- 建立视频与标签的关联
INSERT INTO video_tags (video_id, tag_id) VALUES 
-- 原神视频标签
((SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM tags WHERE name = '原神' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM tags WHERE name = '游戏IP' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM tags WHERE name = '舞台剧' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM tags WHERE name = '2023年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM tags WHERE name = '古风' AND category = '风格')),
-- 崩坏3视频标签
((SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM tags WHERE name = '崩坏3' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM tags WHERE name = '游戏IP' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM tags WHERE name = '舞台剧' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM tags WHERE name = '2023年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM tags WHERE name = '科幻' AND category = '风格')),
-- 明日方舟视频标签
((SELECT id FROM videos WHERE bv_number = 'BV3Zx5yaGGq'), (SELECT id FROM tags WHERE name = '明日方舟' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV3Zx5yaGGq'), (SELECT id FROM tags WHERE name = '游戏IP' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV3Zx5yaGGq'), (SELECT id FROM tags WHERE name = '舞台剧' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV3Zx5yaGGq'), (SELECT id FROM tags WHERE name = '2024年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV3Zx5yaGGq'), (SELECT id FROM tags WHERE name = '现代' AND category = '风格')),
-- 鬼灭之刃视频标签
((SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM tags WHERE name = '鬼灭之刃' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM tags WHERE name = '动漫IP' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM tags WHERE name = '个人solo' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM tags WHERE name = '2023年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM tags WHERE name = '古风' AND category = '风格')),
-- 王者荣耀视频标签
((SELECT id FROM videos WHERE bv_number = 'BV5Bz7zaIIs'), (SELECT id FROM tags WHERE name = '王者荣耀' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV5Bz7zaIIs'), (SELECT id FROM tags WHERE name = '游戏IP' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV5Bz7zaIIs'), (SELECT id FROM tags WHERE name = '个人solo' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV5Bz7zaIIs'), (SELECT id FROM tags WHERE name = '2024年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV5Bz7zaIIs'), (SELECT id FROM tags WHERE name = '古风' AND category = '风格')),
-- 英雄联盟视频标签
((SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM tags WHERE name = '英雄联盟' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM tags WHERE name = '游戏IP' AND category = '游戏IP')),
((SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM tags WHERE name = '个人solo' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM tags WHERE name = '2024年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM tags WHERE name = '现代' AND category = '风格')),
-- 火影忍者视频标签
((SELECT id FROM videos WHERE bv_number = 'BV7Dd9zaKKu'), (SELECT id FROM tags WHERE name = '火影忍者' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV7Dd9zaKKu'), (SELECT id FROM tags WHERE name = '动漫IP' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV7Dd9zaKKu'), (SELECT id FROM tags WHERE name = '舞台剧' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV7Dd9zaKKu'), (SELECT id FROM tags WHERE name = '2024年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV7Dd9zaKKu'), (SELECT id FROM tags WHERE name = '现代' AND category = '风格')),
-- 海贼王视频标签
((SELECT id FROM videos WHERE bv_number = 'BV8Ee0zaLLv'), (SELECT id FROM tags WHERE name = '海贼王' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV8Ee0zaLLv'), (SELECT id FROM tags WHERE name = '动漫IP' AND category = '动漫IP')),
((SELECT id FROM videos WHERE bv_number = 'BV8Ee0zaLLv'), (SELECT id FROM tags WHERE name = '舞台剧' AND category = '类型')),
((SELECT id FROM videos WHERE bv_number = 'BV8Ee0zaLLv'), (SELECT id FROM tags WHERE name = '2024年' AND category = '年份')),
((SELECT id FROM videos WHERE bv_number = 'BV8Ee0zaLLv'), (SELECT id FROM tags WHERE name = '奇幻' AND category = '风格'));

-- 插入获奖记录
INSERT INTO award_records (award_id, video_id, group_id, year, description) VALUES 
((SELECT id FROM awards WHERE name = '最佳舞台剧表演奖' AND competition_id = (SELECT id FROM competitions WHERE name = '全国cosplay大赛')), (SELECT id FROM videos WHERE bv_number = 'BV1Uy3vzbEEo'), (SELECT id FROM groups WHERE name = '星河cosplay社'), 2023, '《原神·璃月篇》获得全国cosplay大赛最佳舞台剧表演奖'),
((SELECT id FROM awards WHERE name = '最佳服装制作奖' AND competition_id = (SELECT id FROM competitions WHERE name = '全国cosplay大赛')), (SELECT id FROM videos WHERE bv_number = 'BV2Xy4wzaFFp'), (SELECT id FROM groups WHERE name = '梦境工作室'), 2023, '《崩坏3·律者觉醒》获得全国cosplay大赛最佳服装制作奖'),
((SELECT id FROM awards WHERE name = '最佳化妆奖' AND competition_id = (SELECT id FROM competitions WHERE name = '全国cosplay大赛')), (SELECT id FROM videos WHERE bv_number = 'BV4Ay6zaHHr'), (SELECT id FROM groups WHERE name = '星辰剧团'), 2023, '《鬼灭之刃·无限列车篇》获得全国cosplay大赛最佳化妆奖'),
((SELECT id FROM awards WHERE name = '最佳创意奖' AND competition_id = (SELECT id FROM competitions WHERE name = '全国cosplay大赛')), (SELECT id FROM videos WHERE bv_number = 'BV6Ca8zaJJt'), (SELECT id FROM groups WHERE name = '次元空间'), 2024, '《英雄联盟·阿狸》获得全国cosplay大赛最佳创意奖');

-- 更新标签使用次数
UPDATE tags SET usage_count = (
    SELECT COUNT(*) FROM video_tags WHERE tag_id = tags.id
);

-- 更新社团统计信息
UPDATE groups SET 
    video_count = (
        SELECT COUNT(*) FROM videos WHERE group_id = groups.id
    ),
    award_count = (
        SELECT COUNT(*) FROM award_records WHERE group_id = groups.id
    );

-- 表注释
COMMENT ON TABLE users IS '用户管理表（基于Django User模型）';
COMMENT ON TABLE groups IS '社团信息表';
COMMENT ON TABLE competitions IS '比赛信息表';
COMMENT ON TABLE tags IS '标签信息表';
COMMENT ON TABLE videos IS '视频信息表';
COMMENT ON TABLE awards IS '奖项信息表';
COMMENT ON TABLE award_records IS '获奖记录表';
COMMENT ON TABLE video_tags IS '视频标签关联表'; 