import argparse
import logging
import os

from dotenv import load_dotenv

from .agent import run_workflow_for_keywords

# 加载当前包目录下的 .env 文件
from pathlib import Path
ENV_PATH = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=str(ENV_PATH))

logger = logging.getLogger("bilibili-video-agent.cli")
if not logger.handlers:
    handler = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


def main():
    parser = argparse.ArgumentParser(description="Bilibili 舞台剧视频检索与入库 Agent")
    parser.add_argument("keyword", type=str, help="检索关键词，建议与舞台剧相关")
    parser.add_argument("--page", type=int, default=1, help="检索页码")
    parser.add_argument("--limit", type=int, default=5, help="处理视频数量上限")
    parser.add_argument("--duration", type=int, nargs=2, default=None, help="视频时长范围，传入两个值表示区间，例如 2 3；不传时默认使用 [2,3]")
    parser.add_argument("--order", type=str, default="pubdate", help="排序方式，默认按发布时间")
    parser.add_argument("--begin-date", dest="begin_date", type=str, default=None, help="开始日期（YYYY-MM-DD），默认不指定（若未指定且 --last-week 为真，则使用最近一周）")
    parser.add_argument("--end-date", dest="end_date", type=str, default=None, help="结束日期（YYYY-MM-DD），默认不指定（若未指定且 --last-week 为真，则使用最近一周）")
    parser.add_argument("--last-week", action="store_true", help="使用北京时间最近一周的日期区间（忽略 --begin-date/--end-date）")

    args = parser.parse_args()

    # 默认聚焦舞台剧，可自动加前缀
    keyword = args.keyword
    if "舞台剧" not in keyword:
        keyword = f"{keyword} 舞台剧"

    results = run_workflow_for_keywords(
        keyword=keyword,
        page=args.page,
        limit=args.limit,
        duration=args.duration,
        order=args.order,
        begin_date=args.begin_date,
        end_date=args.end_date,
        last_week=args.last_week,
    )

    for r in results:
        print("-" * 80)
        print(f"BV: {r['bvid']} Title: {r['title']}")
        print("SQL:")
        print(r.get("sql") or "<no-sql>")
        print(f"Executed: {r.get('executed')} Output: {r.get('execution_output')}")
        if r.get("record"):
            print("Record:")
            for k, v in r["record"].items():
                print(f"  {k}: {v}")
        if r.get("errors"):
            print("Errors:")
            for e in r["errors"]:
                print(f"  - {e}")
        if r.get("logs"):
            print("Logs:")
            for l in r["logs"]:
                print(f"  - {l}")


if __name__ == "__main__":
    main()