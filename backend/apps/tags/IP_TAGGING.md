# 自动识别视频 IP

在 backend 目录运行，使用 Django 的 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD 配置。默认只预览，不修改数据库。

```bash
python manage.py tag_video_ips --report /path/to/ip-labels.jsonl --limit 20
python manage.py tag_video_ips --report /path/to/ip-labels.jsonl --apply
```

默认接口为 `http://127.0.0.1:15721/v1/messages`，模型为 `glm-5.3-flash`。可用 `--endpoint`、`--model` 覆盖，鉴权密钥通过 `IP_LLM_API_KEY` 环境变量传递。`--workers` 控制并发（默认 4，最多 16），`--bv BVxxxx` 可重复指定视频。

若 LLM 代理运行在个人电脑上，脚本也应在该电脑运行，通过 `ssh -N -L 15433:127.0.0.1:5433 tengxun` 连接服务器数据库，再设置 `DB_HOST=127.0.0.1`、`DB_PORT=15433`。服务器上的 `127.0.0.1` 不会指向个人电脑。请求模型名由代理解释，实际映射请以代理配置为准。

脚本仅处理没有任何 IP 标签的视频。根据标题和最多 12000 字的简介判断，校验返回 JSON 和原文证据；不确定则跳过，异常重试三次并记入报告。不会替换已有标签或启用已停用标签。写入采用逐视频事务，重新检查标题、简介和既有标签，维护标签关联计数。

每个环境使用独立 JSONL 报告。重复使用同一报告可复用相同视频 ID 和内容指纹的成功判断（包括空结果），错误会重新调用；因此预览后加 `--apply` 不需要重复调用模型。若需要重新识别已跳过视频，换用新的报告文件。记录包含证据和本次新增关联 ID，便于审计；如需撤销，可核实后仅删除对应 `VideoTag` 关联并重新统计计数。不要删除标签或视频本身。

首次运行建议先备份 tags_tag 和 tags_videotag。报告包含视频标题，应保存在部署目录之外，不提交到 Git。LLM 仍可能误判，应用前应抽查预览。

本地隔离测试：

```bash
python manage.py test apps.tags apps.videos.tests --settings=cosplay_api.test_settings
```

主页的 IP 选项来自 `/api/videos/filter-options/` 的 `ips` 字段，只包含启用且有关联视频的 IP，按实际视频数排序。`/api/videos/?ipTags=UUID,UUID` 使用任一匹配，与年份、比赛、社团、关键词同时满足；主页地址使用 `ips` 保存选择。
