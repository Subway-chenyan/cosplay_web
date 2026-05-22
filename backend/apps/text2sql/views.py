import re
import logging
import time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import Text2SQLQuerySerializer
from .agent import create_agent, get_last_sql_result, get_last_sql_query

try:
    from .hydration import build_data_array
except ImportError:
    build_data_array = None

logger = logging.getLogger(__name__)

UI_TYPE_RE = re.compile(r'【ui_type】\s*:\s*(\w+)', re.IGNORECASE)
ANSWER_RE = re.compile(r'【answer】\s*:\s*(.+?)(?=【|$)', re.IGNORECASE | re.DOTALL)


def _parse_agent_response(text):
    """Extract ui_type and answer from the agent's structured output."""
    ui_match = UI_TYPE_RE.search(text)
    answer_match = ANSWER_RE.search(text)
    return {
        'ui_type': ui_match.group(1).strip().lower() if ui_match else 'mixed_text',
        'answer': answer_match.group(1).strip() if answer_match else text.strip(),
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query(request):
    """Text2SQL 查询端点 — 用自然语言查询 Cosplay 数据库。"""
    serializer = Text2SQLQuerySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    question = serializer.validated_data['question']
    include_sql = serializer.validated_data['include_sql']

    logger.info("text2sql query from user=%s len=%d q=%r",
                request.user.id, len(question), question[:200])

    try:
        agent = create_agent()
        t0 = time.time()
        result = agent.invoke({"messages": [{"role": "user", "content": question}]})
        elapsed = time.time() - t0
        logger.info("text2sql agent completed in %.1fs", elapsed)
    except Exception as e:
        logger.exception("text2sql agent invoke failed: %s", e)
        return Response(
            {'error': f'AI 查询服务暂不可用，请稍后重试: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Extract the agent's final text response
    if hasattr(result, 'messages'):
        last_msg = result.messages[-1] if result.messages else {}
        agent_text = last_msg.get('content', '') if isinstance(last_msg, dict) else str(last_msg)
    elif isinstance(result, dict):
        agent_text = result.get('content', result.get('text', str(result)))
    else:
        agent_text = str(result)

    if not agent_text:
        return Response({'error': 'AI 未返回有效回答'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    parsed = _parse_agent_response(agent_text)
    ui_type = parsed['ui_type']
    answer = parsed['answer']
    title = answer[:50].replace('\n', ' ')
    summary = answer

    # Hydrate SQL results into ORM objects for frontend cards
    sql_rows = get_last_sql_result()
    generated_sql = get_last_sql_query()

    response_data = {
        'answer': answer,
        'query': question,
        'answer_type': 'text2sql',
        'ui_type': ui_type,
        'title': title,
        'summary': summary,
        'text': answer,
        'video_id_list': [],
        'group_id_list': [],
        'data': [],
        'sections': [],
    }

    if sql_rows and build_data_array:
        hydrated = build_data_array(sql_rows, ui_type, answer)
        response_data['video_id_list'] = hydrated['video_id_list']
        response_data['group_id_list'] = hydrated['group_id_list']
        response_data['data'] = hydrated['data']

    if include_sql and generated_sql:
        response_data['sql'] = generated_sql
        response_data['debug'] = {'generated_sql': generated_sql}

    return Response(response_data, status=status.HTTP_200_OK)
