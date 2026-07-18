from django.db.models import F, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comment, ForumAttachment, ForumCategory, ForumReaction, ForumReport, ForumTag, ModerationLog, Post
from .permissions import ForumCommentPermission, ForumPostPermission, IsForumModerator, is_moderator
from .serializers import (
    CommentSerializer,
    ForumAttachmentSerializer,
    ForumCategorySerializer,
    ForumReactionSerializer,
    ForumReportSerializer,
    ForumTagSerializer,
    ModerationActionSerializer,
    ModerationLogSerializer,
    PostDetailSerializer,
    PostListSerializer,
)


def recount_post(post):
    post.reply_count = post.comments.filter(is_active=True, status=Comment.STATUS_PUBLISHED).count()
    post.like_count = post.reactions.filter(reaction='like').count()
    post.report_count = post.reports.filter(status=ForumReport.STATUS_PENDING).count()
    post.save(update_fields=['reply_count', 'like_count', 'report_count'])


def recount_category(category_id):
    category = ForumCategory.objects.get(id=category_id)
    category.post_count = category.posts.filter(is_active=True, status=Post.STATUS_PUBLISHED).count()
    category.comment_count = Comment.objects.filter(
        post__category_id=category_id,
        is_active=True,
        status=Comment.STATUS_PUBLISHED,
    ).count()
    category.save(update_fields=['post_count', 'comment_count'])


