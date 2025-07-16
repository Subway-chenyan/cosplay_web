from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# 为了避免路由冲突，我们使用明确的路径
urlpatterns = [
    path('', views.AwardViewSet.as_view({'get': 'list', 'post': 'create'}), name='award-list'),
    path('<uuid:pk>/', views.AwardViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='award-detail'),
    path('records/', views.AwardRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='awardrecord-list'),
    path('records/<uuid:pk>/', views.AwardRecordViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='awardrecord-detail'),
] 