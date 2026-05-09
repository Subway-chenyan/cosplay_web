import re

# 读取原始文件
with open('apps/authentication/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找并替换有问题的代码段
old_pattern = r'        state = _build_qq_state\(redirect_target\)\n\n        authorize_url = f\'\{QQ_AUTHORIZE_URL\}\?\{urlencode\(\{\n            "response_type": "code",\n            "client_id": settings\.QQ_CONNECT_APP_ID,\n            "redirect_uri": _get_qq_callback_url\(request\),\n            "state": state,\n            "scope": settings\.QQ_CONNECT_SCOPE,\n        \}\)\}\''

new_code = '''        state = _build_qq_state(redirect_target)

        authorize_url = f'{QQ_AUTHORIZE_URL}?{urlencode({
            "response_type": "code",
            "client_id": settings.QQ_CONNECT_APP_ID,
            "redirect_uri": _get_qq_callback_url(request),
            "state": state,
            "scope": settings.QQ_CONNECT_SCOPE,
        })}' '''

# 执行替换
new_content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE)

# 写回文件
with open('apps/authentication/views.py', 'w', encoding='utf-8') as f:
    f.write(new_content)