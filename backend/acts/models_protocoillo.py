"""
Modello per il Registro Protocolli Atti Notarili.
Ogni atto firmato viene registrato con numero progressivo per tipologia.
"""
import uuid
from django.db import models
from django.utils import timezone
from appointments.models import Appuntamento
from notaries.models import Notary
from .models_templates import ActTemplate


class ProtocolloAttoNotarile(models.Model):
    """
    Registro protocolli per atti notarili.
    Ogni atto viene registrato con numero progressivo per tipologia.
    """
    
    STATO_CHOICES = [
        ('bozza', 'Bozza'),
        ('in_lavorazione', 'In Lavorazione'),
        ('pronto_firma', 'Pronto per Firma'),
        ('firmato', 'Firmato'),
        ('protocollato', 'Protocollato'),
        ('annullato', 'Annullato'),
    ]
    
    # Identificativi
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_protocollo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Numero protocollo completo (es: TEST-0001)"
    )
    
    # Relazioni
    appuntamento = models.OneToOneField(
        Appuntamento,
        on_delete=models.PROTECT,
        related_name='protocollo_atto',
        help_text="Appuntamento collegato a questo atto"
    )
    template = models.ForeignKey(
        ActTemplate,
        on_delete=models.PROTECT,
        related_name='protocolli_generati',
        help_text="Template utilizzato per questo atto"
    )
    notaio = models.ForeignKey(
        Notary,
        on_delete=models.PROTECT,
        related_name='atti_protocollati',
        help_text="Notaio responsabile dell'atto"
    )
    
    # Dati atto
    tipologia_atto_code = models.CharField(max_length=100, db_index=True)
    tipologia_atto_nome = models.CharField(max_length=200)
    code_prefix = models.CharField(max_length=20, help_text="Prefisso codice (es: TEST)")
    progressivo = models.IntegerField(help_text="Numero progressivo per questa tipologia")
    
    # Parti coinvolte
    parti_coinvolte = models.JSONField(
        default=dict,
        help_text="Dati delle parti (cliente, eventuali altre parti)"
    )
    
    # Documenti
    documento_finale_url = models.FileField(
        upload_to='atti_protocollati/%Y/%m/',
        null=True,
        blank=True,
        help_text="Documento finale firmato"
    )
    
    # Date e stato
    stato = models.CharField(
        max_length=20,
        choices=STATO_CHOICES,
        default='bozza',
        db_index=True
    )
    data_creazione = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Data e ora di creazione (data certa)"
    )
    data_firma = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Data e ora della firma digitale"
    )
    data_protocollo = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Data e ora di protocollazione definitiva"
    )
    data_annullamento = models.DateTimeField(null=True, blank=True)
    motivo_annullamento = models.TextField(blank=True)
    
    # Metadati
    note = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict,
        help_text="Metadati aggiuntivi (importo, immobili, ecc.)"
    )
    
    # Audit
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='protocolli_creati'
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'acts_protocollo_atto_notarile'
        ordering = ['-data_creazione']
        verbose_name = 'Protocollo Atto Notarile'
        verbose_name_plural = 'Protocolli Atti Notarili'
        indexes = [
            models.Index(fields=['tipologia_atto_code', '-progressivo']),
            models.Index(fields=['notaio', '-data_creazione']),
            models.Index(fields=['stato', '-data_creazione']),
            models.Index(fields=['-data_protocollo']),
        ]
    
    def __str__(self):
        return f"{self.numero_protocollo} - {self.tipologia_atto_nome}"
    
    @classmethod
    def genera_protocollo_da_appuntamento(cls, appuntamento, created_by=None):
        """
        Genera un nuovo protocollo per un appuntamento.
        Utilizza il template per ottenere il prossimo numero progressivo.
        """
        from django.db import transaction
        
        # Verifica che non esista già un protocollo per questo appuntamento
        if hasattr(appuntamento, 'protocollo_atto'):
            raise ValueError(f"Protocollo già esistente per appuntamento {appuntamento.id}")
        
        # Ottieni il template per questa tipologia
        tipologia_code = appuntamento.tipologia_atto.code
        template = ActTemplate.get_active_template_for_act_type(tipologia_code)
        
        if not template:
            raise ValueError(f"Nessun template trovato per tipologia: {tipologia_code}")
        
        with transaction.atomic():
            # Genera il prossimo numero protocollo
            numero_protocollo = template.generate_next_code()
            
            # Raccogli dati parti coinvolte
            parti_coinvolte = {
                'cliente': {
                    'id': str(appuntamento.client.id) if appuntamento.client else None,
                    'nome': appuntamento.client_name or 'N/A',
                    'email': appuntamento.created_by_email or 'N/A',
                },
                'data_appuntamento': appuntamento.start_time.isoformat() if appuntamento.start_time else None,
            }
            
            # Crea il protocollo
            protocollo = cls.objects.create(
                numero_protocollo=numero_protocollo,
                appuntamento=appuntamento,
                template=template,
                notaio=appuntamento.notaio,
                tipologia_atto_code=template.act_type_code,
                tipologia_atto_nome=template.act_type_name,
                code_prefix=template.code_prefix,
                progressivo=template.current_progressive,
                parti_coinvolte=parti_coinvolte,
                stato='bozza',
                created_by=created_by,
            )
            
            return protocollo
    
    def firma_atto(self, documento_firmato=None):
        """Registra la firma dell'atto."""
        if self.stato == 'annullato':
            raise ValueError("Impossibile firmare un atto annullato")
        
        self.stato = 'firmato'
        self.data_firma = timezone.now()
        if documento_firmato:
            self.documento_finale_url = documento_firmato
        self.save(update_fields=['stato', 'data_firma', 'documento_finale_url', 'updated_at'])
    
    def protocolla_atto(self):
        """Protocolla definitivamente l'atto."""
        if self.stato != 'firmato':
            raise ValueError("L'atto deve essere firmato prima di essere protocollato")
        
        self.stato = 'protocollato'
        self.data_protocollo = timezone.now()
        self.save(update_fields=['stato', 'data_protocollo', 'updated_at'])
    
    def annulla_atto(self, motivo, user=None):
        """Annulla l'atto."""
        if self.stato == 'protocollato':
            raise ValueError("Impossibile annullare un atto già protocollato")
        
        self.stato = 'annullato'
        self.data_annullamento = timezone.now()
        self.motivo_annullamento = motivo
        self.save(update_fields=['stato', 'data_annullamento', 'motivo_annullamento', 'updated_at'])
    
    @property
    def e_protocollato(self):
        """Verifica se l'atto è protocollato."""
        return self.stato == 'protocollato'
    
    @property
    def e_firmato(self):
        """Verifica se l'atto è firmato."""
        return self.stato in ['firmato', 'protocollato']
    
    @classmethod
    def get_statistiche_per_notaio(cls, notaio, anno=None):
        """Statistiche protocolli per notaio."""
        qs = cls.objects.filter(notaio=notaio)
        
        if anno:
            qs = qs.filter(data_creazione__year=anno)
        
        from django.db.models import Count, Q
        
        stats = qs.aggregate(
            totale=Count('id'),
            bozze=Count('id', filter=Q(stato='bozza')),
            firmati=Count('id', filter=Q(stato='firmato')),
            protocollati=Count('id', filter=Q(stato='protocollato')),
            annullati=Count('id', filter=Q(stato='annullato')),
        )
        
        # Statistiche per tipologia
        per_tipologia = qs.values('tipologia_atto_code', 'tipologia_atto_nome').annotate(
            totale=Count('id')
        ).order_by('-totale')
        
        return {
            'totale': stats,
            'per_tipologia': list(per_tipologia),
        }

