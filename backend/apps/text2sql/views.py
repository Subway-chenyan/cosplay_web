import logging
import time

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle

from .serializers import Text2SQLQuerySerializer
from .agent import invoke_agent

try:
    from .hydration import build_data_array
except ImportError:
    build_data_array = None

logger = logging.getLogger(__name__)


class Text2SQLThrottle(UserRateThrottle):
    scope = 'text2sql'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([Text2SQLThrottle])
def query(request):
    """Text2SQL 查询端点 — 用自然语言查询 Cosplay 数据库。"""
    serializer = Text2SQLQuerySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    question = serializer.validated_data['question']
    include_sql = serializer.validated_data['include_sql']

    logger.info("text2sql query from user=%s len=%d q=%r",
                request.user.id, len(question), question[:200])

    try:
        t0 = time.time()
        agent_text, sql_result, llm_output = invoke_agent(question)
        elapsed = time.time() - t0
        logger.info("text2sql agent completed in %.1fs", elapsed)
    except Exception as e:
        logger.exception("text2sql agent invoke failed: %s", e)
        return Response(
            {'error': f'AI 查询服务暂不可用，请稍后重试: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if not agent_text:
        return Response({'error': 'AI 未返回有效回答'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    ui_type = llm_output.get('ui_type') or 'mixed_text'
    answer = llm_output.get('natural_language_overview') or agent_text.strip()
    title = llm_output.get('title') or answer[:50].replace('\n', ' ')
    summary = answer

    sql_rows = sql_result.rows
    generated_sql = sql_result.sql

    response_data = {
        'answer': answer,
        'query': question,
        'answer_type': 'text2sql',
        'ui_type': ui_type,
        'title': title,
        'summary': summary,
        'text': answer,
        'video_id_list': llm_output.get('video_id_list', []),
        'group_id_list': llm_output.get('group_id_list', []),
        'award_record_id_list': llm_output.get('award_record_id_list', []),
        'data': [],
        'sections': [],
        'llm_output': llm_output,
    }

    if sql_rows and build_data_array:
        hydrated = build_data_array(sql_rows, ui_type, answer, explicit_ids=llm_output)
        response_data['video_id_list'] = hydrated['video_id_list']
        response_data['group_id_list'] = hydrated['group_id_list']
        response_data['data'] = hydrated['data']
        response_data['llm_output'] = {
            **llm_output,
            'video_id_list': hydrated['video_id_list'],
            'group_id_list': hydrated['group_id_list'],
        }

    if include_sql and generated_sql:
        response_data['sql'] = generated_sql
        response_data['debug'] = {'generated_sql': generated_sql}

    return Response(response_data, status=status.HTTP_200_OK)
