from rest_framework import serializers
from .models import ForumCategory, Post, Comment
from apps.users.serializers import UserSerializer

class ForumCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumCategory
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username') # Or nickname
    author_avatar = serializers.ReadOnlyField(source='author.avatar.url', allow_null=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'author_avatar', 'content', 'parent', 'created_at', 'replies']
        read_only_fields = ['author']

    def get_replies(self, obj):
        if obj.replies.exists():
             return CommentSerializer(obj.replies.all(), many=True).data
        return []

class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    category_name = serializers.ReadOnlyField(source='category.name')
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'author', 'author_name', 'category', 'category_name', 'view_count', 'comment_count', 'created_at']
        read_only_fields = ['author', 'view_count']

class PostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_avatar = serializers.ReadOnlyField(source='author.avatar.url', allow_null=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_name', 'author_avatar', 'category', 'category_name', 'view_count', 'created_at', 'updated_at', 'comments']
        read_only_fields = ['author', 'view_count']

    def get_comments(self, obj):
        # Only fetch top-level comments
        qs = obj.comments.filter(parent__isnull=True)
        return CommentSerializer(qs, many=True).data

class ForumAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumAttachment
        fields = ['id', 'file', 'created_at']
        read_only_fields = ['author']
