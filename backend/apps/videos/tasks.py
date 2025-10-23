import os
import subprocess
import logging
from datetime import datetime
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def crawl_bilibili_videos_weekly(self):
    """
    每周定时爬取B站cos舞台剧视频的任务
    """
    try:
        # 设置工作目录为项目根目录（包含 bilibili_video_agent 包）
        agent_dir = settings.BASE_DIR.parent
        
        cmd = [
            'python3', '-m', 'bilibili_video_agent.cli',
            'cos舞台剧',
            '--last-week',
            '--page', '1',
            '--limit', '999',
            # '--begin-date', '2025-09-01'
        ]
        
        logger.info(f"开始执行B站视频爬取任务，工作目录: {agent_dir}")
        logger.info(f"执行命令: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=agent_dir,
            capture_output=True,
            text=True,
            timeout=3600
        )
        
        if result.returncode == 0:
            logger.info("B站视频爬取任务执行成功")
            logger.info(f"输出: {result.stdout}")
            return {
                'status': 'success',
                'message': 'B站视频爬取任务执行成功',
                'output': result.stdout,
                'timestamp': datetime.now().isoformat()
            }
        else:
            logger.error(f"B站视频爬取任务执行失败，返回码: {result.returncode}")
            logger.error(f"错误输出: {result.stderr}")
            return {
                'status': 'error',
                'message': f'任务执行失败，返回码: {result.returncode}',
                'error': result.stderr,
                'timestamp': datetime.now().isoformat()
            }
            
    except subprocess.TimeoutExpired:
        logger.error("B站视频爬取任务执行超时")
        return {
            'status': 'timeout',
            'message': '任务执行超时（1小时）',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"B站视频爬取任务执行异常: {str(e)}")
        return {
            'status': 'exception',
            'message': f'任务执行异常: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }


@shared_task
def test_bilibili_crawl():
    """
    测试任务，用于验证B站爬虫是否正常工作
    """
    try:
        # 设置工作目录为项目根目录（包含 bilibili_video_agent 包）
        agent_dir = settings.BASE_DIR.parent
        
        cmd = [
            'python3', '-m', 'bilibili_video_agent.cli',
            'cos舞台剧',
            '--last-week',
            '--page', '1',
            '--limit', '2'
        ]
        
        logger.info(f"开始执行B站视频爬取测试任务，工作目录: {agent_dir}")
        
        result = subprocess.run(
            cmd,
            cwd=agent_dir,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info("B站视频爬取测试任务执行成功")
            return {
                'status': 'success',
                'message': 'B站视频爬取测试成功',
                'output': result.stdout[:500],
                'timestamp': datetime.now().isoformat()
            }
        else:
            logger.error(f"B站视频爬取测试任务失败: {result.stderr}")
            return {
                'status': 'error',
                'message': '测试任务失败',
                'error': result.stderr,
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"B站视频爬取测试任务异常: {str(e)}")
        return {
            'status': 'exception',
            'message': f'测试任务异常: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }