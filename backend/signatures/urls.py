from django.urls import path
from .views import SignatureRequestListCreateView, TimestampRequestListCreateView

urlpatterns = [
    path('requests/', SignatureRequestListCreateView.as_view(), name='signature-request-list'),
    path('timestamps/', TimestampRequestListCreateView.as_view(), name='timestamp-request-list'),
]

