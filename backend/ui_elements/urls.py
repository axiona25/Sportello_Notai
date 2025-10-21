"""
URL configuration for UI elements app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentTypeTemplateViewSet

router = DefaultRouter()
router.register(r'appointment-types', AppointmentTypeTemplateViewSet, basename='appointment-type')

urlpatterns = [
    path('', include(router.urls)),
]
