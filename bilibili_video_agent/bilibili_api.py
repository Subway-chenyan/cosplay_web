import os
import time
import urllib.parse
from functools import reduce
from hashlib import md5
from http.cookies import SimpleCookie
from typing import Dict, List, Tuple

import httpx

import datetime
from zoneinfo import ZoneInfo

# 基于 Dify 插件工具的实现逻辑，复用 WBI 签名与请求头
HEADERS = {
    "authority": "api.bilibili.com",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "dnt": "1",
    "pragma": "no-cache",
    "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Referer": "https://www.bilibili.com/",
}

mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
    26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
    20, 34, 44, 52,
]


def _get_mixin_key(orig: str) -> str:
    return reduce(lambda s, i: s + orig[i], mixinKeyEncTab, "")[:32]


def _enc_wbi(params: dict, img_key: str, sub_key: str) -> dict:
    mixin_key = _get_mixin_key(img_key + sub_key)
    curr_time = round(time.time())
    params["wts"] = curr_time
    params = dict(sorted(params.items()))
    params = {k: "".join(filter(lambda chr: chr not in "!'()*", str(v))) for k, v in params.items()}
    query = urllib.parse.urlencode(params)
    wbi_sign = md5((query + mixin_key).encode()).hexdigest()
    params["w_rid"] = wbi_sign
    return params


def _get_wbi_keys() -> Tuple[str, str]:
    resp = httpx.get("https://api.bilibili.com/x/web-interface/nav", headers=HEADERS)
    resp.raise_for_status()
    json_content = resp.json()
    img_url: str = json_content["data"]["wbi_img"]["img_url"]
    sub_url: str = json_content["data"]["wbi_img"]["sub_url"]
    img_key = img_url.rsplit("/", 1)[1].split(".")[0]
    sub_key = sub_url.rsplit("/", 1)[1].split(".")[0]
    return img_key, sub_key


def _get_signed_params(params: dict) -> dict:
    img_key, sub_key = _get_wbi_keys()
    return _enc_wbi(params, img_key, sub_key)


def parse_cookies(cookie_str: str) -> Dict[str, str]:
    """解析 cookie 字符串为字典"""
    cookie = SimpleCookie()
    cookie.load(cookie_str)
    return {key: morsel.value for key, morsel in cookie.items()}


def get_env_cookies() -> Dict[str, str]:
    """从环境变量 Bilibili_Cookies 读取并解析 cookies；未设置则返回空字典"""
    cookie_str = os.getenv("Bilibili_Cookies", "")
    if not cookie_str:
        return {}
    return parse_cookies(cookie_str)


def search_videos(keyword: str, page: int = 1, duration: int | List[int] | Tuple[int, ...] | None = None, order: str = "pubdate", pubtime_begin_s: int | None = None, pubtime_end_s: int | None = None, cookies: Dict[str, str] | None = None) -> List[dict]:
    """调用 Bilibili 搜索接口，返回视频结果列表（字段包含 bvid、title、description、pubdate 等）
    参数：
    - duration：视频时长筛选，仅用于视频搜索。取值含义：
      0=全部，1=10分钟以下，2=10-30分钟，3=30-60分钟，4=60分钟以上。
      可传单个值或列表/元组；未传时默认使用 [2, 3]。
    - order：结果排序方式（totalrank/click/pubdate/dm/stow/scores/attention），默认使用 'pubdate'。
    - pubtime_begin_s / pubtime_end_s：上传时间区间（Unix 秒），用于筛选发布时间在区间内的视频；可只传起始或结束。
    """
    url = "https://api.bilibili.com/x/web-interface/wbi/search/type"
    base_params = {"keyword": keyword, "page": page, "search_type": "video", "order": order}
    if pubtime_begin_s is not None:
        base_params["pubtime_begin_s"] = int(pubtime_begin_s)
    if pubtime_end_s is not None:
        base_params["pubtime_end_s"] = int(pubtime_end_s)

    cookies = cookies if cookies is not None else get_env_cookies()

    if duration is None:
        durations = [2, 3]
    elif isinstance(duration, int):
        durations = [duration]
    else:
        durations = list(duration)

    valid_durations = {0, 1, 2, 3, 4}
    durations = [d for d in durations if d in valid_durations] or [0]

    all_results: List[dict] = []
    seen_bvid: set[str] = set()

    with httpx.Client() as client:
        for d in durations:
            params = dict(base_params)
            params["duration"] = d
            response = client.get(headers=HEADERS, url=url, params=_get_signed_params(params), cookies=cookies)
            response.raise_for_status()
            data = response.json()
            try:
                results = data["data"]["result"]
            except Exception:
                results = []
            for r in results:
                bvid = r.get("bvid")
                if bvid and bvid not in seen_bvid:
                    all_results.append(r)
                    seen_bvid.add(bvid)

    # 本地按上传时间区间过滤，保证兼容性
    if pubtime_begin_s is not None or pubtime_end_s is not None:
        begin = pubtime_begin_s if pubtime_begin_s is not None else float("-inf")
        end = pubtime_end_s if pubtime_end_s is not None else float("inf")
        try:
            all_results = [r for r in all_results if begin <= int(r.get("pubdate", 0)) <= end]
        except Exception:
            pass

    if order == "pubdate":
        try:
            all_results = sorted(all_results, key=lambda r: r.get("pubdate", 0), reverse=True)
        except Exception:
            pass

    return all_results


