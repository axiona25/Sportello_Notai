"""
Models for digital signatures and timestamps.
"""
import uuid
from django.db import models
from documents.models import ActDocument, SignatureType
from accounts.models import User


class SignatureRequest(models.Model):
    """Digital signature request."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('signed', 'Signed'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        ActDocument,
        on_delete=models.CASCADE,
        related_name='signature_requests'
    )
    
    requested_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='requested_signatures'
    )
    signer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='signature_requests'
    )
    
    signature_type = models.CharField(max_length=10, choices=SignatureType.choices)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Provider firma qualificata
    provider = models.CharField(
        max_length=100,
        blank=True,
        help_text='es. "Infocert", "Aruba", "Namirial"'
    )
    provider_request_id = models.CharField(max_length=255, blank=True)
    
    # OTP/PIN per firma
    otp_sent = models.BooleanField(default=False)
    otp_verified = models.BooleanField(default=False)
    
    signed_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'signature_requests'
        verbose_name = 'Signature Request'
        verbose_name_plural = 'Signature Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Signature request for {self.document.filename} by {self.signer.email}"
    
    def is_expired(self):
        """Check if request is expired."""
        from django.utils import timezone
        if self.expires_at and self.expires_at < timezone.now():
            return True
        return False


class TimestampRequest(models.Model):
    """Timestamp (marca temporale) request."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        ActDocument,
        on_delete=models.CASCADE,
        related_name='timestamp_requests'
    )
    
    requested_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='requested_timestamps'
    )
    
    # TSA (Time Stamp Authority)
    tsa_provider = models.CharField(max_length=100, blank=True)
    tsa_response = models.BinaryField(blank=True)  # RFC 3161 TimeStampResp
    
    timestamp_token = models.TextField(blank=True)
    timestamp_value = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'timestamp_requests'
        verbose_name = 'Timestamp Request'
        verbose_name_plural = 'Timestamp Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Timestamp for {self.document.filename}"

