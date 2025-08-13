from django.urls import path
from . import views

app_name = 'map'

urlpatterns = [
    path('china-geojson/', views.china_geojson, name='china_geojson'),
]