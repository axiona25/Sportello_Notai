"""
Models for notarial acts.
"""
import uuid
from django.db import models
from notaries.models import Notary, Client


class ActCategory(models.TextChoices):
    """Categories of notarial acts."""
    COMPRAVENDITA = 'compravendita', 'Compravendita'
    MUTUO = 'mutuo', 'Mutuo'
    TESTAMENTO = 'testamento', 'Testamento'
    COSTITUZIONE_SOCIETA = 'costituzione_societa', 'Costituzione Società'
    DONAZIONE = 'donazione', 'Donazione'
    DIVISIONE = 'divisione', 'Divisione'
    SUCCESSIONE = 'successione', 'Successione'
    PROCURA = 'procura', 'Procura'
    ALTRO = 'altro', 'Altro'


class ActStatus(models.TextChoices):
    """Status of act workflow."""
    BOZZA = 'bozza', 'Bozza'
    IN_LAVORAZIONE = 'in_lavorazione', 'In Lavorazione'
    IN_ATTESA_FIRMA = 'in_attesa_firma', 'In Attesa Firma'
    FIRMATO = 'firmato', 'Firmato'
    INVIATO_PEC = 'inviato_pec', 'Inviato PEC'
    ARCHIVIATO = 'archiviato', 'Archiviato'
    ANNULLATO = 'annullato', 'Annullato'


class Act(models.Model):
    """Notarial act with complete workflow."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Riferimenti
    notary = models.ForeignKey(Notary, on_delete=models.PROTECT, related_name='acts')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='acts')
    
    # Tipo e stato
    category = models.CharField(max_length=30, choices=ActCategory.choices)
    status = models.CharField(max_length=30, choices=ActStatus.choices, default=ActStatus.BOZZA)
    
    # Protocollo
    protocol_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    protocol_year = models.IntegerField(blank=True, null=True)
    
    # Dettagli
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Parti coinvolte (JSON flessibile)
    parties = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"type": "venditore", "client_id": "...", "name": "..."}, ...]'
    )
    
    # Banca coinvolta (se mutuo)
    bank_name = models.CharField(max_length=255, blank=True)
    bank_branch = models.CharField(max_length=255, blank=True)
    loan_amount = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    # Immobile (se compravendita)
    property_address = models.CharField(max_length=500, blank=True)
    property_cadastral_data = models.JSONField(default=dict, blank=True)
    property_value = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    # Date importanti
    signing_date = models.DateTimeField(blank=True, null=True)
    registration_date = models.DateTimeField(blank=True, null=True)
    
    # Survey obbligatoria post-chiusura
    survey_completed = models.BooleanField(default=False)
    survey_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'acts'
        verbose_name = 'Act'
        verbose_name_plural = 'Acts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notary', '-created_at']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['protocol_number', 'protocol_year']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.protocol_number or 'No Protocol'}"
    
    def can_close(self):
        """Check if act can be closed (survey required)."""
        from django.conf import settings
        if settings.SURVEY_REQUIRED_FOR_ACT_CLOSURE:
            return self.survey_completed
        return True
    
    def get_total_documents(self):
        """Get total number of documents."""
        return self.documents.count()
    
    def get_signed_documents(self):
        """Get number of signed documents."""
        return self.documents.filter(is_signed=True).count()

