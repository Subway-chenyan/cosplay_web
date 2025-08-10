from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# 为了避免路由冲突，我们使用明确的路径
urlpatterns = [
    path('', views.AwardViewSet.as_view({'get': 'list', 'post': 'create'}), name='award-list'),
    path('<uuid:pk>/', views.AwardViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='award-detail'),
    path('by_competition/', views.AwardViewSet.as_view({'get': 'by_competition'}), name='award-by-competition'),
    path('records/', views.AwardRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='awardrecord-list'),
    path('records/<uuid:pk>/', views.AwardRecordViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='awardrecord-detail'),
    path('records/by_competition/', views.AwardRecordViewSet.as_view({'get': 'by_competition'}), name='awardrecord-by-competition'),
    path('<uuid:award_id>/videos/', views.AwardVideosView.as_view(), name='award-videos'),
    path('<uuid:award_id>/years/<int:competition_year_id>/videos/', views.AwardVideosView.as_view(), name='award-year-videos'),
]