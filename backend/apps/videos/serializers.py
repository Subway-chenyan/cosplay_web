from rest_framework import serializers
from .models import Video
from apps.tags.models import Tag


class TagSerializer(serializers.ModelSerializer):
    """
    标签序列化器（用于嵌套显示）
    """
    class Meta:
        model = Tag
        fields = ['id', 'name', 'category', 'color']


class VideoSerializer(serializers.ModelSerializer):
    """
    视频序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Tag.objects.filter(is_active=True),
        source='tags',
        required=False,
        write_only=True,
        help_text="标签ID列表"
    )
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'description', 'url', 'thumbnail',
            'uploaded_by', 'uploaded_by_username', 'group', 'group_name', 
            'competition', 'competition_name', 'year',
            'tags', 'tag_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']


class VideoListSerializer(serializers.ModelSerializer):
    """
    视频列表序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'thumbnail', 'uploaded_by_username', 'group', 'group_name', 
            'competition', 'competition_name', 'year', 'tags', 'created_at'
        ]


class BulkImportSerializer(serializers.Serializer):
    """
    批量导入序列化器
    """
    file = serializers.FileField(
        help_text="支持CSV、Excel格式文件 (最大50MB)"
    )
    import_type = serializers.ChoiceField(
        choices=[
            ('video', '视频数据'),
            ('group', '社团数据'),
            ('tag', '标签数据'),
            ('competition', '比赛数据'),
        ],
        help_text="导入数据类型"
    )
    validate_only = serializers.BooleanField(
        default=False,
        help_text="仅验证数据，不实际导入"
    )
    
    def validate_file(self, value):
        # 文件大小验证 (50MB)
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("文件大小不能超过50MB")
        
        # 文件格式验证
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                f"不支持的文件格式。支持的格式：{', '.join(allowed_extensions)}"
            )
        
        return value


class ImportResultSerializer(serializers.Serializer):
    """
    导入结果序列化器
    """
    task_id = serializers.CharField()
    status = serializers.ChoiceField(
        choices=[
            ('pending', '等待处理'),
            ('processing', '处理中'),
            ('success', '成功'),
            ('failed', '失败'),
        ]
    )
    total_records = serializers.IntegerField()
    success_count = serializers.IntegerField()
    error_count = serializers.IntegerField()
    errors = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    warnings = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    created_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(required=False)