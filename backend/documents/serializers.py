"""
Serializers for documents.
"""
from rest_framework import serializers
from .models import ActDocument, DocumentPermission, PDFAnnotation


class ActDocumentSerializer(serializers.ModelSerializer):
    """Document serializer."""
    
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    
    class Meta:
        model = ActDocument
        fields = [
            'id', 'act', 'category', 'subcategory',
            'filename', 'original_filename', 'mime_type', 'file_size',
            'blob_url', 'blob_storage_key',
            'ciphertext_hash', 'encryption_metadata', 'wrapped_keys',
            'version', 'parent_version', 'is_latest',
            'is_signed', 'signature_type', 'signature_data',
            'has_timestamp', 'timestamp_data',
            'has_stamp', 'stamp_data',
            'uploaded_by', 'uploaded_by_email', 'uploaded_at',
            'access_log'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for encrypted document upload."""
    
    act_id = serializers.UUIDField()
    category = serializers.ChoiceField(choices=ActDocument._meta.get_field('category').choices)
    subcategory = serializers.CharField(required=False, allow_blank=True)
    original_filename = serializers.CharField()
    mime_type = serializers.CharField(required=False)
    file_size = serializers.IntegerField()
    
    # E2E encryption data
    ciphertext_hash = serializers.CharField()
    encryption_metadata = serializers.JSONField()
    wrapped_keys = serializers.JSONField()
    
    # Storage info
    blob_url = serializers.URLField()
    blob_storage_key = serializers.CharField()


class DocumentPermissionSerializer(serializers.ModelSerializer):
    """Document permission serializer."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    granted_by_email = serializers.EmailField(source='granted_by.email', read_only=True)
    
    class Meta:
        model = DocumentPermission
        fields = [
            'id', 'document', 'user', 'user_email',
            'can_read', 'can_write', 'can_delete', 'can_share',
            'granted_by', 'granted_by_email', 'granted_at', 'expires_at'
        ]
        read_only_fields = ['id', 'granted_by', 'granted_at']


class PDFAnnotationSerializer(serializers.ModelSerializer):
    """
    Serializer per annotazioni PDF Fabric.js.
    """
    
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PDFAnnotation
        fields = [
            'id',
            'document',
            'page_number',
            'fabric_object',
            'object_type',
            'created_by',
            'created_by_email',
            'created_by_name',
            'created_at',
            'updated_at',
            'z_index'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Restituisce nome completo dell'utente."""
        if not obj.created_by:
            return None
        
        # Prova con first_name e last_name
        if hasattr(obj.created_by, 'first_name') and obj.created_by.first_name:
            full_name = f"{obj.created_by.first_name}"
            if hasattr(obj.created_by, 'last_name') and obj.created_by.last_name:
                full_name += f" {obj.created_by.last_name}"
            return full_name
        
        # Fallback su email
        return obj.created_by.email


class PDFAnnotationBulkSerializer(serializers.Serializer):
    """
    Serializer per salvataggio bulk di annotazioni.
    """
    
    document_id = serializers.UUIDField()
    page_number = serializers.IntegerField(min_value=1)
    annotations = serializers.ListField(
        child=serializers.JSONField(),
        help_text="Array di oggetti Fabric.js serializzati"
    )

