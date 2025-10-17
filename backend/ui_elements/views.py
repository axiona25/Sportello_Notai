from rest_framework import viewsets, permissions
from .models import Element
from .serializers import ElementSerializer


class ElementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UI Elements.
    
    list: Get all UI elements
    retrieve: Get a specific element by ID
    create: Create a new element (admin only)
    update: Update an element (admin only)
    delete: Delete an element (admin only)
    """
    queryset = Element.objects.filter(is_active=True)
    serializer_class = ElementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by type
        element_type = self.request.query_params.get('type', None)
        if element_type:
            queryset = queryset.filter(type=element_type)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        return queryset

