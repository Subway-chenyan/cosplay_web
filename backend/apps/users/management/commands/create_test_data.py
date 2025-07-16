import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.videos.models import Video
from apps.groups.models import Group
from apps.tags.models import Tag
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
        videos = self.create_videos(users, groups)
        self.stdout.write(f'创建了 {len(videos)} 个视频')

        # 创建关联关系
        self.create_relationships(videos, tags, users, groups, awards)
        self.stdout.write('创建了关联关系')

        self.stdout.write(
            self.style.SUCCESS('测试数据创建完成！')
        )

    def clear_data(self):
        """清除现有数据"""
        AwardRecord.objects.all().delete()
        Award.objects.all().delete()
        Competition.objects.all().delete()
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
            {'name': '原神', 'category': '游戏IP'},
            {'name': '崩坏3', 'category': '游戏IP'},
            {'name': '明日方舟', 'category': '游戏IP'},
            {'name': '王者荣耀', 'category': '游戏IP'},
            {'name': '英雄联盟', 'category': '游戏IP'},
            {'name': '鬼灭之刃', 'category': '动漫IP'},
            {'name': '火影忍者', 'category': '动漫IP'},
            {'name': '海贼王', 'category': '动漫IP'},
            {'name': '进击的巨人', 'category': '动漫IP'},
            {'name': '刀剑神域', 'category': '动漫IP'},
            
            # 年份
            {'name': '2023年', 'category': '年份'},
            {'name': '2024年', 'category': '年份'},
            {'name': '2022年', 'category': '年份'},
            
            # 类型
            {'name': '舞台剧', 'category': '类型'},
            {'name': '个人solo', 'category': '类型'},
            {'name': '群体表演', 'category': '类型'},
            {'name': '舞蹈', 'category': '类型'},
            {'name': '剧情', 'category': '类型'},
            
            # 风格
            {'name': '古风', 'category': '风格'},
            {'name': '现代', 'category': '风格'},
            {'name': '奇幻', 'category': '风格'},
            {'name': '科幻', 'category': '风格'},
            {'name': '可爱', 'category': '风格'},
            {'name': '帅气', 'category': '风格'},
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
                'description': '北京知名cosplay社团，专注于舞台剧表演，成立于2018年',
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
                'is_verified': True,
                'is_featured': True,
            },
            {
                'name': '梦境工作室',
                'description': '上海专业cosplay制作团队，擅长特效和服装制作',
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
                'is_verified': False,
                'is_featured': False,
            },
            {
                'name': '次元空间',
                'description': '广州大学cosplay社团，大学生为主，创意丰富',
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
                'is_verified': True,
                'is_featured': False,
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
                'name': '全国cosplay大赛',
                'description': '全国性的cosplay比赛，汇聚各地优秀社团',
                'website': 'https://cosplay-competition.com',
            },
            {
                'name': '次元文化节',
                'description': '以二次元文化为主题的大型文化活动',
                'website': 'https://acg-festival.com',
            },
            {
                'name': '漫展cosplay比赛',
                'description': '漫展期间举办的cosplay竞赛活动',
                'website': 'https://comic-con-cosplay.com',
            },
        ]

        competitions = []
        for comp_data in competitions_data:
            competition = Competition.objects.create(**comp_data)
            competitions.append(competition)

        return competitions

    def create_awards(self, competitions):
        """创建奖项"""
        award_types = [
            ('最佳舞台剧表演奖', '金奖'),
            ('最佳服装制作奖', '金奖'),
            ('最佳化妆奖', '银奖'),
            ('最佳道具制作奖', '银奖'),
            ('最佳创意奖', '铜奖'),
            ('最佳人气奖', '特别奖'),
            ('优秀表演奖', '优秀奖'),
            ('优秀团队奖', '优秀奖'),
            ('最具潜力奖', '潜力奖'),
        ]

        awards = []
        for competition in competitions:
            for award_name, level in award_types[:random.randint(5, 8)]:
                award = Award.objects.create(
                    competition=competition,
                    name=award_name,
                    level=level,
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
                group=groups[i % len(groups)],  # 为视频分配社团
                view_count=random.randint(10000, 500000),
                like_count=random.randint(500, 20000),
                share_count=random.randint(100, 5000),
                duration=timedelta(minutes=random.randint(3, 30)),
                resolution=random.choice(['720p', '1080p', '4K']),
                is_featured=random.choice([True, False]),
                **video_data
            )
            videos.append(video)

        return videos

    def create_relationships(self, videos, tags, users, groups, awards):
        """创建各种关联关系"""
        from apps.tags.models import VideoTag

        # 视频标签关联
        for video in videos:
            selected_tags = random.sample(tags, random.randint(2, 5))
            for tag in selected_tags:
                VideoTag.objects.get_or_create(video=video, tag=tag)
                # 更新标签使用次数
                tag.usage_count += 1
                tag.save()

        # 获奖记录
        awarded_videos = random.sample(videos, min(3, len(videos)))
        selected_awards = random.sample(awards, min(3, len(awards)))

        for i, (video, award) in enumerate(zip(awarded_videos, selected_awards)):
            AwardRecord.objects.create(
                award=award,
                video=video,
                group=groups[i % len(groups)] if groups else None,
                year=2023,  # 使用固定年份
                description=f'{video.title} 获得 {award.name}'
            ) 