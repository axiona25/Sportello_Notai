"""
Models for digital conservation (conservazione sostitutiva).
"""
import uuid
from django.db import models
from notaries.models import Notary


class ConservationPackage(models.Model):
    """Package for digital conservation (AgID compliant)."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('exported', 'Exported'),
        ('conserved', 'Conserved'),
        ('verified', 'Verified'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    notary = models.ForeignKey(Notary, on_delete=models.PROTECT, related_name='conservation_packages')
    
    # Periodo
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Documenti inclusi
    document_ids = models.JSONField(
        default=list,
        help_text='Array di document_id inclusi nel pacchetto'
    )
    
    # Conservatore
    conservator_provider = models.CharField(
        max_length=100,
        blank=True,
        help_text='Conservatore accreditato AgID'
    )
    conservator_package_id = models.CharField(max_length=255, blank=True)
    
    # Export
    package_hash = models.CharField(max_length=64, blank=True)  # SHA-256 del pacchetto
    package_url = models.TextField(blank=True)
    
    # Stato
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    exported_at = models.DateTimeField(blank=True, null=True)
    conserved_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'conservation_packages'
        verbose_name = 'Conservation Package'
        verbose_name_plural = 'Conservation Packages'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Package {self.period_start} - {self.period_end} ({self.notary.studio_name})"
    
    def get_document_count(self):
        """Get number of documents in package."""
        return len(self.document_ids)

