"""
Views for UI elements management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import AppointmentTypeTemplate
from .serializers import AppointmentTypeTemplateSerializer


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admins."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class AppointmentTypeTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointment type templates.
    Only admins can create/update/delete.
    All authenticated users can read (for booking).
    """
    queryset = AppointmentTypeTemplate.objects.all()
    serializer_class = AppointmentTypeTemplateSerializer
    
    def get_permissions(self):
        """
        Read-only per tutti gli autenticati.
        Write solo per admin.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Admins vedono tutte le tipologie.
        Altri utenti vedono solo quelle attive.
        """
        if self.request.user.role == 'admin':
            return AppointmentTypeTemplate.objects.all()
        return AppointmentTypeTemplate.objects.filter(is_active=True)
