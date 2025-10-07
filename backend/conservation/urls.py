from django.urls import path
from .views import ConservationPackageListCreateView

urlpatterns = [
    path('packages/', ConservationPackageListCreateView.as_view(), name='conservation-package-list'),
]

