import json
import os
import time
from pathlib import Path

import requests
from django.core.management.base import BaseCommand, CommandError

from apps.tags.models import Tag


CATEGORIES = {'国漫', '日漫', '游戏', '影视', '其他'}
SYSTEM = '''你负责给作品 IP 做粗分类。只能使用以下分类：国漫、日漫、游戏、影视、其他。
国漫包含中国大陆、港澳台的动画和漫画；日漫包含日本动画和漫画；游戏包含以游戏为主要来源的 IP；影视包含真人电影、电视剧和特摄；小说、音乐企划、舞台原创或无法确认的放入其他。
每个输入名称必须返回且只能返回一个分类。仅返回 JSON：{"items":[{"name":"原神","category":"游戏"}]}。'''


class Command(BaseCommand):
    help = '通过 LLM 为 IP 标签生成粗分类；默认预览，--apply 写入数据库'

    def add_arguments(self, parser):
        parser.add_argument('--endpoint', default='http://127.0.0.1:15721/v1/messages')
        parser.add_argument('--model', default='glm-5.3-flash')
        parser.add_argument('--report', required=True)
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--batch-size', type=int, default=30)

    def handle(self, *args, **options):
        if not 1 <= options['batch_size'] <= 100:
            raise CommandError('--batch-size must be between 1 and 100')
        path = Path(options['report'])
        path.parent.mkdir(parents=True, exist_ok=True)
        cached = {}
        if path.exists():
            for line in path.read_text(encoding='utf-8').splitlines():
                try:
                    row = json.loads(line)
                    if row.get('category') in CATEGORIES:
                        cached[row['name']] = row['category']
                except (ValueError, KeyError):
                    continue
        tags = list(Tag.objects.filter(category='IP', is_active=True).order_by('name'))
        missing = [tag.name for tag in tags if tag.name not in cached]
        headers = {'anthropic-version': '2023-06-01', 'Content-Type': 'application/json'}
        if os.environ.get('IP_LLM_API_KEY'):
            headers['x-api-key'] = os.environ['IP_LLM_API_KEY']
        with path.open('a', encoding='utf-8') as report:
            for start in range(0, len(missing), options['batch_size']):
                names = missing[start:start + options['batch_size']]
                for attempt in range(3):
                    try:
                        response = requests.post(options['endpoint'], headers=headers, json={
                            'model': options['model'], 'max_tokens': 4096, 'system': SYSTEM,
                            'messages': [{'role': 'user', 'content': json.dumps({'names': names}, ensure_ascii=False)}],
                        }, timeout=90)
                        response.raise_for_status()
                        body = response.json()
                        raw = ''.join(block.get('text', '') for block in body.get('content', []) if block.get('type') == 'text').strip()
                        if raw.startswith('```'):
                            raw = raw.split('\n', 1)[1].rsplit('```', 1)[0].strip()
                        items = json.loads(raw)['items']
                        result = {item['name']: item['category'] for item in items}
                        if set(result) != set(names) or any(value not in CATEGORIES for value in result.values()):
                            raise ValueError('LLM must return every exact name with an allowed category')
                        break
                    except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
                        if attempt == 2:
                            raise CommandError(f'分类批次失败：{names[0]}… ({type(exc).__name__})') from exc
                        time.sleep(2 ** attempt)
                for name in names:
                    cached[name] = result[name]
                    report.write(json.dumps({'name': name, 'category': result[name]}, ensure_ascii=False) + '\n')
                report.flush()
        if options['apply']:
            for tag in tags:
                tag.ip_category = cached.get(tag.name, '其他')
            Tag.objects.bulk_update(tags, ['ip_category'], batch_size=200)
        counts = {category: sum(value == category for value in cached.values()) for category in sorted(CATEGORIES)}
        self.stdout.write(json.dumps({'mode': 'apply' if options['apply'] else 'preview', 'total': len(tags), 'counts': counts}, ensure_ascii=False))
