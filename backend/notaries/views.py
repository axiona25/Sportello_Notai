"""
Views for notaries management.
"""
from rest_framework import generics, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Notary, Client, Collaborator, NotaryAvailability
from .serializers import (
    NotarySerializer, NotaryListSerializer, ClientSerializer,
    CollaboratorSerializer, NotaryAvailabilitySerializer
)
from accounts.models import UserRole


class NotaryListView(generics.ListAPIView):
    """List all notaries with filtering and search."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = NotaryListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['studio_name', 'address_city', 'specializations']
    ordering_fields = ['average_rating', 'total_reviews', 'created_at']
    ordering = ['-average_rating']
    
    def get_queryset(self):
        # Ottimizzato: select_related per evitare N+1 queries
        queryset = Notary.objects.select_related('user').all()
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(address_city__icontains=city)
        
        # Filter by province
        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(address_province__icontains=province)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(average_rating__gte=float(min_rating))
        
        # Filter by specialization
        specialization = self.request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specializations__contains=[specialization])
        
        # Nearby search (requires lat/lng)
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius_km = self.request.query_params.get('radius', '50')
        
        if lat and lng:
            point = Point(float(lng), float(lat), srid=4326)
            queryset = queryset.filter(
                coordinates__distance_lte=(point, D(km=float(radius_km)))
            ).distance(point).order_by('distance')
        
        return queryset


class NotaryDetailView(generics.RetrieveAPIView):
    """Get notary details."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = NotarySerializer
    queryset = Notary.objects.all()


class NotaryUpdateView(generics.RetrieveUpdateAPIView):
    """Update notary profile (notary only)."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotarySerializer
    
    def get_object(self):
        # Notary can only update their own profile
        if self.request.user.role != UserRole.NOTAIO:
            self.permission_denied(self.request)
        
        return self.request.user.notary_profile


class NotaryServicesView(APIView):
    """Manage notary services."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'services': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'name': {'type': 'string'},
                                'price': {'type': 'number'},
                                'description': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }
    )
    def post(self, request, pk):
        """Add/update services for a notary."""
        try:
            notary = Notary.objects.get(pk=pk)
        except Notary.DoesNotExist:
            return Response(
                {'error': 'Notaio non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if request.user.role != UserRole.NOTAIO or request.user.notary_profile.id != notary.id:
            return Response(
                {'error': 'Non autorizzato'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        services = request.data.get('services', [])
        notary.services = services
        notary.save()
        
        return Response(NotarySerializer(notary).data)


class NotaryAvailabilityListCreateView(generics.ListCreateAPIView):
    """List and create notary availability slots."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotaryAvailabilitySerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return NotaryAvailability.objects.filter(notary_id=notary_id)
    
    def perform_create(self, serializer):
        notary_id = self.kwargs.get('pk')
        notary = Notary.objects.get(pk=notary_id)
        
        # Check permission
        if self.request.user.role != UserRole.NOTAIO or self.request.user.notary_profile.id != notary.id:
            self.permission_denied(self.request)
        
        serializer.save(notary=notary)


class NotaryAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete availability slot."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotaryAvailabilitySerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return NotaryAvailability.objects.filter(notary_id=notary_id)


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """Client profile endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientSerializer
    
    def get_object(self):
        if self.request.user.role != UserRole.CLIENTE:
            self.permission_denied(self.request)
        
        return self.request.user.client_profile


class CollaboratorListView(generics.ListCreateAPIView):
    """List and create collaborators for a notary."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaboratorSerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return Collaborator.objects.filter(notary_id=notary_id)
    
    def perform_create(self, serializer):
        notary_id = self.kwargs.get('pk')
        notary = Notary.objects.get(pk=notary_id)
        
        # Check permission - only notary can add collaborators
        if self.request.user.role != UserRole.NOTAIO or self.request.user.notary_profile.id != notary.id:
            self.permission_denied(self.request)
        
        serializer.save(notary=notary)

