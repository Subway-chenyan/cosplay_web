# B站用户视频爬虫

根据B站API获取指定用户的所有投稿视频信息，包括视频链接、标题、封面等。

## 功能特性

- ✅ 获取用户所有投稿视频
- ✅ 提取视频标题、描述、封面URL
- ✅ 生成完整的视频播放链接
- ✅ 支持CSV和JSON格式输出
- ✅ 自动分页获取所有视频
- ✅ 防反爬机制（延迟请求）
- ✅ 支持B站APP API签名机制，提高API调用稳定性

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 基本使用

运行爬虫程序：
```bash
python bilibili_video_crawler.py
```

按提示输入要爬取的用户mid（数字），程序将自动获取该用户的所有投稿视频。

### 2. 编程使用

```python
from bilibili_video_crawler import BilibiliVideoCrawler

crawler = BilibiliVideoCrawler()

# 爬取指定用户视频
mid = 23215368  # 替换为目标用户mid
crawler.crawl_user_videos(mid)
```

### 3. 自定义输出

```python
# 仅输出CSV格式
crawler.crawl_user_videos(mid, output_format="csv")

# 仅输出JSON格式
crawler.crawl_user_videos(mid, output_format="json")
```

## 输出文件

程序会在当前目录下创建以用户mid命名的文件夹，包含：

- `user_{mid}_videos.csv` - CSV格式的视频信息
- `user_{mid}_videos.json` - JSON格式的视频信息

## 数据字段说明

| 字段名 | 说明 |
|--------|------|
| aid | 视频AV号 |
| bvid | 视频BV号 |
| title | 视频标题 |
| description | 视频描述 |
| pic | 封面图片URL |
| author | UP主昵称 |
| mid | UP主mid |
| created | 发布时间 |
| length | 视频时长（秒） |
| play | 播放数 |
| comment | 评论数 |
| video_review | 弹幕数 |
| favorites | 收藏数 |
| coin | 投币数 |
| share | 分享数 |
| like | 点赞数 |
| dislike | 点踩数 |
| video_url | 完整视频链接 |
| cover_url | 完整封面链接 |

## 获取用户mid方法

1. 访问用户主页，如：https://space.bilibili.com/23215368
2. URL中的数字就是用户mid

## API接口

本爬虫使用以下B站官方API：
- 获取用户投稿视频：`https://api.bilibili.com/x/space/arc/search`
- 获取视频详情：`https://api.bilibili.com/x/web-interface/view`

### APP API签名机制

为了提高API调用的稳定性和成功率，本项目实现了B站APP API签名机制：

- **AppKey**: `1d8b6e7d45233436` (Android粉版)
- **AppSec**: `560c52ccd288fed045859ed18bffd973`
- **签名算法**: MD5哈希，按照key排序参数后拼接AppSec进行计算

#### 支持的APPKEY配置

| AppKey | 客户端类型 | AppSec |
|--------|------------|--------|
| 1d8b6e7d45233436 | 安卓客户端 | 560c52ccd288fed045859ed18bffd973 |
| 07da50c9a9bf8f80 | iOS客户端 | 25bdede4e1581d9ce9f5d1b4a0b4b9d8 |
| 4409e2ce8ffd12b8 | TV端 | 59b43e04ad6965f34319062b478f83dd |
| 57263273bc6b67f6 | 概念版 | a0488e488474068d |

#### 自定义APPKEY使用示例

```python
from bilibili_video_crawler import BilibiliVideoCrawler

# 使用特定客户端的appkey
crawler = BilibiliVideoCrawler(
    appkey="07da50c9a9bf8f80",
    appsec="25bdede4e1581d9ce9f5d1b4a0b4b9d8"
)

# 或者使用内置支持的appkey
videos = crawler.get_user_videos(mid, use_app_sign=True)
```

#### APP签名调试模式

```python
# 开启签名调试模式
params = {'mid': 123456, 'ps': 30}
signed_params = crawler._generate_app_sign(params, debug=True)
```

当API返回错误码-352（请求过于频繁）时，系统会自动尝试不使用APP签名作为备选方案。

## 注意事项

- 请合理使用，避免对B站服务器造成过大压力
- 建议每次爬取间隔适当时间
- 仅用于学习和研究目的
- 尊重UP主版权，勿用于商业用途

## 错误处理

- 网络连接失败会自动重试
- API限制导致的错误会显示具体信息
- 无效的用户mid会提示重新输入