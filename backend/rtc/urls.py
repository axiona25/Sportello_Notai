from django.urls import path
from .views import RtcSessionListCreateView, RtcSessionDetailView

urlpatterns = [
    path('sessions/', RtcSessionListCreateView.as_view(), name='rtc-session-list'),
    path('sessions/<uuid:pk>/', RtcSessionDetailView.as_view(), name='rtc-session-detail'),
]

