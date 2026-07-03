from urllib.parse import urlsplit

from rest_framework.test import APITestCase

from apps.awards.models import Award, AwardRecord
from apps.competitions.models import Competition, CompetitionYear
from apps.groups.models import Group
from apps.videos.models import Video


class CompetitionEntriesTests(APITestCase):
    def setUp(self):
        self.competition = Competition.objects.create(name='主比赛')
        self.other_competition = Competition.objects.create(name='其他比赛')
        self.year = CompetitionYear.objects.create(
            competition=self.competition,
            year=2025,
        )
        self.other_year = CompetitionYear.objects.create(
            competition=self.other_competition,
            year=2025,
        )
        self.group = Group.objects.create(name='测试社团')
        self.award_a = Award.objects.create(
            competition=self.competition,
            name='最佳表演奖',
        )
        self.award_b = Award.objects.create(
            competition=self.competition,
            name='一等奖',
        )
        self.outside_award = Award.objects.create(
            competition=self.other_competition,
            name='外部奖项',
        )

        self.awarded_video = self.create_video('BV1AWARDED', '获奖视频')
        self.unawarded_video = self.create_video('BV1UNAWARDED', '参与视频')
        self.awarded_record = AwardRecord.objects.create(
            award=self.award_a,
            video=self.awarded_video,
            group=self.group,
            competition_year=self.year,
            drama_name='获奖剧目',
        )
        self.no_video_record = AwardRecord.objects.create(
            award=self.award_b,
            group=self.group,
            competition_year=self.year,
            drama_name='待补视频剧目',
        )

        other_video = Video.objects.create(
            bv_number='BV1OUTSIDE',
            title='其他比赛视频',
            url='https://www.bilibili.com/video/BV1OUTSIDE',
            year=2025,
            competition=self.other_competition,
            group=self.group,
        )
        AwardRecord.objects.create(
            award=self.outside_award,
            video=other_video,
            group=self.group,
            competition_year=self.other_year,
        )

    def create_video(self, bv_number, title):
        return Video.objects.create(
            bv_number=bv_number,
            title=title,
            url=f'https://www.bilibili.com/video/{bv_number}',
            year=2025,
            competition=self.competition,
            group=self.group,
        )

    @property
    def entries_url(self):
        return f'/api/competitions/competitions/{self.competition.id}/entries/'

    def test_paginates_all_three_entry_kinds_without_duplicates(self):
        response = self.client.get(self.entries_url, {'year': 2025, 'page_size': 2})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 2)
        self.assertIsNotNone(response.data['next'])

        all_results = list(response.data['results'])
        next_path = urlsplit(response.data['next']).path + '?' + urlsplit(response.data['next']).query
        next_response = self.client.get(next_path)
        self.assertEqual(next_response.status_code, 200)
        all_results.extend(next_response.data['results'])

        self.assertEqual(
            {item['kind'] for item in all_results},
            {'awarded_video', 'award_without_video', 'unawarded_video'},
        )
        entry_ids = [item['entry_id'] for item in all_results]
        self.assertEqual(len(entry_ids), len(set(entry_ids)))

    def test_combines_year_and_award_filters(self):
        response = self.client.get(
            self.entries_url,
            {'year': 2025, 'award': str(self.award_a.id)},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        entry = response.data['results'][0]
        self.assertEqual(entry['kind'], 'awarded_video')
        self.assertEqual(entry['award']['id'], str(self.award_a.id))
        self.assertEqual(entry['video']['id'], str(self.awarded_video.id))

    def test_rejects_award_from_another_competition(self):
        response = self.client.get(
            self.entries_url,
            {'award': str(self.outside_award.id)},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('award', response.data)

    def test_filter_options_are_complete_and_count_normalized_entries(self):
        response = self.client.get(
            f'/api/competitions/competitions/{self.competition.id}/filter-options/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_count'], 3)
        self.assertEqual(response.data['years'], [{'value': 2025, 'count': 3}])
        awards = {item['id']: item for item in response.data['awards']}
        self.assertEqual(awards[str(self.award_a.id)]['count'], 1)
        self.assertEqual(awards[str(self.award_b.id)]['count'], 1)
