from django.urls import path
from .views import AuditLogListView, SecurityEventListView

urlpatterns = [
    path('logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('security/', SecurityEventListView.as_view(), name='security-event-list'),
]