def log_moderation(actor, action, *, post=None, comment=None, reason=''):
    ModerationLog.objects.create(actor=actor, action=action, post=post, comment=comment, reason=reason)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ForumCategorySerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsForumModerator()]

    def get_queryset(self):
        if is_moderator(self.request.user):
            return ForumCategory.objects.all()
        return ForumCategory.objects.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ForumTag.objects.all()
    serializer_class = ForumTagSerializer
    pagination_class = None
    # 只读视图集，匿名用户也可读取
    permission_classes = [permissions.AllowAny]


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ForumPostPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'author', 'status', 'is_pinned', 'is_featured', 'is_locked']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'updated_at', 'last_commented_at', 'view_count', 'reply_count', 'like_count']

    def get_queryset(self):
        qs = (
            Post.objects
            .select_related('author', 'category', 'last_commented_by')
            .prefetch_related('tags')
        )
        user = self.request.user
        if is_moderator(user):
            return qs.filter(is_active=True)
        if user.is_authenticated:
            return qs.filter(
                Q(is_active=True, status=Post.STATUS_PUBLISHED) |
                Q(is_active=True, author=user, status__in=[Post.STATUS_DRAFT, Post.STATUS_PENDING])
            )
        return qs.filter(is_active=True, status=Post.STATUS_PUBLISHED)

    def get_serializer_class(self):
        if self.action in ['list']:
            return PostListSerializer
        return PostDetailSerializer

    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user, published_at=timezone.now())
        recount_category(post.category_id)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.status = Post.STATUS_DELETED
        instance.is_active = False
        instance.deleted_at = timezone.now()
        instance.deleted_by = self.request.user
        instance.save(update_fields=['status', 'is_active', 'deleted_at', 'deleted_by'])
        recount_category(instance.category_id)
        log_moderation(self.request.user, ModerationLog.ACTION_DELETE, post=instance)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Post.objects.filter(id=instance.id).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsForumModerator])
    def moderate(self, request, pk=None):
        post = self.get_object()
        serializer = ModerationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reason = data.get('reason', '')
        log_fields = []

        if 'is_pinned' in data and post.is_pinned != data['is_pinned']:
            post.is_pinned = data['is_pinned']
            log_fields.append(ModerationLog.ACTION_PIN if post.is_pinned else ModerationLog.ACTION_UNPIN)
        if 'is_featured' in data and post.is_featured != data['is_featured']:
            post.is_featured = data['is_featured']
            log_fields.append(ModerationLog.ACTION_FEATURE if post.is_featured else ModerationLog.ACTION_UNFEATURE)
        if 'is_locked' in data and post.is_locked != data['is_locked']:
            post.is_locked = data['is_locked']
            log_fields.append(ModerationLog.ACTION_LOCK if post.is_locked else ModerationLog.ACTION_UNLOCK)
        if 'status' in data and post.status != data['status']:
            post.status = data['status']
            if post.status == Post.STATUS_HIDDEN:
                post.hidden_at = timezone.now()
                post.hidden_by = request.user
                log_fields.append(ModerationLog.ACTION_HIDE)
            elif post.status == Post.STATUS_PUBLISHED:
                log_fields.append(ModerationLog.ACTION_RESTORE)

        post.save()
        for action_name in log_fields:
            log_moderation(request.user, action_name, post=post, reason=reason)
        return Response(PostDetailSerializer(post, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction, created = ForumReaction.objects.get_or_create(
            user=request.user,
            target_type=ForumReaction.TARGET_POST,
            post=post,
            reaction=request.data.get('reaction', 'like'),
        )
        if not created:
            reaction.delete()
            active = False
        else:
            active = True
        recount_post(post)
        post.refresh_from_db()
        return Response({'active': active, 'like_count': post.like_count})


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ForumCommentPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['post', 'author', 'parent', 'status']
    ordering_fields = ['created_at', 'like_count']

    def get_queryset(self):
        qs = Comment.objects.select_related('author', 'post').prefetch_related('replies__author')
        if is_moderator(self.request.user):
            return qs.filter(is_active=True)
        return qs.filter(is_active=True, status=Comment.STATUS_PUBLISHED, post__status=Post.STATUS_PUBLISHED)

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        Post.objects.filter(id=comment.post_id).update(
            last_commented_at=comment.created_at,
            last_commented_by_id=comment.author_id,
        )
        recount_post(comment.post)
        recount_category(comment.post.category_id)

    def perform_destroy(self, instance):
        instance.status = Comment.STATUS_DELETED
        instance.is_active = False
        instance.deleted_at = timezone.now()
        instance.deleted_by = self.request.user
        instance.save(update_fields=['status', 'is_active', 'deleted_at', 'deleted_by'])
        recount_post(instance.post)
        recount_category(instance.post.category_id)
        log_moderation(self.request.user, ModerationLog.ACTION_DELETE, comment=instance)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, pk=None):
        comment = self.get_object()
        reaction, created = ForumReaction.objects.get_or_create(
            user=request.user,
            target_type=ForumReaction.TARGET_COMMENT,
            comment=comment,
            reaction=request.data.get('reaction', 'like'),
        )
        if not created:
            reaction.delete()
            active = False
        else:
            active = True
        comment.like_count = comment.reactions.filter(reaction='like').count()
        comment.save(update_fields=['like_count'])
        return Response({'active': active, 'like_count': comment.like_count})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsForumModerator])
    def hide(self, request, pk=None):
        comment = self.get_object()
        comment.status = Comment.STATUS_HIDDEN
        comment.hidden_at = timezone.now()
        comment.hidden_by = request.user
        comment.save(update_fields=['status', 'hidden_at', 'hidden_by'])
        recount_post(comment.post)
        recount_category(comment.post.category_id)
        log_moderation(request.user, ModerationLog.ACTION_HIDE, comment=comment, reason=request.data.get('reason', ''))
        return Response(CommentSerializer(comment, context={'request': request}).data)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = ForumAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ForumAttachment.objects.select_related('author', 'post', 'comment')
        if is_moderator(self.request.user):
            return qs
        return qs.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ForumReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'reason', 'post', 'comment']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = ForumReport.objects.select_related('reporter', 'post', 'comment', 'handled_by')
        if is_moderator(self.request.user):
            return qs
        return qs.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        report = serializer.save(reporter=self.request.user)
        if report.post:
            recount_post(report.post)
        if report.comment:
            report.comment.report_count = report.comment.reports.filter(status=ForumReport.STATUS_PENDING).count()
            report.comment.save(update_fields=['report_count'])

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsForumModerator])
    def resolve(self, request, pk=None):
        report = self.get_object()
        report.status = request.data.get('status', ForumReport.STATUS_RESOLVED)
        report.handled_by = request.user
        report.handled_at = timezone.now()
        report.save(update_fields=['status', 'handled_by', 'handled_at'])
        if report.post:
            recount_post(report.post)
        if report.comment:
            report.comment.report_count = report.comment.reports.filter(status=ForumReport.STATUS_PENDING).count()
            report.comment.save(update_fields=['report_count'])
        return Response(ForumReportSerializer(report, context={'request': request}).data)


class ModerationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModerationLog.objects.select_related('actor', 'post', 'comment')
    serializer_class = ModerationLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsForumModerator]
