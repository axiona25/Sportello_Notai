"""
Models for Act Templates - Template documents for each act type.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ActTemplate(models.Model):
    """
    Template document for a specific type of notarial act.
    Stores the base document that will be used as starting point for new acts.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identificazione tipologia atto
    act_type_code = models.CharField(
        max_length=50,
        help_text='Codice della tipologia atto (es: rogito, donazione, testamento)',
        db_index=True
    )
    act_type_name = models.CharField(
        max_length=200,
        help_text='Nome della tipologia atto'
    )
    
    # Prefisso codice atto (es: ATT-NT per Atto Notarile)
    code_prefix = models.CharField(
        max_length=20,
        help_text='Prefisso per la generazione codici atto (es: ATT-NT, DON, TEST)',
        db_index=True
    )
    
    # Progressivo corrente per questa tipologia
    current_progressive = models.IntegerField(
        default=0,
        help_text='Ultimo numero progressivo utilizzato per questa tipologia'
    )
    
    # File template
    template_file = models.FileField(
        upload_to='templates/acts/%Y/%m/',
        help_text='File template (DOCX, PDF, ODT)'
    )
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    
    # Descrizione e note
    description = models.TextField(
        blank=True,
        help_text='Descrizione del template e quando utilizzarlo'
    )
    usage_notes = models.TextField(
        blank=True,
        help_text='Note tecniche per l\'utilizzo del template'
    )
    
    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text='Se il template è attivo e utilizzabile'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        help_text='Versione del template'
    )
    
    # Audit
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'act_templates'
        verbose_name = 'Act Template'
        verbose_name_plural = 'Act Templates'
        ordering = ['act_type_name', '-created_at']
        indexes = [
            models.Index(fields=['act_type_code', 'is_active']),
            models.Index(fields=['code_prefix']),
        ]
        # Un solo template attivo per tipologia
        constraints = [
            models.UniqueConstraint(
                fields=['act_type_code'],
                condition=models.Q(is_active=True),
                name='unique_active_template_per_act_type'
            )
        ]
    
    def __str__(self):
        return f"{self.act_type_name} - {self.code_prefix} (v{self.version})"
    
    def generate_next_code(self):
        """
        Genera il prossimo codice atto per questa tipologia.
        Es: ATT-NT-0001, ATT-NT-0002, DON-0001, etc.
        """
        self.current_progressive += 1
        self.save(update_fields=['current_progressive', 'updated_at'])
        
        # Formatta con zeri iniziali (4 cifre)
        progressive_str = str(self.current_progressive).zfill(4)
        return f"{self.code_prefix}-{progressive_str}"
    
    def get_current_code(self):
        """Ottiene il codice corrente senza incrementare."""
        progressive_str = str(self.current_progressive).zfill(4)
        return f"{self.code_prefix}-{progressive_str}"
    
    def get_next_preview_code(self):
        """Anteprima del prossimo codice senza incrementare il contatore."""
        next_progressive = self.current_progressive + 1
        progressive_str = str(next_progressive).zfill(4)
        return f"{self.code_prefix}-{progressive_str}"
    
    @classmethod
    def get_active_template_for_act_type(cls, act_type_code):
        """
        Ottiene il template attivo per una tipologia di atto.
        Esegue un match case-insensitive e parziale.
        Es: 'TESTAMENTO_OLOGRAFO' → trova 'testamento'
        """
        if not act_type_code:
            return None
        
        # Normalizza il codice in lowercase
        normalized_code = act_type_code.lower()
        
        # Prima prova match esatto
        try:
            return cls.objects.get(act_type_code__iexact=act_type_code, is_active=True)
        except cls.DoesNotExist:
            pass
        
        # Se non trovato, prova match parziale
        # Cerca tutti i template attivi e fai match parziale
        active_templates = cls.objects.filter(is_active=True)
        for template in active_templates:
            template_code = template.act_type_code.lower()
            # Se il code del template è contenuto nel code richiesto
            # Es: 'testamento' in 'testamento_olografo'
            if template_code in normalized_code:
                return template
        
        return None
    
    @classmethod
    def get_statistics(cls):
        """Statistiche sui template e codici generati."""
        from django.db.models import Sum, Count
        
        stats = cls.objects.filter(is_active=True).aggregate(
            total_templates=Count('id'),
            total_codes_generated=Sum('current_progressive')
        )
        
        by_type = cls.objects.filter(is_active=True).values(
            'act_type_name', 'code_prefix', 'current_progressive'
        ).order_by('-current_progressive')
        
        return {
            'summary': stats,
            'by_type': list(by_type)
        }


# Mappatura predefinita prefissi codice per tipologie atto
ACT_CODE_PREFIXES = {
    'rogito': 'ATT-NT',          # Atto Notarile
    'consulenza': 'CONS',         # Consulenza
    'revisione': 'REV',           # Revisione
    'firma': 'FIRM',              # Firma Digitale
    'procura': 'PROC',            # Procura
    'testamento': 'TST',          # Testamento
    'donazione': 'DON',           # Donazione
    'mutuo': 'MUT',               # Mutuo
    'costituzione': 'COST-SOC',   # Costituzione Società
    'certificazione': 'CERT',     # Certificazione
    'vidimazione': 'VID',         # Vidimazione
    'altro': 'ALTRO',             # Altro
}


def get_or_create_template(act_type_code, act_type_name, created_by):
    """
    Ottiene o crea un template per una tipologia di atto.
    Utility function per inizializzare template se non esistono.
    """
    code_prefix = ACT_CODE_PREFIXES.get(act_type_code, 'ATT')
    
    template, created = ActTemplate.objects.get_or_create(
        act_type_code=act_type_code,
        is_active=True,
        defaults={
            'act_type_name': act_type_name,
            'code_prefix': code_prefix,
            'current_progressive': 0,
            'created_by': created_by,
            'original_filename': f'template_{act_type_code}.docx',
            'mime_type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'file_size': 0,
        }
    )
    
    return template, created

