from django.utils import timezone
from django.utils.html import strip_tags
from rest_framework import serializers

from .models import (
    Comment,
    ForumAttachment,
    ForumCategory,
    ForumReaction,
    ForumReport,
    ForumTag,
    ModerationLog,
    Post,
    PostRevision,
)
from .permissions import can_contribute, is_moderator


MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}


def author_name(user):
    return getattr(user, 'nickname', '') or user.username


def avatar_url(user):
    try:
        return user.avatar.url if user.avatar else None
    except ValueError:
        return None


def make_excerpt(content):
    text = ' '.join(strip_tags(content or '').split())
    return text[:300]


class ForumTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumTag
        fields = ['id', 'name', 'slug', 'color']


class ForumCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'order',
            'is_active', 'post_count', 'comment_count', 'allowed_roles'
        ]


class ForumAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ForumAttachment
        fields = [
            'id', 'file', 'file_url', 'post', 'comment', 'original_name',
            'content_type', 'size', 'width', 'height', 'status',
            'created_at', 'attached_at'
        ]
        read_only_fields = [
            'author', 'original_name', 'content_type', 'size', 'width',
            'height', 'status', 'created_at', 'attached_at'
        ]

    def get_file_url(self, obj):
        try:
            return obj.file.url if obj.file else None
        except ValueError:
            return None

    def validate_file(self, file):
        if file.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('图片不能超过 5MB')
        content_type = getattr(file, 'content_type', '')
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError('仅支持 JPG、PNG、WEBP、GIF 图片')
        return file

    def create(self, validated_data):
        file = validated_data.get('file')
        validated_data.update({
            'original_name': getattr(file, 'name', '')[:255],
            'content_type': getattr(file, 'content_type', ''),
            'size': getattr(file, 'size', 0),
        })
        attachment = super().create(validated_data)
        if attachment.file and hasattr(attachment.file, 'width'):
            attachment.width = attachment.file.width
            attachment.height = attachment.file.height
            attachment.save(update_fields=['width', 'height'])
        return attachment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_name', 'author_avatar',
            'content', 'parent', 'status', 'like_count', 'report_count',
            'created_at', 'updated_at', 'edited_at', 'replies',
            'can_edit', 'can_moderate'
        ]
        read_only_fields = [
            'author', 'status', 'like_count', 'report_count', 'created_at',
            'updated_at', 'edited_at'
        ]

    def get_author_name(self, obj):
        return author_name(obj.author)

    def get_author_avatar(self, obj):
        return avatar_url(obj.author)

    def get_can_edit(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and (is_moderator(user) or obj.author_id == user.id))

    def get_can_moderate(self, obj):
        request = self.context.get('request')
        return is_moderator(getattr(request, 'user', None))

    def get_replies(self, obj):
        replies = getattr(obj, 'prefetched_replies', None)
        if replies is None:
            replies = obj.replies.filter(is_active=True, status=Comment.STATUS_PUBLISHED).select_related('author')
        return CommentSerializer(replies, many=True, context=self.context).data

    def validate(self, attrs):
        post = attrs.get('post') or getattr(self.instance, 'post', None)
        parent = attrs.get('parent')
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if post and post.is_locked and not is_moderator(user):
            raise serializers.ValidationError('该帖子已锁定，无法继续评论')
        if post and not post.is_visible and not is_moderator(user):
            raise serializers.ValidationError('该帖子当前不可评论')
        if parent:
            if parent.post_id != post.id:
                raise serializers.ValidationError('回复目标不属于当前帖子')
            if parent.parent_id:
                raise serializers.ValidationError('当前仅支持两级评论')
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'content' in validated_data and validated_data['content'] != instance.content:
            instance.edited_at = timezone.now()
            instance.edited_by = self.context['request'].user
        return super().update(instance, validated_data)


