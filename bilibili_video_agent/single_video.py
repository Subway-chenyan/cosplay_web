#!/usr/bin/env python3
"""
处理单个Bilibili视频并写入数据库
"""
import os
import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from bilibili_video_agent.agent import build_graph
from bilibili_video_agent.bilibili_api import get_video_info

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("single_video")

# Load environment variables
ENV_PATH = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=str(ENV_PATH))


def process_single_video(bvid: str, competition: str = None, year: int = None):
    """
    处理单个视频并写入数据库

    Args:
        bvid: Bilibili视频BV号
        competition: 赛事名称（如 "chinajoy"）
        year: 年份（如 2026）
    """
    logger.info(f"开始处理视频: {bvid}")
    logger.info(f"赛事: {competition}, 年份: {year}")

    # 构建并执行工作流
    graph = build_graph()

    try:
        result = graph.invoke({
            "bvid": bvid,
            "keyword": f"{competition} {year}" if competition else None,
            "logs": [],
            "errors": [],
        })

        # 打印结果
        print("\n" + "=" * 80)
        print(f"视频处理完成: {bvid}")
        print("=" * 80)

        if result.get("record"):
            print("\n基本信息:")
            record = result["record"]
            print(f"  BV号: {record.get('bv_number')}")
            print(f"  标题: {record.get('title')}")
            print(f"  年份: {record.get('year')}")

            # 打印提取的元数据
            print(f"\nLLM提取的元数据:")
            print(f"  赛事: {record.get('competition')}")
            print(f"  社团: {record.get('group')}")
            print(f"  剧名: {record.get('drama_name')}")

        if result.get("foreign_keys"):
            print(f"\n外键解析:")
            fks = result["foreign_keys"]
            print(f"  competition_id: {fks.get('competition_id')}")
            print(f"  group_id: {fks.get('group_id')}")

        print(f"\n执行状态: {'成功' if result.get('executed') else '失败'}")
        if result.get("execution_output"):
            print(f"执行输出: {result['execution_output']}")

        if result.get("errors"):
            print(f"\n错误:")
            for error in result["errors"]:
                print(f"  - {error}")

        if result.get("logs"):
            print(f"\n日志:")
            for log in result["logs"]:
                print(f"  - {log}")

        return result

    except Exception as e:
        logger.exception(f"处理视频 {bvid} 时出错: {e}")
        print(f"\n错误: {e}")
        return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python single_video.py <BV号> [赛事] [年份]")
        print("示例: python single_video.py BV1MndGBXEGM chinajoy 2026")
        sys.exit(1)

    bvid = sys.argv[1]
    competition = sys.argv[2] if len(sys.argv) > 2 else None
    year = int(sys.argv[3]) if len(sys.argv) > 3 else None

    process_single_video(bvid, competition, year)
