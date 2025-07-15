from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random

from apps.users.models import UserProfile, UserSetting
from apps.videos.models import Video, VideoFavorite, VideoRating, VideoComment
from apps.groups.models import Group, GroupMember, GroupFollower
from apps.tags.models import Tag, VideoTag
from apps.performances.models import Performance, PerformanceVideo
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

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('清除现有数据...'))
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('开始创建测试数据...'))
        
        # 创建用户
        users = self.create_users()
        self.stdout.write(f'创建了 {len(users)} 个用户')
        
        # 创建标签
        tags = self.create_tags()
        self.stdout.write(f'创建了 {len(tags)} 个标签')
        
        # 创建社团
        groups = self.create_groups(users)
        self.stdout.write(f'创建了 {len(groups)} 个社团')
        
        # 创建演出
        performances = self.create_performances(groups)
        self.stdout.write(f'创建了 {len(performances)} 个演出')
        
        # 创建比赛
        competitions = self.create_competitions()
        self.stdout.write(f'创建了 {len(competitions)} 个比赛')
        
        # 创建奖项
        awards = self.create_awards(competitions)
        self.stdout.write(f'创建了 {len(awards)} 个奖项')
        
        # 创建视频
        videos = self.create_videos(users, groups)
        self.stdout.write(f'创建了 {len(videos)} 个视频')
        
        # 创建关联关系
        self.create_relationships(videos, tags, performances, users, groups, awards)
        self.stdout.write('创建了各种关联关系')
        
        self.stdout.write(self.style.SUCCESS('测试数据创建完成！'))

    def clear_data(self):
        """清除现有数据"""
        models_to_clear = [
            VideoTag, PerformanceVideo, AwardRecord, VideoComment, VideoRating, 
            VideoFavorite, GroupFollower, GroupMember, Video, Performance, 
            Award, Competition, Group, Tag, UserSetting, UserProfile
        ]
        
        for model in models_to_clear:
            model.objects.all().delete()
        
        # 删除除超级用户外的所有用户
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """创建测试用户"""
        users_data = [
            {'username': 'cosplay_fan_1', 'email': 'fan1@example.com', 'first_name': '小明', 'last_name': '张', 'role': 'viewer'},
            {'username': 'cosplay_fan_2', 'email': 'fan2@example.com', 'first_name': '小红', 'last_name': '李', 'role': 'viewer'},
            {'username': 'cosplay_editor', 'email': 'editor@example.com', 'first_name': '编辑', 'last_name': '王', 'role': 'editor'},
            {'username': 'group_leader_1', 'email': 'leader1@example.com', 'first_name': '社长', 'last_name': '陈', 'role': 'editor'},
            {'username': 'group_leader_2', 'email': 'leader2@example.com', 'first_name': '团长', 'last_name': '刘', 'role': 'editor'},
        ]
        
        users = []
        for user_data in users_data:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='testpass123',
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role']
            )
            
            # 创建用户资料
            UserProfile.objects.create(
                user=user,
                gender=random.choice(['male', 'female']),
                cosplay_experience=random.randint(1, 10),
                interests='cosplay, 动漫, 游戏',
                favorite_games='原神, 崩坏3, 明日方舟',
                skills='服装制作, 化妆, 表演'
            )
            
            # 创建用户设置
            UserSetting.objects.create(user=user)
            
            users.append(user)
        
        return users

    def create_tags(self):
        """创建标签"""
        tags_data = [
            ('原神', '游戏IP'), ('崩坏3', '游戏IP'), ('明日方舟', '游戏IP'), 
            ('王者荣耀', '游戏IP'), ('英雄联盟', '游戏IP'),
            ('鬼灭之刃', '动漫IP'), ('进击的巨人', '动漫IP'), ('海贼王', '动漫IP'),
            ('2023年', '年份'), ('2024年', '年份'),
            ('舞台剧', '类型'), ('个人solo', '类型'), ('群体表演', '类型'),
            ('古风', '风格'), ('现代', '风格'), ('奇幻', '风格'), ('科幻', '风格'),
            ('北京', '地区'), ('上海', '地区'), ('广州', '地区'), ('深圳', '地区'),
        ]
        
        tags = []
        for name, category in tags_data:
            tag = Tag.objects.create(
                name=name,
                category=category,
                description=f'{name}相关的cosplay作品',
                color=f'#{random.randint(0, 0xFFFFFF):06x}'
            )
            tags.append(tag)
        
        return tags

    def create_groups(self, users):
        """创建社团"""
        groups_data = [
            {
                'name': '星河cosplay社',
                'description': '专注于高质量cosplay舞台剧制作的专业社团',
                'location': '北京',
                'founded_date': datetime(2020, 3, 15).date(),
                'website': 'http://xinghe-cosplay.com',
            },
            {
                'name': '次元工作室',
                'description': '上海知名cosplay制作团队，擅长服装道具制作',
                'location': '上海',
                'founded_date': datetime(2019, 7, 20).date(),
                'website': 'http://ciyuan-studio.com',
            },
            {
                'name': '梦境剧团',
                'description': '广州大学cosplay社团，青春活力的学生团体',
                'location': '广州',
                'founded_date': datetime(2021, 1, 10).date(),
            },
            {
                'name': '幻想空间',
                'description': '深圳新兴cosplay社团，专注于科幻题材',
                'location': '深圳',
                'founded_date': datetime(2022, 5, 1).date(),
            },
        ]
        
        groups = []
        for i, group_data in enumerate(groups_data):
            group = Group.objects.create(
                created_by=users[i % len(users)],
                is_verified=random.choice([True, False]),
                member_count=random.randint(5, 50),
                video_count=random.randint(1, 20),
                **group_data
            )
            groups.append(group)
        
        return groups

    def create_performances(self, groups):
        """创建演出"""
        performances_data = [
            {
                'title': '原神·璃月篇章',
                'description': '以原神璃月地区为背景的大型舞台剧',
                'type': 'stage_play',
                'original_work': '原神',
                'character_names': '钟离, 胡桃, 魈, 甘雨',
                'debut_date': datetime(2023, 6, 15).date(),
            },
            {
                'title': '崩坏3·律者觉醒',
                'description': '展现律者力量觉醒的震撼表演',
                'type': 'stage_play',
                'original_work': '崩坏3',
                'character_names': '琪亚娜, 雷电芽衣, 布洛妮娅',
                'debut_date': datetime(2023, 8, 20).date(),
            },
            {
                'title': '明日方舟·切尔诺伯格事件',
                'description': '重现游戏经典剧情的舞台表演',
                'type': 'stage_play',
                'original_work': '明日方舟',
                'character_names': '阿米娅, 博士, 凯尔希',
                'debut_date': datetime(2024, 1, 10).date(),
            },
            {
                'title': '鬼灭之刃·无限列车',
                'description': '炎柱煉獄杏寿郎的英勇事迹',
                'type': 'stage_play',
                'original_work': '鬼灭之刃',
                'character_names': '炭治郎, 煉獄杏寿郎, 伊之助',
                'debut_date': datetime(2023, 12, 5).date(),
            },
        ]
        
        performances = []
        for i, perf_data in enumerate(performances_data):
            performance = Performance.objects.create(
                group=groups[i % len(groups)],
                view_count=random.randint(1000, 100000),
                like_count=random.randint(50, 5000),
                **perf_data
            )
            performances.append(performance)
        
        return performances

    def create_competitions(self):
        """创建比赛"""
        competitions_data = [
            {
                'name': '2023全国cosplay大赛',
                'year': 2023,
                'location': '北京',
                'start_date': datetime(2023, 8, 15).date(),
                'end_date': datetime(2023, 8, 17).date(),
                'organizer': '中国动漫协会',
                'description': '全国最大规模的cosplay比赛',
            },
            {
                'name': '次元文化节cosplay大赛',
                'year': 2023,
                'location': '上海',
                'start_date': datetime(2023, 10, 1).date(),
                'end_date': datetime(2023, 10, 3).date(),
                'organizer': '次元文化传播有限公司',
                'description': '华东地区知名cosplay赛事',
            },
            {
                'name': '2024春季cosplay联赛',
                'year': 2024,
                'location': '广州',
                'start_date': datetime(2024, 3, 20).date(),
                'end_date': datetime(2024, 3, 22).date(),
                'organizer': '广州动漫展组委会',
                'description': '华南地区春季cosplay盛会',
            },
        ]
        
        competitions = []
        for comp_data in competitions_data:
            competition = Competition.objects.create(
                participant_count=random.randint(50, 500),
                award_count=random.randint(5, 20),
                **comp_data
            )
            competitions.append(competition)
        
        return competitions

    def create_awards(self, competitions):
        """创建奖项"""
        award_types = [
            ('最佳舞台剧表演奖', 1), ('最佳服装制作奖', 1), ('最佳化妆奖', 1),
            ('最佳道具制作奖', 2), ('最佳创意奖', 2), ('最佳人气奖', 2),
            ('优秀表演奖', 3), ('优秀团队奖', 3), ('最具潜力奖', 3),
        ]
        
        awards = []
        for competition in competitions:
            for award_name, rank in award_types[:random.randint(5, 8)]:
                award = Award.objects.create(
                    competition=competition,
                    name=award_name,
                    rank=rank,
                    description=f'{competition.name} {award_name}',
                    prize_money=random.choice([None, 1000, 3000, 5000, 10000]),
                    winner_count=random.randint(0, 3)
                )
                awards.append(award)
        
        return awards

    def create_videos(self, users, groups):
        """创建视频"""
        videos_data = [
            {
                'bv_number': 'BV1Uy3vzbEEo',
                'title': '【cosplay舞台剧】原神璃月篇完整版 - 星河cosplay社',
                'description': '历时3个月制作的原神璃月篇大型舞台剧，还原度极高的服装道具，精彩的剧情演绎',
                'url': 'https://www.bilibili.com/video/BV1Uy3vzbEEo/',
                'upload_date': timezone.now() - timedelta(days=30),
                'performance_date': datetime(2023, 6, 15).date(),
            },
            {
                'bv_number': 'BV2Xy4wzaFFp',
                'title': '【崩坏3】律者觉醒舞台剧精华版 - 次元工作室',
                'description': '次元工作室出品，特效制作精良，服装华丽，表演震撼',
                'url': 'https://www.bilibili.com/video/BV2Xy4wzaFFp/',
                'upload_date': timezone.now() - timedelta(days=25),
                'performance_date': datetime(2023, 8, 20).date(),
            },
            {
                'bv_number': 'BV3Zx5yaGGq',
                'title': '【明日方舟】切尔诺伯格事件舞台剧 - 梦境剧团',
                'description': '梦境剧团倾力打造，大学生cosplay社团的用心之作',
                'url': 'https://www.bilibili.com/video/BV3Zx5yaGGq/',
                'upload_date': timezone.now() - timedelta(days=20),
                'performance_date': datetime(2024, 1, 10).date(),
            },
            {
                'bv_number': 'BV4Ay6zaHHr',
                'title': '【鬼灭之刃】无限列车篇 煉獄杏寿郎solo - 个人作品',
                'description': '致敬炎柱煉獄杏寿郎的个人cosplay作品，燃烧的意志永不熄灭',
                'url': 'https://www.bilibili.com/video/BV4Ay6zaHHr/',
                'upload_date': timezone.now() - timedelta(days=15),
                'performance_date': datetime(2023, 12, 5).date(),
            },
            {
                'bv_number': 'BV5Bz7zaIIs',
                'title': '【王者荣耀】貂蝉·仲夏夜之梦 solo表演',
                'description': '唯美的貂蝉cosplay，梦幻的舞蹈表演',
                'url': 'https://www.bilibili.com/video/BV5Bz7zaIIs/',
                'upload_date': timezone.now() - timedelta(days=10),
                'performance_date': datetime(2024, 2, 14).date(),
            },
            {
                'bv_number': 'BV6Ca8zaJJt',
                'title': '【英雄联盟】阿狸·灵魂莲华 精美还原',
                'description': 'LOL阿狸皮肤cosplay，精美的服装制作和化妆技术',
                'url': 'https://www.bilibili.com/video/BV6Ca8zaJJt/',
                'upload_date': timezone.now() - timedelta(days=5),
                'performance_date': datetime(2024, 3, 1).date(),
            },
        ]
        
        videos = []
        for i, video_data in enumerate(videos_data):
            video = Video.objects.create(
                uploaded_by=users[i % len(users)],
                view_count=random.randint(10000, 500000),
                like_count=random.randint(500, 20000),
                comment_count=random.randint(50, 1000),
                favorite_count=random.randint(100, 5000),
                duration=timedelta(minutes=random.randint(3, 30)),
                resolution=random.choice(['720p', '1080p', '4K']),
                is_featured=random.choice([True, False]),
                **video_data
            )
            videos.append(video)
        
        return videos

    def create_relationships(self, videos, tags, performances, users, groups, awards):
        """创建各种关联关系"""
        # 视频标签关联
        for video in videos:
            selected_tags = random.sample(tags, random.randint(2, 5))
            for tag in selected_tags:
                VideoTag.objects.get_or_create(video=video, tag=tag)
                # 更新标签使用次数
                tag.usage_count += 1
                tag.save()
        
        # 演出视频关联
        for i, performance in enumerate(performances):
            if i < len(videos):
                PerformanceVideo.objects.get_or_create(
                    performance=performance, 
                    video=videos[i]
                )
        
        # 社团成员关联
        for group in groups:
            # 添加社团成员
            selected_users = random.sample(users, random.randint(2, 4))
            for j, user in enumerate(selected_users):
                role = 'leader' if j == 0 else random.choice(['member', 'manager'])
                GroupMember.objects.get_or_create(
                    group=group,
                    user=user,
                    defaults={
                        'role': role,
                        'status': 'active',
                        'nickname': f'{user.first_name}的cosplay'
                    }
                )
            
            # 添加关注者
            followers = random.sample(users, random.randint(1, 3))
            for user in followers:
                GroupFollower.objects.get_or_create(group=group, user=user)
        
        # 视频收藏和评分
        for video in videos:
            # 随机用户收藏
            for user in random.sample(users, random.randint(1, 3)):
                VideoFavorite.objects.get_or_create(user=user, video=video)
            
            # 随机用户评分
            for user in random.sample(users, random.randint(1, 4)):
                VideoRating.objects.get_or_create(
                    user=user,
                    video=video,
                    defaults={
                        'rating': random.randint(3, 5),
                        'comment': f'很棒的{video.title}作品！'
                    }
                )
        
        # 视频评论
        comment_templates = [
            '太棒了！还原度很高！',
            '服装制作得很精美',
            '表演很到位，很有感觉',
            '化妆技术真的很厉害',
            '期待更多作品',
            '这个角色很适合你',
            '道具制作得很用心',
            '舞台效果很不错',
            '团队合作很默契',
            '下次想看其他角色'
        ]
        
        for video in videos:
            for user in random.sample(users, random.randint(2, 5)):
                VideoComment.objects.create(
                    video=video,
                    user=user,
                    content=random.choice(comment_templates),
                    like_count=random.randint(0, 50)
                )
        
        # 获奖记录
        awarded_videos = random.sample(videos, min(3, len(videos)))
        selected_awards = random.sample(awards, min(3, len(awards)))
        
        for i, (video, award) in enumerate(zip(awarded_videos, selected_awards)):
            AwardRecord.objects.create(
                award=award,
                video=video,
                performance=performances[i % len(performances)] if performances else None,
                group=groups[i % len(groups)] if groups else None,
                year=award.competition.year,
                description=f'{video.title} 获得 {award.name}'
            ) 