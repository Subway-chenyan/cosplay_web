from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器（简化版，用于 me 接口）
    """
    groups = serializers.SerializerMethodField()
    performed_videos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'nickname', 'bio', 'avatar',
            'role', 'groups', 'performed_videos',
            'role_application_pending', 'role_application_reason',
            'role_application_date', 'is_active', 'date_joined',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']

    def get_groups(self, obj):
        """获取用户所属社团"""
        groups = obj.groups.all()
        return [{'id': str(g.id), 'name': g.name, 'description': g.description} for g in groups]

    def get_performed_videos(self, obj):
        """获取用户参演视频"""
        videos = obj.performed_videos.all()
        return [{'id': str(v.id), 'title': v.title, 'bv_number': v.bv_number} for v in videos]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    用户注册序列化器
    """
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'nickname']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "密码不一致"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # 设置默认角色为 viewer
        validated_data['role'] = 'viewer'
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    修改密码序列化器
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "新密码不一致"})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("原密码错误")
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    用户资料更新序列化器
    """
    group_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True
    )
    performed_video_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = User
        fields = ['nickname', 'bio', 'avatar', 'group_ids', 'performed_video_ids']
        extra_kwargs = {
            'nickname': {'required': False, 'allow_blank': True},
            'bio': {'required': False, 'allow_blank': True},
            'avatar': {'required': False, 'allow_null': True},
        }

    def validate_group_ids(self, value):
        """验证社团 ID 是否存在"""
        if not value:
            return value

        from apps.groups.models import Group
        existing_ids = set(Group.objects.filter(id__in=value).values_list('id', flat=True))
        missing_ids = set(value) - existing_ids

        if missing_ids:
            raise serializers.ValidationError(
                f"以下社团不存在: {', '.join(str(id) for id in missing_ids)}"
            )

        return value

    def validate_performed_video_ids(self, value):
        """验证视频 ID 是否存在"""
        if not value:
            return value

        from apps.videos.models import Video
        existing_ids = set(Video.objects.filter(id__in=value).values_list('id', flat=True))
        missing_ids = set(value) - existing_ids

        if missing_ids:
            raise serializers.ValidationError(
                f"以下视频不存在: {', '.join(str(id) for id in missing_ids)}"
            )

        return value

    def update(self, instance, validated_data):
        """更新用户资料"""
        group_ids = validated_data.pop('group_ids', None)
        performed_video_ids = validated_data.pop('performed_video_ids', None)

        # 更新基本字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # 更新社团关联
        if group_ids is not None:
            from apps.groups.models import Group
            groups = Group.objects.filter(id__in=group_ids)
            instance.groups.set(groups)

        # 更新参演视频关联
        if performed_video_ids is not None:
            from apps.videos.models import Video
            videos = Video.objects.filter(id__in=performed_video_ids)
            instance.performed_videos.set(videos)

        return instance


class RoleApplicationSerializer(serializers.Serializer):
    """
    权限申请序列化器
    """
    reason = serializers.CharField(required=True, min_length=10, max_length=500,
                                   help_text="申请理由，至少10个字")

    def validate(self, attrs):
        user = self.context['request'].user
        if user.role_application_pending:
            raise serializers.ValidationError("您已有待审核的申请，请勿重复提交")
        if user.role in ['admin', 'editor', 'contributor']:
            raise serializers.ValidationError("您已经是贡献者或更高权限，无需申请")
        return attrs 