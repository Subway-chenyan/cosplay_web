from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'competitions', views.CompetitionViewSet, basename='competition')
router.register(r'events', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('competitions/<uuid:competition_id>/years/<int:year>/videos/', views.CompetitionYearVideosView.as_view(), name='competition-year-videos'),
]