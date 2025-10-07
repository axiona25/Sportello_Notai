from rest_framework import generics, permissions
from .models import AuditLog, SecurityEvent
from .serializers import AuditLogSerializer, SecurityEventSerializer


class AuditLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer
    
    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user).order_by('-created_at')


class SecurityEventListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = SecurityEventSerializer
    queryset = SecurityEvent.objects.all().order_by('-created_at')

