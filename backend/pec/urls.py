from django.urls import path
from .views import PecTemplateListCreateView, PecMessageListCreateView, PecMessageDetailView

urlpatterns = [
    path('templates/', PecTemplateListCreateView.as_view(), name='pec-template-list'),
    path('messages/', PecMessageListCreateView.as_view(), name='pec-message-list'),
    path('messages/<uuid:pk>/', PecMessageDetailView.as_view(), name='pec-message-detail'),
]

