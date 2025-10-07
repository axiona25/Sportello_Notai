"""
URLs for acts endpoints.
"""
from django.urls import path
from .views import ActListCreateView, ActDetailView, ActCloseView

urlpatterns = [
    path('', ActListCreateView.as_view(), name='act-list-create'),
    path('<uuid:pk>/', ActDetailView.as_view(), name='act-detail'),
    path('<uuid:pk>/close/', ActCloseView.as_view(), name='act-close'),
]

