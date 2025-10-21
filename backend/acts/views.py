"""
Views for acts management.
"""
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Act, NotarialActMainCategory, NotarialActCategory, DocumentType, NotarialActCategoryDocument
from .serializers import (
    ActSerializer, ActListSerializer, ActCloseSerializer,
    NotarialActMainCategorySerializer, NotarialActCategorySerializer,
    DocumentTypeSerializer, NotarialActCategoryDocumentSerializer
)
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


class NotarialActCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet per le categorie di atto notarile.
    - Tutti gli utenti autenticati possono vedere le categorie (GET)
    - Solo Admin può creare/modificare/eliminare (POST/PUT/PATCH/DELETE)
    """
    serializer_class = NotarialActCategorySerializer
    pagination_class = None  # Disabilita paginazione - restituisce tutte le categorie
    
    def get_permissions(self):
        """Permessi diversi per azioni diverse."""
        if self.action in ['list', 'retrieve']:
            # Tutti gli utenti autenticati possono vedere
            return [permissions.IsAuthenticated()]
        else:
            # Solo admin può modificare
            return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        """
        Restituisce tutte le categorie per admin.
        Restituisce solo quelle attive per gli altri utenti.
        """
        if self.request.user and self.request.user.role == 'admin':
            return NotarialActCategory.objects.all().select_related('main_category').prefetch_related('required_documents__document_type').order_by('main_category__order', 'order')
        return NotarialActCategory.objects.filter(
            is_active=True
        ).select_related('main_category').prefetch_related('required_documents__document_type').order_by('main_category__order', 'order')
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def add_document(self, request, pk=None):
        """Aggiungi un documento richiesto a questa categoria di atto."""
        category = self.get_object()
        document_type_id = request.data.get('document_type_id')
        is_mandatory = request.data.get('is_mandatory', True)
        order = request.data.get('order', 0)
        notes = request.data.get('notes', '')
        
        if not document_type_id:
            return Response(
                {'error': 'document_type_id è richiesto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document_type = DocumentType.objects.get(id=document_type_id)
        except DocumentType.DoesNotExist:
            return Response(
                {'error': 'DocumentType non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Controlla se esiste già
        if NotarialActCategoryDocument.objects.filter(
            act_category=category,
            document_type=document_type
        ).exists():
            return Response(
                {'error': 'Questo documento è già richiesto per questa categoria'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crea il collegamento
        link = NotarialActCategoryDocument.objects.create(
            act_category=category,
            document_type=document_type,
            is_mandatory=is_mandatory,
            order=order,
            notes=notes
        )
        
        serializer = NotarialActCategoryDocumentSerializer(link)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAdminUser], url_path='remove_document/(?P<document_link_id>[^/.]+)')
    def remove_document(self, request, pk=None, document_link_id=None):
        """Rimuovi un documento richiesto da questa categoria di atto."""
        try:
            link = NotarialActCategoryDocument.objects.get(
                id=document_link_id,
                act_category_id=pk
            )
            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except NotarialActCategoryDocument.DoesNotExist:
            return Response(
                {'error': 'Collegamento documento non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )


class DocumentTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet per i tipi di documento.
    - Tutti gli utenti autenticati possono vedere (GET)
    - Solo Admin può modificare (POST/PUT/PATCH/DELETE)
    """
    serializer_class = DocumentTypeSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        if self.request.user and self.request.user.role == 'admin':
            return DocumentType.objects.all().order_by('category', 'name')
        return DocumentType.objects.filter(is_active=True).order_by('category', 'name')