def get_video_info(bvid: str, cookies: Dict[str, str] | None = None) -> dict:
    """根据 bvid 获取视频详情"""
    url = "https://api.bilibili.com/x/web-interface/view"
    params = {"bvid": bvid}

    cookies = cookies if cookies is not None else get_env_cookies()

    with httpx.Client() as client:
        response = client.get(headers=HEADERS, url=url, params=_get_signed_params(params), cookies=cookies)
        response.raise_for_status()
    return response.json()


def get_last_week_range_shanghai() -> tuple[int, int]:
    """返回北京时间最近一周的起止 Unix 秒区间。
    逻辑：以今天为基准，起始为今天零点往前推 6 天，结束为今天 23:59:59。
    """
    tz = ZoneInfo("Asia/Shanghai")
    now = datetime.datetime.now(tz)
    start_day = (now.replace(hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(days=6))
    end_day = now.replace(hour=23, minute=59, second=59, microsecond=0)
    return int(start_day.timestamp()), int(end_day.timestamp())


def _to_shanghai_epoch(date_str: str | None) -> int | None:
    """将 'YYYY-MM-DD' 转换为北京时间当日 00:00:00 的 Unix 秒。若为 None 返回 None。"""
    if not date_str:
        return None
    tz = ZoneInfo("Asia/Shanghai")
    dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=tz)
    dt = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return int(dt.timestamp())


def _end_of_day_shanghai(date_str: str | None) -> int | None:
    """将 'YYYY-MM-DD' 转换为北京时间当日 23:59:59 的 Unix 秒。若为 None 返回 None。"""
    if not date_str:
        return None
    tz = ZoneInfo("Asia/Shanghai")
    dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=tz)
    dt = dt.replace(hour=23, minute=59, second=59, microsecond=0)
    return int(dt.timestamp())


def search_videos_by_date(keyword: str, page: int = 1, duration: int | List[int] | Tuple[int, ...] | None = None, order: str = "pubdate", begin_date: str | None = None, end_date: str | None = None, cookies: Dict[str, str] | None = None) -> List[dict]:
    """按北京时间的自定义日期区间（YYYY-MM-DD）检索视频。
    - begin_date：'YYYY-MM-DD'，将被转换为当天 00:00:00（Asia/Shanghai）的秒；
    - end_date：'YYYY-MM-DD'，将被转换为当天 23:59:59（Asia/Shanghai）的秒；
    如果两者都为空，则使用最近一周区间。
    其余参数同 search_videos。
    """
    if begin_date is None and end_date is None:
        begin_s, end_s = get_last_week_range_shanghai()
    else:
        begin_s = _to_shanghai_epoch(begin_date)
        end_s = _end_of_day_shanghai(end_date)
    return search_videos(keyword=keyword, page=page, duration=duration, order=order, pubtime_begin_s=begin_s, pubtime_end_s=end_s, cookies=cookies)