class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    tags = ForumTagSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'excerpt', 'author', 'author_name', 'author_avatar',
            'category', 'category_name', 'tags', 'status', 'view_count',
            'reply_count', 'like_count', 'report_count', 'is_pinned',
            'is_featured', 'is_locked', 'created_at', 'updated_at',
            'last_commented_at', 'can_edit', 'can_moderate'
        ]
        read_only_fields = ['author', 'view_count', 'reply_count', 'like_count', 'report_count']

    def get_author_name(self, obj):
        return author_name(obj.author)

    def get_author_avatar(self, obj):
        return avatar_url(obj.author)

    def get_can_edit(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and (is_moderator(user) or obj.author_id == user.id))

    def get_can_moderate(self, obj):
        request = self.context.get('request')
        return is_moderator(getattr(request, 'user', None))


class PostDetailSerializer(PostListSerializer):
    comments = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        source='tags', queryset=ForumTag.objects.all(), many=True, required=False, write_only=True
    )

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            'content', 'content_json', 'published_at', 'edited_at',
            'comments', 'tag_ids'
        ]
        read_only_fields = PostListSerializer.Meta.read_only_fields + ['status', 'published_at', 'edited_at']

    def get_comments(self, obj):
        qs = (
            obj.comments
            .filter(parent__isnull=True, is_active=True, status=Comment.STATUS_PUBLISHED)
            .select_related('author')
            .prefetch_related('replies__author')
        )
        return CommentSerializer(qs, many=True, context=self.context).data

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        category = attrs.get('category') or getattr(self.instance, 'category', None)
        allowed_roles = getattr(category, 'allowed_roles', []) or []
        if allowed_roles and getattr(user, 'role', None) not in allowed_roles and not is_moderator(user):
            raise serializers.ValidationError('当前角色不能在该分区发帖')
        if user and user.is_authenticated and not can_contribute(user):
            raise serializers.ValidationError('当前账号还没有发帖权限')
        return attrs

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        validated_data['excerpt'] = make_excerpt(validated_data.get('content', ''))
        post = super().create(validated_data)
        post.tags.set(tags)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        request = self.context.get('request')
        if 'content' in validated_data or 'title' in validated_data:
            PostRevision.objects.create(
                post=instance,
                editor=getattr(request, 'user', None),
                title=instance.title,
                content=instance.content,
                content_json=instance.content_json,
            )
            validated_data['edited_at'] = timezone.now()
            validated_data['edited_by'] = getattr(request, 'user', None)
        if 'content' in validated_data:
            validated_data['excerpt'] = make_excerpt(validated_data['content'])
        post = super().update(instance, validated_data)
        if tags is not None:
            post.tags.set(tags)
        return post


class ModerationActionSerializer(serializers.Serializer):
    is_pinned = serializers.BooleanField(required=False)
    is_featured = serializers.BooleanField(required=False)
    is_locked = serializers.BooleanField(required=False)
    status = serializers.ChoiceField(choices=Post.STATUS_CHOICES, required=False)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=200)


class ForumReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()

    class Meta:
        model = ForumReport
        fields = [
            'id', 'reporter', 'reporter_name', 'post', 'comment', 'reason',
            'description', 'status', 'handled_by', 'handled_at', 'created_at'
        ]
        read_only_fields = ['reporter', 'status', 'handled_by', 'handled_at', 'created_at']

    def get_reporter_name(self, obj):
        return author_name(obj.reporter)

    def validate(self, attrs):
        if not attrs.get('post') and not attrs.get('comment'):
            raise serializers.ValidationError('必须举报帖子或评论之一')
        if attrs.get('post') and attrs.get('comment'):
            raise serializers.ValidationError('一次只能举报一个对象')
        return attrs


class ForumReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumReaction
        fields = ['id', 'target_type', 'post', 'comment', 'reaction', 'created_at']
        read_only_fields = ['created_at']


class ModerationLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = ModerationLog
        fields = ['id', 'actor', 'actor_name', 'action', 'post', 'comment', 'reason', 'created_at']

    def get_actor_name(self, obj):
        return author_name(obj.actor) if obj.actor else ''
