from rest_framework.test import APITestCase

from apps.awards.models import Award, AwardRecord
from apps.competitions.models import Competition, CompetitionYear
from apps.groups.models import Group
from apps.videos.models import Video


class VideoServerFilteringTests(APITestCase):
    def test_ip_filter_combines_with_year_and_deduplicates(self):
        from apps.tags.models import Tag, VideoTag
        first = Tag.objects.create(name='火影忍者', category='IP')
        second = Tag.objects.create(name='死神', category='IP')
        for tag in (first, second):
            VideoTag.objects.create(video=self.target, tag=tag)
        response = self.client.get('/api/videos/', {'ipTags': f'{first.id},{second.id}', 'year': 2025})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(self.client.get('/api/videos/', {'ipTags': 'bad'}).status_code, 400)
        options = self.client.get('/api/videos/filter-options/').data['ips']
        self.assertEqual({item['name'] for item in options}, {'火影忍者', '死神'})
        self.assertTrue(all(item['count'] == 1 for item in options))

    def setUp(self):
        self.competition_a = Competition.objects.create(name='比赛 A')
        self.competition_b = Competition.objects.create(name='比赛 B')
        self.group_a = Group.objects.create(name='社团 A')
        self.group_b = Group.objects.create(name='社团 B')
        self.year_2025 = CompetitionYear.objects.create(
            competition=self.competition_a,
            year=2025,
        )
        self.target = self.create_video(
            'BV1TARGET',
            '目标视频',
            2025,
            self.competition_a,
            self.group_a,
        )
        self.create_video(
            'BV1OTHER1',
            '其他视频一',
            2025,
            self.competition_b,
            self.group_b,
        )
        self.create_video(
            'BV1OTHER2',
            '其他视频二',
            2024,
            self.competition_a,
            self.group_a,
        )
        first_award = Award.objects.create(
            competition=self.competition_a,
            name='一等奖',
        )
        second_award = Award.objects.create(
            competition=self.competition_a,
            name='最佳表演奖',
        )
        for award in (first_award, second_award):
            AwardRecord.objects.create(
                award=award,
                video=self.target,
                group=self.group_a,
                competition_year=self.year_2025,
                drama_name='目标剧目',
            )

    @staticmethod
    def create_video(bv_number, title, year, competition, group):
        return Video.objects.create(
            bv_number=bv_number,
            title=title,
            description='',
            url=f'https://www.bilibili.com/video/{bv_number}',
            year=year,
            competition=competition,
            group=group,
        )

    def test_combines_keyword_year_competitions_and_groups_without_duplicates(self):
        response = self.client.get(
            '/api/videos/',
            {
                'search': '目标剧目',
                'year': 2025,
                'competitions': f'{self.competition_a.id},{self.competition_b.id}',
                'groups': str(self.group_a.id),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.target.id))
        result_ids = [item['id'] for item in response.data['results']]
        self.assertEqual(len(result_ids), len(set(result_ids)))

    def test_rejects_invalid_group_uuid(self):
        response = self.client.get('/api/videos/', {'groups': 'not-a-uuid'})

        self.assertEqual(response.status_code, 400)
        self.assertIn('groups', response.data)

    def test_filter_options_returns_non_null_years_and_counts(self):
        response = self.client.get('/api/videos/filter-options/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                'ips': [],
                'years': [
                    {'value': 2025, 'count': 2},
                    {'value': 2024, 'count': 1},
                ]
            },
        )
