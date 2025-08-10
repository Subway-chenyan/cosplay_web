from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.GroupViewSet, basename='group')

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:group_id>/videos/', views.GroupVideosView.as_view(), name='group-videos'),
]