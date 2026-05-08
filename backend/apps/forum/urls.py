from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttachmentViewSet,
    CategoryViewSet,
    CommentViewSet,
    ModerationLogViewSet,
    PostViewSet,
    ReportViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='forum-category')
router.register(r'tags', TagViewSet, basename='forum-tag')
router.register(r'posts', PostViewSet, basename='forum-post')
router.register(r'comments', CommentViewSet, basename='forum-comment')
router.register(r'attachments', AttachmentViewSet, basename='forum-attachment')
router.register(r'reports', ReportViewSet, basename='forum-report')
router.register(r'moderation-logs', ModerationLogViewSet, basename='forum-moderation-log')

urlpatterns = [
    path('', include(router.urls)),
]
