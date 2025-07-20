from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.VideoViewSet, basename='video')


urlpatterns = [
    path('', include(router.urls)),
    # 数据导入API
    path('import/verify-key/', views.verify_upload_key_api, name='verify-upload-key'),
    path('import/template/', views.download_template, name='download-template'),
    path('import/start/', views.start_import, name='start-import'),
    path('import/status/<str:task_id>/', views.get_import_status, name='import-status'),
] 