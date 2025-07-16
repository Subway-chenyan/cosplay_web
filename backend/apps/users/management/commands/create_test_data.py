import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.videos.models import Video
from apps.groups.models import Group
from apps.tags.models import Tag, VideoTag
from apps.competitions.models import Competition
from apps.awards.models import Award, AwardRecord

User = get_user_model()


class Command(BaseCommand):
    help = '创建测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清除现有数据',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='创建的数据数量',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_data()
            self.stdout.write(
                self.style.SUCCESS('已清除所有测试数据')
            )

        self.stdout.write('开始创建测试数据...')

        # 创建用户
        users = self.create_users()
        self.stdout.write(f'创建了 {len(users)} 个用户')

        # 创建标签
        tags = self.create_tags()
        self.stdout.write(f'创建了 {len(tags)} 个标签')

        # 创建社团
        groups = self.create_groups(users)
        self.stdout.write(f'创建了 {len(groups)} 个社团')

        # 创建比赛
        competitions = self.create_competitions()
        self.stdout.write(f'创建了 {len(competitions)} 个比赛')

        # 创建奖项
        awards = self.create_awards(competitions)
        self.stdout.write(f'创建了 {len(awards)} 个奖项')

        # 创建视频
        videos = self.create_videos(users, groups, competitions)
        self.stdout.write(f'创建了 {len(videos)} 个视频')

        # 创建关联关系
        self.create_relationships(videos, tags, users, groups, awards)
        self.stdout.write('创建了关联关系')

        # 更新统计信息
        self.update_statistics(groups, videos, tags)
        self.stdout.write('更新了统计信息')

        self.stdout.write(
            self.style.SUCCESS('测试数据创建完成！')
        )

    def clear_data(self):
        """清除现有数据"""
        AwardRecord.objects.all().delete()
        Award.objects.all().delete()
        Competition.objects.all().delete()
        VideoTag.objects.all().delete()
        Video.objects.all().delete()
        Group.objects.all().delete()
        Tag.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """创建用户"""
        users_data = [
            {
                'username': 'admin',
                'email': 'admin@cosplay.com',
                'first_name': '管理员',
                'last_name': '系统',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'editor1',
                'email': 'editor1@cosplay.com',
                'first_name': '编辑',
                'last_name': '一号',
                'role': 'editor',
            },
            {
                'username': 'editor2',
                'email': 'editor2@cosplay.com',
                'first_name': '编辑',
                'last_name': '二号',
                'role': 'editor',
            },
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                user.set_password('password123')
                user.save()
            users.append(user)

        return users

    def create_tags(self):
        """创建标签"""
        tags_data = [
            # 游戏IP
            {'name': '原神', 'category': '游戏IP', 'color': '#FF6B35', 'description': '米哈游开发的开放世界冒险RPG游戏'},
            {'name': '崩坏3', 'category': '游戏IP', 'color': '#FF69B4', 'description': '米哈游开发的3D动作手游'},
            {'name': '明日方舟', 'category': '游戏IP', 'color': '#4169E1', 'description': '鹰角网络开发的塔防策略游戏'},
            {'name': '王者荣耀', 'category': '游戏IP', 'color': '#FFD700', 'description': '腾讯开发的MOBA手游'},
            {'name': '英雄联盟', 'category': '游戏IP', 'color': '#FF4500', 'description': '拳头游戏开发的MOBA游戏'},
            
            # 动漫IP
            {'name': '鬼灭之刃', 'category': '动漫IP', 'color': '#DC143C', 'description': '吾峠呼世晴创作的日本漫画'},
            {'name': '火影忍者', 'category': '动漫IP', 'color': '#FF8C00', 'description': '岸本齐史创作的日本漫画'},
            {'name': '海贼王', 'category': '动漫IP', 'color': '#FF6347', 'description': '尾田荣一郎创作的日本漫画'},
            {'name': '进击的巨人', 'category': '动漫IP', 'color': '#2F4F4F', 'description': '谏山创创作的日本漫画'},
            {'name': '刀剑神域', 'category': '动漫IP', 'color': '#4B0082', 'description': '川原砾创作的轻小说系列'},
            
            # 年份
            {'name': '2023年', 'category': '年份', 'color': '#32CD32', 'description': '2023年作品'},
            {'name': '2024年', 'category': '年份', 'color': '#00CED1', 'description': '2024年作品'},
            {'name': '2022年', 'category': '年份', 'color': '#FF69B4', 'description': '2022年作品'},
            
            # 类型
            {'name': '舞台剧', 'category': '类型', 'color': '#8A2BE2', 'description': '舞台表演类型'},
            {'name': '个人solo', 'category': '类型', 'color': '#FF1493', 'description': '个人表演'},
            {'name': '群体表演', 'category': '类型', 'color': '#00BFFF', 'description': '多人群体表演'},
            {'name': '舞蹈', 'category': '类型', 'color': '#FF69B4', 'description': '舞蹈表演'},
            {'name': '剧情', 'category': '类型', 'color': '#FF4500', 'description': '剧情表演'},
            
            # 风格
            {'name': '古风', 'category': '风格', 'color': '#8B4513', 'description': '古代风格'},
            {'name': '现代', 'category': '风格', 'color': '#696969', 'description': '现代风格'},
            {'name': '奇幻', 'category': '风格', 'color': '#9370DB', 'description': '奇幻风格'},
            {'name': '科幻', 'category': '风格', 'color': '#00CED1', 'description': '科幻风格'},
            {'name': '可爱', 'category': '风格', 'color': '#FFB6C1', 'description': '可爱风格'},
            {'name': '帅气', 'category': '风格', 'color': '#4169E1', 'description': '帅气风格'},
            
            # 地区
            {'name': '北京', 'category': '地区', 'color': '#DC143C', 'description': '北京地区'},
            {'name': '上海', 'category': '地区', 'color': '#FFD700', 'description': '上海地区'},
            {'name': '广州', 'category': '地区', 'color': '#32CD32', 'description': '广州地区'},
            {'name': '深圳', 'category': '地区', 'color': '#00CED1', 'description': '深圳地区'},
        ]

        tags = []
        for tag_data in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=tag_data['name'],
                category=tag_data['category'],
                defaults=tag_data
            )
            tags.append(tag)

        return tags

    def create_groups(self, users):
        """创建社团"""
        groups_data = [
            {
                'name': '星河cosplay社',
                'description': '北京知名cosplay社团，专注于舞台剧表演，成立于2018年。擅长原神、崩坏3等游戏IP的cosplay制作。',
                'founded_date': datetime(2018, 3, 15).date(),
                'location': '北京',
                'website': 'http://xinghe-cosplay.com',
                'email': 'contact@xinghe-cosplay.com',
                'phone': '13800138001',
                'weibo': 'https://weibo.com/xinghecosplay',
                'wechat': 'xinghe_cosplay',
                'qq_group': '123456789',
                'bilibili': 'https://space.bilibili.com/xinghecosplay',
                'is_active': True,
            },
            {
                'name': '梦境工作室',
                'description': '上海专业cosplay制作团队，擅长特效和服装制作。专注于动漫IP的cosplay，如鬼灭之刃、进击的巨人等。',
                'founded_date': datetime(2019, 7, 20).date(),
                'location': '上海',
                'website': '',
                'email': 'dream@studio.com',
                'phone': '13800138002',
                'weibo': 'https://weibo.com/dreamstudio',
                'wechat': 'dream_studio',
                'qq_group': '987654321',
                'bilibili': 'https://space.bilibili.com/dreamstudio',
                'is_active': True,
            },
            {
                'name': '次元空间',
                'description': '广州大学cosplay社团，大学生为主，创意丰富。擅长王者荣耀、英雄联盟等游戏IP的cosplay。',
                'founded_date': datetime(2020, 1, 10).date(),
                'location': '广州',
                'website': 'http://ciyuan-space.cn',
                'email': 'info@ciyuan-space.cn',
                'phone': '13800138003',
                'weibo': 'https://weibo.com/ciyuanspace',
                'wechat': 'ciyuan_space',
                'qq_group': '456789123',
                'bilibili': 'https://space.bilibili.com/ciyuanspace',
                'is_active': True,
            },
            {
                'name': '星辰剧团',
                'description': '深圳新兴cosplay社团，专注于舞蹈和剧情表演。擅长刀剑神域、海贼王等动漫IP。',
                'founded_date': datetime(2021, 5, 8).date(),
                'location': '深圳',
                'website': 'http://xingchen-troupe.com',
                'email': 'info@xingchen-troupe.com',
                'phone': '13800138004',
                'weibo': 'https://weibo.com/xingchentroupe',
                'wechat': 'xingchen_troupe',
                'qq_group': '789123456',
                'bilibili': 'https://space.bilibili.com/xingchentroupe',
                'is_active': True,
            },
        ]

        groups = []
        for group_data in groups_data:
            group = Group.objects.create(
                created_by=random.choice(users),
                **group_data
            )
            groups.append(group)

        return groups

    def create_competitions(self):
        """创建比赛"""
        competitions_data = [
            {
                'name': 'ChinaJoy Cosplay嘉年华',
                'description': 'ChinaJoy展会期间举办的cosplay比赛，是全国最大的游戏展会cosplay赛事之一。',
                'website': 'https://chinajoy.cosplay.com',
            },
            {
                'name': '国漫cosplay大赛',
                'description': '以国产动漫为主题的cosplay比赛，推广国产动漫文化。',
                'website': 'https://guoman.cosplay.com',
            },
            {
                'name': '次元文化节',
                'description': '以二次元文化为主题的大型文化活动，包含cosplay比赛、动漫展览等多个环节。',
                'website': 'https://acg-festival.com',
            },
            {
                'name': '高校cosplay联赛',
                'description': '面向高校学生的cosplay比赛，鼓励大学生参与cosplay文化。',
                'website': 'https://university-cosplay.com',
            },
        ]

        competitions = []
        for comp_data in competitions_data:
            competition, created = Competition.objects.get_or_create(
                name=comp_data['name'],
                defaults=comp_data
            )
            competitions.append(competition)

        return competitions

    def create_awards(self, competitions):
        """创建奖项"""
        # 为每个比赛定义固定的奖项
        awards_config = {
            'ChinaJoy Cosplay嘉年华': [
                '最佳舞台剧表演奖',
                '最佳服装制作奖',
                '最佳化妆奖',
                '最佳道具制作奖',
                '最佳创意奖',
                '最佳人气奖',
            ],
            '国漫cosplay大赛': [
                '最佳国漫还原奖',
                '最佳剧情演绎奖',
                '最佳舞蹈奖',
                '最佳团队奖',
                '最具潜力奖',
            ],
            '次元文化节': [
                '最佳动漫还原奖',
                '最佳特效奖',
                '最佳音乐奖',
                '最佳摄影奖',
                '优秀表演奖',
            ],
            '高校cosplay联赛': [
                '最佳大学生奖',
                '最佳新人奖',
                '最佳创意奖',
                '优秀团队奖',
            ],
        }

        awards = []
        for competition in competitions:
            if competition.name in awards_config:
                for award_name in awards_config[competition.name]:
                    award, created = Award.objects.get_or_create(
                        competition=competition,
                        name=award_name
                    )
                    awards.append(award)

        return awards

    def create_videos(self, users, groups, competitions):
        """创建视频"""
        videos_data = [
            {
                'bv_number': 'BV1Uy3vzbEEo',
                'title': '【cosplay舞台剧】原神璃月篇完整版 - 星河cosplay社',
                'description': '历时3个月制作的原神璃月篇大型舞台剧，还原度极高的服装道具，精彩的剧情演绎。包含钟离、甘雨、胡桃等角色的精彩表演。',
                'url': 'https://www.bilibili.com/video/BV1Uy3vzbEEo/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail.jpg',
                'competition_year': 2023,
                'competition_name': 'ChinaJoy Cosplay嘉年华',
            },
            {
                'bv_number': 'BV2Xy4wzaFFp',
                'title': '【崩坏3】律者觉醒舞台剧精华版 - 次元工作室',
                'description': '次元工作室出品，特效制作精良，服装华丽，表演震撼。琪亚娜、芽衣、布洛妮娅等角色的精彩演绎。',
                'url': 'https://www.bilibili.com/video/BV2Xy4wzaFFp/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail2.jpg',
                'competition_year': 2023,
                'competition_name': 'ChinaJoy Cosplay嘉年华',
            },
            {
                'bv_number': 'BV3Zx5yaGGq',
                'title': '【明日方舟】切尔诺伯格事件舞台剧 - 梦境剧团',
                'description': '梦境剧团倾力打造，大学生cosplay社团的用心之作。阿米娅、陈、德克萨斯等角色的精彩表演。',
                'url': 'https://www.bilibili.com/video/BV3Zx5yaGGq/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail3.jpg',
                'competition_year': 2024,
                'competition_name': '国漫cosplay大赛',
            },
            {
                'bv_number': 'BV4Ay6zaHHr',
                'title': '【鬼灭之刃】无限列车篇 煉獄杏寿郎solo - 个人作品',
                'description': '致敬炎柱煉獄杏寿郎的个人cosplay作品，燃烧的意志永不熄灭。服装制作精良，表演感人至深。',
                'url': 'https://www.bilibili.com/video/BV4Ay6zaHHr/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail4.jpg',
                'competition_year': 2023,
                'competition_name': '次元文化节',
            },
            {
                'bv_number': 'BV5Bz7zaIIs',
                'title': '【王者荣耀】貂蝉·仲夏夜之梦 solo表演',
                'description': '唯美的貂蝉cosplay，梦幻的舞蹈表演。服装华丽，舞蹈优美，完美还原游戏中的角色。',
                'url': 'https://www.bilibili.com/video/BV5Bz7zaIIs/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail5.jpg',
                'competition_year': 2024,
                'competition_name': '高校cosplay联赛',
            },
            {
                'bv_number': 'BV6Ca8zaJJt',
                'title': '【英雄联盟】阿狸·灵魂莲华 精美还原',
                'description': 'LOL阿狸皮肤cosplay，精美的服装制作和化妆技术。完美还原游戏中的角色形象。',
                'url': 'https://www.bilibili.com/video/BV6Ca8zaJJt/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail6.jpg',
                'competition_year': 2024,
                'competition_name': 'ChinaJoy Cosplay嘉年华',
            },
            {
                'bv_number': 'BV7Dd9zaKKu',
                'title': '【火影忍者】鸣人vs佐助 经典对决舞台剧',
                'description': '火影忍者经典对决场景的舞台剧演绎，特效制作精良，表演震撼。',
                'url': 'https://www.bilibili.com/video/BV7Dd9zaKKu/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail7.jpg',
                'competition_year': 2024,
                'competition_name': '次元文化节',
            },
            {
                'bv_number': 'BV8Ee0zaLLv',
                'title': '【海贼王】路飞vs艾尼路 空岛篇舞台剧',
                'description': '海贼王空岛篇经典战斗场景的舞台剧演绎，服装道具制作精良。',
                'url': 'https://www.bilibili.com/video/BV8Ee0zaLLv/',
                'thumbnail': 'https://i0.hdslb.com/bfs/archive/thumbnail8.jpg',
                'competition_year': 2024,
                'competition_name': '国漫cosplay大赛',
            },
        ]

        videos = []
        for i, video_data in enumerate(videos_data):
            # 根据比赛名称找到对应的比赛
            competition_name = video_data.pop('competition_name')
            competition = next((comp for comp in competitions if comp.name == competition_name), None)
            
            # 随机分配社团
            group = groups[i % len(groups)]
            
            video = Video.objects.create(
                uploaded_by=users[i % len(users)],
                group=group,
                competition=competition,
                **video_data
            )
            videos.append(video)

        return videos

    def create_relationships(self, videos, tags, users, groups, awards):
        """创建各种关联关系"""
        # 视频标签关联
        for video in videos:
            # 根据视频内容选择合适的标签
            if '原神' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['原神', '游戏IP', '舞台剧', '2023年', '古风']]
            elif '崩坏3' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['崩坏3', '游戏IP', '舞台剧', '2023年', '科幻']]
            elif '明日方舟' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['明日方舟', '游戏IP', '舞台剧', '2024年', '现代']]
            elif '鬼灭之刃' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['鬼灭之刃', '动漫IP', '个人solo', '2023年', '古风']]
            elif '王者荣耀' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['王者荣耀', '游戏IP', '个人solo', '2024年', '古风']]
            elif '英雄联盟' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['英雄联盟', '游戏IP', '个人solo', '2024年', '现代']]
            elif '火影忍者' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['火影忍者', '动漫IP', '舞台剧', '2024年', '现代']]
            elif '海贼王' in video.title:
                selected_tags = [tag for tag in tags if tag.name in ['海贼王', '动漫IP', '舞台剧', '2024年', '奇幻']]
            else:
                # 随机选择标签
                selected_tags = random.sample(tags, random.randint(2, 5))
            
            # 确保至少选择2个标签
            if len(selected_tags) < 2:
                additional_tags = [tag for tag in tags if tag not in selected_tags]
                selected_tags.extend(random.sample(additional_tags, 2 - len(selected_tags)))
            
            for tag in selected_tags:
                VideoTag.objects.get_or_create(video=video, tag=tag)
                # 更新标签使用次数
                tag.usage_count += 1
                tag.save()

        # 创建获奖记录
        # 为部分视频创建获奖记录
        awarded_videos = random.sample(videos, min(5, len(videos)))
        
        for video in awarded_videos:
            if video.competition:
                # 获取该比赛的所有奖项
                competition_awards = [award for award in awards if award.competition == video.competition]
                if competition_awards:
                    # 随机选择一个奖项
                    award = random.choice(competition_awards)
                    
                    # 创建获奖记录
                    AwardRecord.objects.create(
                        award=award,
                        video=video,
                        group=video.group,
                        year=video.competition_year or 2024,
                        description=f'{video.title} 获得 {award.name}'
                    )

    def update_statistics(self, groups, videos, tags):
        """更新统计信息"""
        # 更新社团的视频数量
        for group in groups:
            group.video_count = group.videos.count()
            group.award_count = group.award_records.count()
            group.save()

        # 更新标签的使用次数（已在create_relationships中处理）
        pass 