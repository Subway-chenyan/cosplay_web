import json
from io import StringIO
from tempfile import TemporaryDirectory
from unittest.mock import patch, Mock
from django.test import TestCase, SimpleTestCase
from django.core.management import call_command
from apps.tags.ip_classifier import classify, normalize_ips
from apps.tags.models import Tag, VideoTag
from apps.videos.models import Video


class ClassifierTests(SimpleTestCase):
    @patch('apps.tags.ip_classifier.requests.post')
    def test_imported_highlight_markup_is_cleaned(self, post):
        response = Mock()
        response.json.return_value = {'content': [{'type': 'text', 'text': json.dumps({'ips': [
            {'name': '宝莲灯', 'evidence': '《宝莲灯》'},
        ]})}]}
        post.return_value = response
        self.assertEqual(classify('《<em class="keyword">宝莲灯</em>》', '', [], 'http://localhost', 'test')[0]['name'], '宝莲灯')

    @patch('apps.tags.ip_classifier.requests.post')
    def test_shared_compilation_description_is_skipped(self, post):
        response = Mock()
        response.json.return_value = {'content': [{'type': 'text', 'text': json.dumps({'ips': [
            {'name': '火影忍者', 'evidence': '火影忍者'},
            {'name': '死神', 'evidence': '死神'},
        ]})}]}
        post.return_value = response
        self.assertEqual(classify('比赛总决赛', '火影忍者、死神', [], 'http://localhost', 'test'), [])

    def test_aliases_merge_without_duplicate_links(self):
        ips = normalize_ips([{'name': '中华一番', 'evidence': '中华一番'}, {'name': '中华小当家', 'evidence': '中华小当家'}])
        self.assertEqual(len(ips), 1)
        self.assertEqual(ips[0]['name'], '中华小当家')

    @patch('apps.tags.ip_classifier.time.sleep')
    @patch('apps.tags.ip_classifier.requests.post')
    def test_rejects_invented_evidence(self, post, sleep):
        response = Mock()
        response.json.return_value = {'content': [{'type': 'text', 'text': json.dumps({'ips': [{'name': '火影忍者', 'evidence': '鸣人'}]})}]}
        post.return_value = response
        with self.assertRaises(ValueError):
            classify('原创舞台剧', '', [], 'http://localhost', 'test')


class TagCommandTests(TestCase):
    @patch('apps.tags.management.commands.tag_video_ips.classify')
    def test_preview_apply_resume_and_preserve_manual_tags(self, classify_mock):
        video = Video.objects.create(bv_number='BVtest', title='火影忍者', url='https://example.com')
        classify_mock.return_value = [{'name': '火影忍者', 'evidence': '火影忍者'}]
        with TemporaryDirectory() as directory:
            report = directory + '/report.jsonl'
            call_command('tag_video_ips', report=report, stdout=StringIO())
            self.assertEqual(VideoTag.objects.count(), 0)
            call_command('tag_video_ips', report=report, apply=True, stdout=StringIO())
            call_command('tag_video_ips', report=report, apply=True, stdout=StringIO())
            self.assertEqual(classify_mock.call_count, 1)
            self.assertEqual(video.tags.get().name, '火影忍者')
            self.assertEqual(Tag.objects.get().usage_count, 1)
            self.assertEqual(VideoTag.objects.count(), 1)

    @patch('apps.tags.management.commands.tag_video_ips.classify', return_value=[])
    def test_unknown_video_skipped(self, classify_mock):
        Video.objects.create(bv_number='BVunknown', title='舞台剧', url='https://example.com')
        with TemporaryDirectory() as directory:
            call_command('tag_video_ips', report=directory + '/report.jsonl', apply=True, stdout=StringIO())
        self.assertEqual(VideoTag.objects.count(), 0)
