from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.VideoViewSet, basename='video')
router.register(r'favorites', views.VideoFavoriteViewSet, basename='video-favorite')
router.register(r'comments', views.VideoCommentViewSet, basename='video-comment')

urlpatterns = [
    path('', include(router.urls)),
] 