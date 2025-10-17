"""
Models for notarial acts.
"""
import uuid
from django.db import models
from notaries.models import Notary, Client


class NotarialActMainCategory(models.Model):
    """Main categories of notarial acts (Repubblica di San Marino)."""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0, help_text='Display order')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notarial_act_main_categories'
        verbose_name = 'Main Category'
        verbose_name_plural = 'Main Categories'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class NotarialActCategory(models.Model):
    """Specific categories of notarial acts (Repubblica di San Marino)."""
    
    id = models.AutoField(primary_key=True)
    main_category = models.ForeignKey(
        NotarialActMainCategory, 
        on_delete=models.CASCADE, 
        related_name='subcategories'
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0, help_text='Display order within main category')
    is_active = models.BooleanField(default=True)
    
    # Campi aggiuntivi per configurazione
    requires_property = models.BooleanField(default=False, help_text='Requires property data')
    requires_bank = models.BooleanField(default=False, help_text='Requires bank data')
    requires_parties = models.BooleanField(default=True, help_text='Requires parties data')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notarial_act_categories'
        verbose_name = 'Notarial Act Category'
        verbose_name_plural = 'Notarial Act Categories'
        ordering = ['main_category__order', 'order', 'name']
        unique_together = [['main_category', 'name']]
    
    def __str__(self):
        return f"{self.main_category.name} - {self.name}"


class ActCategory(models.TextChoices):
    """Categories of notarial acts (legacy - kept for compatibility)."""
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


class DocumentType(models.Model):
    """Types of documents required for notarial acts."""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Categorizzazione
    category = models.CharField(
        max_length=50,
        choices=[
            ('identita', 'Documenti di Identità'),
            ('immobile', 'Documenti Immobile'),
            ('fiscale', 'Documenti Fiscali'),
            ('stato_civile', 'Stato Civile'),
            ('societario', 'Documenti Societari'),
            ('finanziario', 'Documenti Finanziari'),
            ('tecnico', 'Documenti Tecnici'),
            ('altro', 'Altro'),
        ],
        default='altro'
    )
    
    # Chi deve fornirlo
    required_from = models.CharField(
        max_length=50,
        choices=[
            ('cliente', 'Cliente'),
            ('venditore', 'Venditore'),
            ('acquirente', 'Acquirente'),
            ('entrambi', 'Entrambe le parti'),
            ('banca', 'Banca'),
            ('professionista', 'Professionista'),
            ('PA', 'Pubblica Amministrazione'),
        ],
        default='cliente'
    )
    
    # Flag
    is_mandatory = models.BooleanField(default=True, help_text='Se obbligatorio o facoltativo')
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'document_types'
        verbose_name = 'Document Type'
        verbose_name_plural = 'Document Types'
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class NotarialActCategoryDocument(models.Model):
    """Relation between notarial act categories and required documents."""
    
    id = models.AutoField(primary_key=True)
    act_category = models.ForeignKey(
        NotarialActCategory,
        on_delete=models.CASCADE,
        related_name='required_documents'
    )
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name='act_categories'
    )
    
    # Dettagli specifici per questa relazione
    is_mandatory = models.BooleanField(default=True, help_text='Se il documento è obbligatorio per questo atto')
    notes = models.TextField(blank=True, help_text='Note specifiche per questo documento in questo atto')
    order = models.IntegerField(default=0, help_text='Ordine di visualizzazione')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notarial_act_category_documents'
        verbose_name = 'Act Category Document'
        verbose_name_plural = 'Act Category Documents'
        unique_together = [['act_category', 'document_type']]
        ordering = ['order', 'document_type__name']
    
    def __str__(self):
        return f"{self.act_category.name} - {self.document_type.name}"

