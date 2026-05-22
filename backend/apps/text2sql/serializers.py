from rest_framework import serializers


class Text2SQLQuerySerializer(serializers.Serializer):
    question = serializers.CharField(min_length=1, max_length=500, help_text="自然语言查询问题")
    include_sql = serializers.BooleanField(default=False, help_text="是否在响应中返回生成的SQL")
