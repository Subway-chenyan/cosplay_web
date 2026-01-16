from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='forum-category')
router.register(r'posts', PostViewSet, basename='forum-post')
router.register(r'comments', CommentViewSet, basename='forum-comment')

urlpatterns = [
    path('', include(router.urls)),
]
