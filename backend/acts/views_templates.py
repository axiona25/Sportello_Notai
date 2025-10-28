"""
API Views for Act Templates.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404

from .models_templates import ActTemplate, ACT_CODE_PREFIXES
from .serializers_templates import (
    ActTemplateSerializer,
    ActTemplateUploadSerializer,
    ActCodeGenerateSerializer
)


class IsAuthenticatedOrReadOnlyOptions(BasePermission):
    """
    Permission che permette OPTIONS senza autenticazione (per CORS pre-flight)
    ma richiede autenticazione per tutte le altre richieste.
    """
    def has_permission(self, request, view):
        # Permetti OPTIONS senza autenticazione (CORS pre-flight)
        if request.method == 'OPTIONS':
            return True
        # Per tutti gli altri metodi richiedi autenticazione
        return request.user and request.user.is_authenticated


class ActTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing act templates.
    
    Endpoints:
    - GET /api/acts/templates/ - List all templates
    - POST /api/acts/templates/ - Upload new template
    - GET /api/acts/templates/{id}/ - Get template details
    - PUT /api/acts/templates/{id}/ - Update template
    - DELETE /api/acts/templates/{id}/ - Delete (deactivate) template
    - GET /api/acts/templates/by_act_type/{act_type_code}/ - Get template for act type
    - POST /api/acts/templates/generate_code/ - Generate new act code
    - GET /api/acts/templates/statistics/ - Get template statistics
    """
    
    queryset = ActTemplate.objects.all()
    serializer_class = ActTemplateSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyOptions]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Filter templates based on query params."""
        queryset = ActTemplate.objects.all()
        
        # Filter by act type
        act_type = self.request.query_params.get('act_type', None)
        if act_type:
            queryset = queryset.filter(act_type_code=act_type)
        
        # Filter active only
        active_only = self.request.query_params.get('active_only', 'true')
        if active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('act_type_name')
    
    def create(self, request, *args, **kwargs):
        """Upload a new template."""
        serializer = ActTemplateUploadSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        template = serializer.save()
        
        # Return full template data
        output_serializer = ActTemplateSerializer(template, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Deactivate template instead of deleting."""
        template = self.get_object()
        template.is_active = False
        template.save()
        return Response(
            {'message': 'Template disattivato con successo'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by_act_type/(?P<act_type_code>[^/.]+)')
    def by_act_type(self, request, act_type_code=None):
        """Get active template for a specific act type."""
        template = ActTemplate.get_active_template_for_act_type(act_type_code)
        
        if not template:
            return Response(
                {'error': f'Nessun template trovato per: {act_type_code}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serializza il template (include già next_code_preview)
        serializer = self.get_serializer(template)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def generate_code(self, request):
        """Generate a new act code for a specific act type."""
        serializer = ActCodeGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics about templates and code generation."""
        from django.db.models import Count
        
        stats = {
            'total_templates': ActTemplate.objects.count(),
            'active_templates': ActTemplate.objects.filter(is_active=True).count(),
            'templates_by_type': list(
                ActTemplate.objects.values('act_type_code', 'act_type_name')
                .annotate(count=Count('id'))
                .order_by('act_type_name')
            )
        }
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the template file."""
        template = self.get_object()
        
        if not template.template_file:
            raise Http404("Template file not found")
        
        try:
            response = FileResponse(
                template.template_file.open('rb'),
                content_type=template.mime_type
            )
            response['Content-Disposition'] = f'attachment; filename="{template.original_filename}"'
            return response
        except FileNotFoundError:
            raise Http404("Template file not found")

