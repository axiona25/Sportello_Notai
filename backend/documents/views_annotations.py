"""
API Views per gestione annotazioni PDF Fabric.js.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import PDFAnnotation, ActDocument
from .serializers import PDFAnnotationSerializer, PDFAnnotationBulkSerializer

logger = logging.getLogger(__name__)


class PDFAnnotationViewSet(viewsets.ModelViewSet):
    """
    ViewSet per gestione annotazioni PDF.
    
    Endpoints:
    - GET /api/documents/annotations/                     → Lista tutte le annotazioni
    - GET /api/documents/annotations/{id}/                → Dettaglio annotazione
    - POST /api/documents/annotations/                    → Crea annotazione
    - PUT /api/documents/annotations/{id}/                → Aggiorna annotazione
    - DELETE /api/documents/annotations/{id}/             → Elimina annotazione
    - GET /api/documents/annotations/by_document/{doc_id}/ → Annotazioni per documento
    - POST /api/documents/annotations/bulk_save/          → Salvataggio bulk per pagina
    - DELETE /api/documents/annotations/bulk_delete/      → Eliminazione bulk per pagina
    """
    
    queryset = PDFAnnotation.objects.all()
    serializer_class = PDFAnnotationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra annotazioni in base a parametri query.
        """
        queryset = PDFAnnotation.objects.select_related('document', 'created_by')
        
        # Filtra per documento
        document_id = self.request.query_params.get('document', None)
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        # Filtra per pagina
        page_number = self.request.query_params.get('page', None)
        if page_number:
            queryset = queryset.filter(page_number=int(page_number))
        
        # Filtra per tipo oggetto
        object_type = self.request.query_params.get('type', None)
        if object_type:
            queryset = queryset.filter(object_type=object_type)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Imposta created_by automaticamente all'utente corrente.
        """
        serializer.save(created_by=self.request.user)
        logger.info(f"✨ Annotazione PDF creata da {self.request.user.email}: {serializer.data['object_type']} su pagina {serializer.data['page_number']}")
    
    def perform_destroy(self, instance):
        """
        Log eliminazione annotazione.
        """
        logger.info(f"🗑️ Annotazione PDF eliminata: {instance.object_type} su pagina {instance.page_number} del documento {instance.document.filename}")
        instance.delete()
    
    @action(detail=False, methods=['get'], url_path='by_document/(?P<document_id>[^/.]+)')
    def by_document(self, request, document_id=None):
        """
        Recupera tutte le annotazioni per un documento specifico.
        
        GET /api/documents/annotations/by_document/{document_id}/
        
        Query params opzionali:
        - page: filtra per numero pagina
        """
        # ✅ Cerca prima in ActDocument, poi in ActTemplate se non trovato
        try:
            from acts.models_templates import ActTemplate
            document = ActDocument.objects.filter(id=document_id).first()
            if not document:
                # Prova con ActTemplate
                template = ActTemplate.objects.filter(id=document_id).first()
                if template:
                    # Per i template, restituisci array vuoto (le annotazioni si salvano sui documenti generati)
                    logger.info(f"📋 Template {document_id} - Nessuna annotazione (i template non hanno annotazioni)")
                    return Response([])
                else:
                    return Response({'error': 'Documento non trovato'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"❌ Errore ricerca documento {document_id}: {str(e)}")
            return Response({'error': 'Documento non trovato'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verifica permessi (il documento deve essere accessibile)
        # TODO: Implementare controllo permessi documento
        
        queryset = PDFAnnotation.objects.filter(document=document)
        
        # Filtra per pagina se specificato
        page_number = request.query_params.get('page', None)
        if page_number:
            queryset = queryset.filter(page_number=int(page_number))
        
        queryset = queryset.select_related('document', 'created_by').order_by('page_number', 'z_index', 'created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        
        logger.info(f"📋 Recuperate {len(serializer.data)} annotazioni per documento {document.filename}")
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        """
        Salva annotazioni in bulk per una specifica pagina.
        Rimpiazza tutte le annotazioni esistenti per quella pagina.
        
        POST /api/documents/annotations/bulk_save/
        Body: {
            "document_id": "uuid",
            "page_number": 1,
            "annotations": [
                { "type": "text", "data": {...} },
                { "type": "rect", "data": {...} }
            ]
        }
        """
        serializer = PDFAnnotationBulkSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        document_id = serializer.validated_data['document_id']
        page_number = serializer.validated_data['page_number']
        annotations = serializer.validated_data['annotations']
        
        # Verifica documento esiste
        document = get_object_or_404(ActDocument, id=document_id)
        
        # Verifica permessi (solo notai/admin possono annotare)
        if request.user.role not in ['notaio', 'admin']:
            logger.warning(f"⚠️ Utente {request.user.email} (role: {request.user.role}) ha tentato di salvare annotazioni (non autorizzato)")
            return Response(
                {"error": "Solo notai e amministratori possono creare annotazioni"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Transazione atomica: elimina vecchie annotazioni e crea nuove
        try:
            with transaction.atomic():
                # Elimina annotazioni esistenti per questa pagina
                deleted_count, _ = PDFAnnotation.objects.filter(
                    document=document,
                    page_number=page_number
                ).delete()
                
                # Crea nuove annotazioni
                created_annotations = []
                for idx, annotation_data in enumerate(annotations):
                    annotation = PDFAnnotation.objects.create(
                        document=document,
                        page_number=page_number,
                        fabric_object=annotation_data,
                        object_type=annotation_data.get('type', 'unknown'),
                        created_by=request.user,
                        z_index=idx
                    )
                    created_annotations.append(annotation)
                
                logger.info(f"💾 Bulk save completato: {deleted_count} annotazioni eliminate, {len(created_annotations)} create per pagina {page_number} di {document.filename}")
                
                # Serializza le annotazioni create
                result_serializer = PDFAnnotationSerializer(created_annotations, many=True)
                
                return Response({
                    "message": "Annotazioni salvate con successo",
                    "deleted_count": deleted_count,
                    "created_count": len(created_annotations),
                    "annotations": result_serializer.data
                }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"❌ Errore durante bulk save annotazioni: {e}", exc_info=True)
            return Response(
                {"error": "Errore durante il salvataggio delle annotazioni"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """
        Elimina tutte le annotazioni per una specifica pagina.
        
        DELETE /api/documents/annotations/bulk_delete/
        Query params:
        - document_id: UUID documento
        - page_number: numero pagina
        """
        document_id = request.query_params.get('document_id')
        page_number = request.query_params.get('page_number')
        
        if not document_id or not page_number:
            return Response(
                {"error": "Parametri document_id e page_number obbligatori"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verifica documento esiste
        document = get_object_or_404(ActDocument, id=document_id)
        
        # Verifica permessi
        if request.user.role not in ['notaio', 'admin']:
            logger.warning(f"⚠️ Utente {request.user.email} ha tentato di eliminare annotazioni (non autorizzato)")
            return Response(
                {"error": "Solo notai e amministratori possono eliminare annotazioni"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Elimina annotazioni
        deleted_count, _ = PDFAnnotation.objects.filter(
            document=document,
            page_number=int(page_number)
        ).delete()
        
        logger.info(f"🗑️ Bulk delete: {deleted_count} annotazioni eliminate per pagina {page_number} di {document.filename}")
        
        return Response({
            "message": "Annotazioni eliminate con successo",
            "deleted_count": deleted_count
        }, status=status.HTTP_200_OK)

