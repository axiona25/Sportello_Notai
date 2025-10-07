"""
Views for acts management.
"""
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Act
from .serializers import ActSerializer, ActListSerializer, ActCloseSerializer
from accounts.models import UserRole


class ActListCreateView(generics.ListCreateAPIView):
    """List and create acts."""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'status', 'notary', 'client']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ActListSerializer
        return ActSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Ottimizzato: select_related per evitare N+1 queries
        base_queryset = Act.objects.select_related(
            'notary__user',
            'client__user'
        ).prefetch_related('documents')
        
        if user.role == UserRole.NOTAIO:
            return base_queryset.filter(notary=user.notary_profile)
        elif user.role == UserRole.CLIENTE:
            return base_queryset.filter(client=user.client_profile)
        elif user.role == UserRole.COLLABORATORE:
            return base_queryset.filter(notary=user.collaborator_profile.notary)
        
        return Act.objects.none()


class ActDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete act."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Ottimizzato: select_related per evitare N+1 queries
        base_queryset = Act.objects.select_related(
            'notary__user',
            'client__user'
        ).prefetch_related('documents')
        
        if user.role == UserRole.NOTAIO:
            return base_queryset.filter(notary=user.notary_profile)
        elif user.role == UserRole.CLIENTE:
            return base_queryset.filter(client=user.client_profile)
        elif user.role == UserRole.COLLABORATORE:
            return base_queryset.filter(notary=user.collaborator_profile.notary)
        
        return Act.objects.none()


class ActCloseView(APIView):
    """Close an act (requires survey)."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            act = Act.objects.get(pk=pk)
        except Act.DoesNotExist:
            return Response(
                {'error': 'Atto non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if request.user.role not in [UserRole.NOTAIO, UserRole.COLLABORATORE]:
            return Response(
                {'error': 'Non autorizzato'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ActCloseSerializer(data=request.data, instance=act)
        serializer.is_valid(raise_exception=True)
        
        # Update act
        act.status = 'archiviato'
        act.closed_at = timezone.now()
        if 'survey_data' in serializer.validated_data:
            act.survey_data = serializer.validated_data['survey_data']
            act.survey_completed = True
        act.save()
        
        return Response(ActSerializer(act).data)

