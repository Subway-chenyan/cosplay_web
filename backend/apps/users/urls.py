from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='user')

feedback_router = DefaultRouter()
feedback_router.register(r'', views.FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('feedback/', include(feedback_router.urls)),
    path('', include(router.urls)),
]