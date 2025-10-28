"""
Models for encrypted documents management.
"""
import uuid
from django.db import models
from acts.models import Act
from accounts.models import User


class DocumentCategory(models.TextChoices):
    """Categories for document organization."""
    ANAGRAFICA = 'anagrafica', 'Anagrafica'
    BANCA = 'banca', 'Banca'
    PERMESSI = 'permessi', 'Permessi'
    CERTIFICAZIONI = 'certificazioni', 'Certificazioni'
    CATASTALI = 'catastali', 'Catastali'
    URBANISTICI = 'urbanistici', 'Urbanistici'
    CONTRATTI = 'contratti', 'Contratti'
    ALLEGATI = 'allegati', 'Allegati'
    FIRMATI = 'firmati', 'Firmati'
    ALTRO = 'altro', 'Altro'


class SignatureType(models.TextChoices):
    """Digital signature types."""
    CADES = 'cades', 'CAdES'
    XADES = 'xades', 'XAdES'
    PADES = 'pades', 'PAdES'


class ActDocument(models.Model):
    """Encrypted document linked to an act."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    act = models.ForeignKey(Act, on_delete=models.CASCADE, related_name='documents')
    
    # Categorizzazione
    category = models.CharField(max_length=20, choices=DocumentCategory.choices)
    subcategory = models.CharField(max_length=100, blank=True)  # sottocartella personalizzata
    
    # File info
    filename = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True)
    file_size = models.BigIntegerField()
    
    # Storage (blob cifrato)
    blob_url = models.TextField()  # S3/GCS/Azure URL
    blob_storage_key = models.CharField(max_length=500)
    
    # E2E Encryption
    ciphertext_hash = models.CharField(max_length=64)  # SHA-256 del ciphertext
    encryption_metadata = models.JSONField(
        default=dict,
        help_text='{"algorithm": "AES-256-GCM", "key_wrapped": true, ...}'
    )
    wrapped_keys = models.JSONField(
        default=list,
        help_text='[{"user_id": "...", "wrapped_key": "base64...", "algorithm": "RSA-OAEP"}, ...]'
    )
    
    # Versioning
    version = models.IntegerField(default=1)
    parent_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='versions'
    )
    is_latest = models.BooleanField(default=True)
    
    # Firma digitale
    is_signed = models.BooleanField(default=False)
    signature_type = models.CharField(
        max_length=10,
        choices=SignatureType.choices,
        blank=True,
        null=True
    )
    signature_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"signer": "...", "timestamp": "...", "certificate": "...", ...}'
    )
    
    # Marca temporale
    has_timestamp = models.BooleanField(default=False)
    timestamp_data = models.JSONField(default=dict, blank=True)
    
    # Timbro digitale
    has_stamp = models.BooleanField(default=False)
    stamp_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Audit
    access_log = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"user_id": "...", "action": "download", "timestamp": "..."}, ...]'
    )
    
    class Meta:
        db_table = 'act_documents'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['act', '-uploaded_at']),
            models.Index(fields=['category', 'act']),
            models.Index(fields=['act', 'version', 'is_latest']),
        ]
    
    def __str__(self):
        return f"{self.filename} (v{self.version})"
    
    def log_access(self, user, action):
        """Log document access."""
        from django.utils import timezone
        if not self.access_log:
            self.access_log = []
        
        self.access_log.append({
            'user_id': str(user.id),
            'action': action,
            'timestamp': timezone.now().isoformat()
        })
        self.save()
    
    def create_new_version(self, new_file_data, user):
        """Create a new version of this document."""
        # Mark current as not latest
        self.is_latest = False
        self.save()
        
        # Create new version
        new_doc = ActDocument.objects.create(
            act=self.act,
            category=self.category,
            subcategory=self.subcategory,
            filename=new_file_data.get('filename', self.filename),
            original_filename=new_file_data['original_filename'],
            mime_type=new_file_data.get('mime_type', ''),
            file_size=new_file_data['file_size'],
            blob_url=new_file_data['blob_url'],
            blob_storage_key=new_file_data['blob_storage_key'],
            ciphertext_hash=new_file_data['ciphertext_hash'],
            encryption_metadata=new_file_data.get('encryption_metadata', {}),
            wrapped_keys=new_file_data.get('wrapped_keys', []),
            version=self.version + 1,
            parent_version=self,
            is_latest=True,
            uploaded_by=user
        )
        
        return new_doc


class DocumentPermission(models.Model):
    """Granular permissions for documents."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(ActDocument, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_permissions')
    
    can_read = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_share = models.BooleanField(default=False)
    
    granted_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='granted_permissions'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'document_permissions'
        verbose_name = 'Document Permission'
        verbose_name_plural = 'Document Permissions'
        unique_together = ['document', 'user']
        ordering = ['-granted_at']
    
    def __str__(self):
        perms = []
        if self.can_read: perms.append('read')
        if self.can_write: perms.append('write')
        if self.can_delete: perms.append('delete')
        if self.can_share: perms.append('share')
        return f"{self.user.email} -> {self.document.filename} ({', '.join(perms)})"
    
    def is_valid(self):
        """Check if permission is still valid."""
        from django.utils import timezone
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True


class PDFAnnotation(models.Model):
    """
    Annotazioni Fabric.js su documenti PDF.
    Salva oggetti canvas (testi, forme, disegni) per persistenza.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        ActDocument, 
        on_delete=models.CASCADE, 
        related_name='annotations',
        help_text="Documento PDF annotato"
    )
    
    # Pagina PDF
    page_number = models.IntegerField(
        help_text="Numero pagina (1-indexed)"
    )
    
    # Dati Fabric.js (serializzato JSON)
    fabric_object = models.JSONField(
        help_text="Oggetto Fabric.js serializzato (canvas.toJSON())"
    )
    
    # Tipo di annotazione
    object_type = models.CharField(
        max_length=50,
        help_text="Tipo oggetto: text, path (disegno), rect, circle, line, etc."
    )
    
    # Metadati
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pdf_annotations_created',
        help_text="Utente che ha creato l'annotazione"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ordine rendering (z-index)
    z_index = models.IntegerField(default=0, help_text="Ordine di rendering")
    
    class Meta:
        db_table = 'pdf_annotations'
        verbose_name = 'PDF Annotation'
        verbose_name_plural = 'PDF Annotations'
        ordering = ['document', 'page_number', 'z_index', 'created_at']
        indexes = [
            models.Index(fields=['document', 'page_number']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.object_type} on page {self.page_number} of {self.document.filename}"

