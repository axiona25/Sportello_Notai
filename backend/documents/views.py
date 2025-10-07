"""
Views for documents management.
"""
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import ActDocument, DocumentPermission
from .serializers import ActDocumentSerializer, DocumentUploadSerializer, DocumentPermissionSerializer
from acts.models import Act


class DocumentListView(generics.ListAPIView):
    """List documents for an act."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActDocumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_signed', 'is_latest']
    
    def get_queryset(self):
        act_id = self.kwargs.get('act_id')
        return ActDocument.objects.filter(act_id=act_id)


class DocumentUploadView(APIView):
    """Upload encrypted document."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Create document
        document = ActDocument.objects.create(
            act_id=data['act_id'],
            category=data['category'],
            subcategory=data.get('subcategory', ''),
            filename=data['original_filename'],
            original_filename=data['original_filename'],
            mime_type=data.get('mime_type', ''),
            file_size=data['file_size'],
            blob_url=data['blob_url'],
            blob_storage_key=data['blob_storage_key'],
            ciphertext_hash=data['ciphertext_hash'],
            encryption_metadata=data['encryption_metadata'],
            wrapped_keys=data['wrapped_keys'],
            uploaded_by=request.user
        )
        
        return Response(
            ActDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete document."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActDocumentSerializer
    queryset = ActDocument.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Log document access
        instance.log_access(request.user, 'download')
        return super().retrieve(request, *args, **kwargs)


class DocumentPermissionListCreateView(generics.ListCreateAPIView):
    """List and create document permissions."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentPermissionSerializer
    
    def get_queryset(self):
        document_id = self.kwargs.get('document_id')
        return DocumentPermission.objects.filter(document_id=document_id)
    
    def perform_create(self, serializer):
        serializer.save(granted_by=self.request.user)

