"""
Models for appointments management.
Sistema di gestione appuntamenti con agende condivise tra Clienti, Notai e Partners.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from accounts.models import Cliente, Notaio, Partner
from acts.models import Act

# Import Notary per unificazione
# NOTA: stiamo migrando da Notaio (accounts) a Notary (notaries)
try:
    from notaries.models import Notary
except ImportError:
    Notary = None  # Compatibilità durante le migrations


class AppointmentStatus(models.TextChoices):
    """Appointment status choices - Flusso completo."""
    # Stati iniziali
    PROVVISORIO = 'provvisorio', 'Provvisorio'  # Cliente ha prenotato, attende conferma notaio
    RICHIESTO = 'richiesto', 'Richiesto'  # Alias per PROVVISORIO (backward compatibility)
    
    # Conferma notaio
    CONFERMATO = 'confermato', 'Confermato'  # Notaio ha confermato
    RIFIUTATO = 'rifiutato', 'Rifiutato'  # Notaio ha rifiutato
    
    # Gestione documenti
    DOCUMENTI_IN_CARICAMENTO = 'documenti_in_caricamento', 'Documenti in Caricamento'  # Cliente sta caricando
    DOCUMENTI_IN_VERIFICA = 'documenti_in_verifica', 'Documenti in Verifica'  # Notaio/Staff verificano
    DOCUMENTI_PARZIALI = 'documenti_parziali', 'Documenti Parzialmente Accettati'  # Alcuni rifiutati
    DOCUMENTI_VERIFICATI = 'documenti_verificati', 'Documenti Verificati'  # Tutti i documenti OK
    
    # Atto virtuale
    PRONTO_ATTO_VIRTUALE = 'pronto_atto_virtuale', 'Pronto per Atto Virtuale'  # Abilitato per atto virtuale
    IN_CORSO = 'in_corso', 'In Corso'  # Appuntamento in svolgimento
    
    # Stati finali
    COMPLETATO = 'completato', 'Completato'
    ANNULLATO = 'annullato', 'Annullato'
    
    # Backward compatibility
    APPROVATO = 'approvato', 'Approvato'  # Alias per CONFERMATO


class AppointmentType(models.TextChoices):
    """Tipo di appuntamento."""
    CONSULENZA = 'consulenza', 'Consulenza'
    FIRMA_ATTO = 'firma_atto', 'Firma Atto'
    SOPRALLUOGO = 'sopralluogo', 'Sopralluogo'
    INCONTRO_PREPARATORIO = 'incontro_preparatorio', 'Incontro Preparatorio'
    ALTRO = 'altro', 'Altro'


class ParticipantRole(models.TextChoices):
    """Ruolo del partecipante nell'appuntamento."""
    ORGANIZZATORE = 'organizzatore', 'Organizzatore'
    RICHIEDENTE = 'richiedente', 'Richiedente'
    INVITATO = 'invitato', 'Invitato'
    OPZIONALE = 'opzionale', 'Opzionale'


class ParticipantStatus(models.TextChoices):
    """Stato di partecipazione."""
    IN_ATTESA = 'in_attesa', 'In Attesa'
    ACCETTATO = 'accettato', 'Accettato'
    RIFIUTATO = 'rifiutato', 'Rifiutato'
    FORSE = 'forse', 'Forse'


class GiornoSettimana(models.TextChoices):
    """Giorni della settimana."""
    LUNEDI = 'lunedi', 'Lunedì'
    MARTEDI = 'martedi', 'Martedì'
    MERCOLEDI = 'mercoledi', 'Mercoledì'
    GIOVEDI = 'giovedi', 'Giovedì'
    VENERDI = 'venerdi', 'Venerdì'
    SABATO = 'sabato', 'Sabato'
    DOMENICA = 'domenica', 'Domenica'


# ============================================
# DISPONIBILITÀ NOTAIO
# ============================================

class DisponibilitaNotaio(models.Model):
    """
    Definisce gli slot disponibili del notaio per la prenotazione.
    Es: Lunedì 9:00-13:00, Martedì 14:00-18:00
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # NUOVO: Campo unificato che punta a Notary
    notary = models.ForeignKey(
        'notaries.Notary',
        on_delete=models.CASCADE,
        related_name='disponibilita',
        null=True,  # Temporaneo per la migrazione
        blank=True
    )
    
    # DEPRECATO: Mantenuto temporaneamente per compatibilità
    notaio = models.ForeignKey(
        Notaio,
        on_delete=models.CASCADE,
        related_name='disponibilita_old',
        null=True,  # Ora opzionale
        blank=True
    )
    
    # Giorni e orari
    giorno_settimana = models.CharField(
        max_length=20,
        choices=GiornoSettimana.choices
    )
    ora_inizio = models.TimeField()
    ora_fine = models.TimeField()
    
    # Periodo validità
    data_inizio_validita = models.DateField(
        help_text="Da quando è valida questa disponibilità"
    )
    data_fine_validita = models.DateField(
        blank=True,
        null=True,
        help_text="Fino a quando è valida (null = infinito)"
    )
    
    # Durata slot
    durata_slot_minuti = models.IntegerField(
        default=30,
        help_text="Durata di ogni slot prenotabile in minuti"
    )
    
    # Configurazione
    is_active = models.BooleanField(default=True)
    permetti_prenotazioni_online = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'disponibilita_notaio'
        verbose_name = 'Disponibilità Notaio'
        verbose_name_plural = 'Disponibilità Notai'
        ordering = ['giorno_settimana', 'ora_inizio']
        unique_together = ['notaio', 'giorno_settimana', 'ora_inizio', 'data_inizio_validita']
    
    def __str__(self):
        return f"{self.notaio.nome_completo} - {self.get_giorno_settimana_display()} {self.ora_inizio}-{self.ora_fine}"
    
    def clean(self):
        """Validazione."""
        if self.ora_fine <= self.ora_inizio:
            raise ValidationError("L'ora di fine deve essere dopo l'ora di inizio")
        
        if self.data_fine_validita and self.data_fine_validita < self.data_inizio_validita:
            raise ValidationError("La data di fine validità deve essere dopo la data di inizio")


class EccezioneDisponibilita(models.Model):
    """
    Eccezioni alla disponibilità standard (ferie, chiusure, eventi speciali).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notaio = models.ForeignKey(
        Notaio,
        on_delete=models.CASCADE,
        related_name='eccezioni_disponibilita'
    )
    
    data_inizio = models.DateTimeField()
    data_fine = models.DateTimeField()
    
    motivo = models.CharField(max_length=255)
    descrizione = models.TextField(blank=True)
    
    # Tipo di eccezione
    is_chiusura = models.BooleanField(
        default=True,
        help_text="True = non disponibile, False = disponibilità extra"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'eccezioni_disponibilita'
        verbose_name = 'Eccezione Disponibilità'
        verbose_name_plural = 'Eccezioni Disponibilità'
        ordering = ['data_inizio']
    
    def __str__(self):
        return f"{self.notaio.nome_completo} - {self.motivo} ({self.data_inizio.strftime('%d/%m/%Y')})"
    
    def clean(self):
        if self.data_fine <= self.data_inizio:
            raise ValidationError("La data di fine deve essere dopo la data di inizio")


# ============================================
# APPUNTAMENTO
# ============================================

class Appuntamento(models.Model):
    """
    Appuntamento principale con supporto per partecipanti multipli.
    Gestisce la sincronizzazione delle agende.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # NUOVO: Campo unificato che punta a Notary
    notary = models.ForeignKey(
        'notaries.Notary',
        on_delete=models.CASCADE,
        related_name='appuntamenti_organizzati',
        null=True,  # Temporaneo per la migrazione
        blank=True
    )
    
    # DEPRECATO: Organizzatore (solitamente il Notaio)
    notaio = models.ForeignKey(
        Notaio,
        on_delete=models.CASCADE,
        related_name='appuntamenti_organizzati_old',
        null=True,  # Ora opzionale
        blank=True
    )
    
    # Atto collegato (opzionale)
    act = models.ForeignKey(
        Act,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appuntamenti'
    )
    
    # Tipologia atto richiesta (collega alla categoria atto)
    tipologia_atto = models.ForeignKey(
        'acts.NotarialActCategory',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appuntamenti_richiesti',
        help_text='Tipologia di atto per cui è richiesto l\'appuntamento'
    )
    
    # Stato e tipo
    status = models.CharField(
        max_length=50,  # Aumentato per i nuovi stati più lunghi
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PROVVISORIO
    )
    tipo = models.CharField(
        max_length=30,
        choices=AppointmentType.choices,
        default=AppointmentType.CONSULENZA
    )
    
    # Date e orari
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Dettagli
    titolo = models.CharField(max_length=255)
    descrizione = models.TextField(blank=True)
    
    # Ubicazione
    location = models.CharField(max_length=255, blank=True)
    is_online = models.BooleanField(default=False)
    meeting_url = models.TextField(blank=True)  # link videoconferenza
    
    # Note
    note_notaio = models.TextField(
        blank=True,
        help_text="Note private del notaio"
    )
    note_pubbliche = models.TextField(
        blank=True,
        help_text="Note visibili a tutti i partecipanti"
    )
    
    # Reminder
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)
    invio_reminder_ore_prima = models.IntegerField(
        default=24,
        help_text="Ore prima dell'appuntamento per l'invio del reminder"
    )
    
    # Gestione conferma
    richiede_conferma = models.BooleanField(
        default=True,
        help_text="Se True, il notaio deve approvare la prenotazione"
    )
    confermato_at = models.DateTimeField(blank=True, null=True)
    confermato_da = models.CharField(max_length=255, blank=True)
    
    # Gestione rifiuto
    rifiutato_at = models.DateTimeField(blank=True, null=True)
    rifiutato_da = models.CharField(max_length=255, blank=True)
    motivo_rifiuto = models.TextField(
        blank=True,
        help_text="Motivazione del rifiuto dell'appuntamento"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by_email = models.EmailField(blank=True)
    
    class Meta:
        db_table = 'appuntamenti'
        verbose_name = 'Appuntamento'
        verbose_name_plural = 'Appuntamenti'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['notaio', 'start_time']),
            models.Index(fields=['status', 'start_time']),
            models.Index(fields=['start_time', 'end_time']),
        ]
    
    def __str__(self):
        return f"{self.titolo} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"
    
    def clean(self):
        """Validazione."""
        if self.end_time <= self.start_time:
            raise ValidationError("L'ora di fine deve essere dopo l'ora di inizio")
        
        # Verifica sovrapposizioni per il notaio
        if self.notaio_id:
            conflitti = self.check_conflicts_notaio()
            if conflitti:
                raise ValidationError(
                    f"Il notaio ha già un appuntamento in questo orario: {conflitti[0].titolo}"
                )
    
    def check_conflicts_notaio(self):
        """Verifica conflitti nell'agenda del notaio."""
        conflitti = Appuntamento.objects.filter(
            notaio=self.notaio,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
            status__in=[AppointmentStatus.APPROVATO, AppointmentStatus.CONFERMATO]
        ).exclude(id=self.id)
        
        return list(conflitti)
    
    def is_past(self):
        """Check if appointment is in the past."""
        return self.end_time < timezone.now()
    
    def duration_minutes(self):
        """Get appointment duration in minutes."""
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)
    
    def get_all_participants(self):
        """Ottiene tutti i partecipanti."""
        return self.partecipanti.all()
    
    def get_clienti(self):
        """Ottiene tutti i clienti partecipanti."""
        return self.partecipanti.filter(cliente__isnull=False)
    
    def get_partners(self):
        """Ottiene tutti i partner partecipanti."""
        return self.partecipanti.filter(partner__isnull=False)
    
    def can_be_modified(self):
        """Verifica se l'appuntamento può essere modificato."""
        if self.status in [AppointmentStatus.COMPLETATO, AppointmentStatus.ANNULLATO]:
            return False
        if self.is_past():
            return False
        return True
    
    def approva(self, confermato_da=None):
        """Approva/Conferma l'appuntamento."""
        self.status = AppointmentStatus.CONFERMATO
        self.confermato_at = timezone.now()
        if confermato_da:
            self.confermato_da = confermato_da
        self.save()
    
    def rifiuta(self, motivo=None, rifiutato_da=None):
        """Rifiuta l'appuntamento."""
        self.status = AppointmentStatus.RIFIUTATO
        self.rifiutato_at = timezone.now()
        if motivo:
            self.motivo_rifiuto = motivo
        if rifiutato_da:
            self.rifiutato_da = rifiutato_da
        self.save()
    
    def inizia_caricamento_documenti(self):
        """Passa allo stato di caricamento documenti (dopo conferma)."""
        if self.status == AppointmentStatus.CONFERMATO:
            self.status = AppointmentStatus.DOCUMENTI_IN_CARICAMENTO
            self.save()
            return True
        return False
    
    def verifica_completamento_documenti(self):
        """Verifica se tutti i documenti richiesti sono stati verificati."""
        documenti = self.documenti_appuntamento.all()
        if not documenti.exists():
            return False
        
        # Tutti i documenti devono essere accettati
        tutti_accettati = all(
            doc.stato == 'accettato' for doc in documenti
        )
        
        if tutti_accettati:
            self.status = AppointmentStatus.DOCUMENTI_VERIFICATI
            self.save()
            return True
        
        # Verifica se ci sono documenti rifiutati
        documenti_rifiutati = documenti.filter(stato='rifiutato').exists()
        if documenti_rifiutati:
            self.status = AppointmentStatus.DOCUMENTI_PARZIALI
            self.save()
        
        return False
    
    def abilita_atto_virtuale(self):
        """Abilita l'accesso all'atto virtuale."""
        if self.status == AppointmentStatus.DOCUMENTI_VERIFICATI:
            self.status = AppointmentStatus.PRONTO_ATTO_VIRTUALE
            self.save()
            return True
        return False
    
    def send_reminder(self):
        """Send appointment reminder."""
        # TODO: Implementare invio reminder via email/notifica
        self.reminder_sent = True
        self.reminder_sent_at = timezone.now()
        self.save()


# ============================================
# PARTECIPANTI APPUNTAMENTO
# ============================================

class PartecipanteAppuntamento(models.Model):
    """
    Gestisce i partecipanti all'appuntamento (Clienti e Partners).
    Permette di sincronizzare le agende di tutti i partecipanti.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    appuntamento = models.ForeignKey(
        Appuntamento,
        on_delete=models.CASCADE,
        related_name='partecipanti'
    )
    
    # Partecipante (uno dei tre)
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='appuntamenti_partecipati',
        blank=True,
        null=True
    )
    partner = models.ForeignKey(
        Partner,
        on_delete=models.CASCADE,
        related_name='appuntamenti_partecipati',
        blank=True,
        null=True
    )
    
    # Ruolo e stato
    ruolo = models.CharField(
        max_length=20,
        choices=ParticipantRole.choices,
        default=ParticipantRole.INVITATO
    )
    status = models.CharField(
        max_length=20,
        choices=ParticipantStatus.choices,
        default=ParticipantStatus.IN_ATTESA
    )
    
    # Notifiche
    notificato = models.BooleanField(default=False)
    notificato_at = models.DateTimeField(blank=True, null=True)
    
    # Risposta
    risposta_at = models.DateTimeField(blank=True, null=True)
    note_partecipante = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'partecipanti_appuntamento'
        verbose_name = 'Partecipante Appuntamento'
        verbose_name_plural = 'Partecipanti Appuntamenti'
        ordering = ['created_at']
        # Un partecipante può essere aggiunto una sola volta per appuntamento
        unique_together = [
            ['appuntamento', 'cliente'],
            ['appuntamento', 'partner'],
        ]
    
    def __str__(self):
        nome = self.get_nome_partecipante()
        return f"{nome} - {self.appuntamento.titolo}"
    
    def clean(self):
        """Validazione: deve essere specificato o cliente o partner."""
        if not self.cliente and not self.partner:
            raise ValidationError("Deve essere specificato un cliente o un partner")
        
        if self.cliente and self.partner:
            raise ValidationError("Specificare solo un tipo di partecipante")
        
        # Verifica conflitti nella agenda del partecipante
        if self.status == ParticipantStatus.ACCETTATO:
            conflitti = self.check_conflicts()
            if conflitti:
                raise ValidationError(
                    f"Il partecipante ha già un appuntamento in questo orario"
                )
    
    def get_nome_partecipante(self):
        """Ottiene il nome del partecipante."""
        if self.cliente:
            return self.cliente.nome_completo
        elif self.partner:
            return self.partner.ragione_sociale
        return "Sconosciuto"
    
    def get_tipo_partecipante(self):
        """Ottiene il tipo di partecipante."""
        if self.cliente:
            return "cliente"
        elif self.partner:
            return "partner"
        return None
    
    def check_conflicts(self):
        """Verifica conflitti nell'agenda del partecipante."""
        if self.cliente:
            conflitti = PartecipanteAppuntamento.objects.filter(
                cliente=self.cliente,
                appuntamento__start_time__lt=self.appuntamento.end_time,
                appuntamento__end_time__gt=self.appuntamento.start_time,
                appuntamento__status__in=[AppointmentStatus.APPROVATO, AppointmentStatus.CONFERMATO],
                status=ParticipantStatus.ACCETTATO
            ).exclude(id=self.id)
        elif self.partner:
            conflitti = PartecipanteAppuntamento.objects.filter(
                partner=self.partner,
                appuntamento__start_time__lt=self.appuntamento.end_time,
                appuntamento__end_time__gt=self.appuntamento.start_time,
                appuntamento__status__in=[AppointmentStatus.APPROVATO, AppointmentStatus.CONFERMATO],
                status=ParticipantStatus.ACCETTATO
            ).exclude(id=self.id)
        else:
            return []
        
        return list(conflitti)
    
    def accetta(self, note=None):
        """Accetta l'invito all'appuntamento."""
        self.status = ParticipantStatus.ACCETTATO
        self.risposta_at = timezone.now()
        if note:
            self.note_partecipante = note
        self.save()
    
    def rifiuta(self, note=None):
        """Rifiuta l'invito all'appuntamento."""
        self.status = ParticipantStatus.RIFIUTATO
        self.risposta_at = timezone.now()
        if note:
            self.note_partecipante = note
        self.save()


# ============================================
# DOCUMENTI APPUNTAMENTO
# ============================================

class DocumentoStato(models.TextChoices):
    """Stati del documento dell'appuntamento."""
    DA_CARICARE = 'da_caricare', 'Da Caricare'
    CARICATO = 'caricato', 'Caricato'
    IN_VERIFICA = 'in_verifica', 'In Verifica'
    ACCETTATO = 'accettato', 'Accettato'
    RIFIUTATO = 'rifiutato', 'Rifiutato'


class DocumentoAppuntamento(models.Model):
    """
    Gestisce i documenti richiesti per un appuntamento.
    Ogni documento è collegato a un DocumentType della tipologia atto.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    appuntamento = models.ForeignKey(
        Appuntamento,
        on_delete=models.CASCADE,
        related_name='documenti_appuntamento'
    )
    
    document_type = models.ForeignKey(
        'acts.DocumentType',
        on_delete=models.CASCADE,
        related_name='documenti_appuntamenti',
        help_text='Tipo di documento richiesto'
    )
    
    # File caricato
    file = models.FileField(
        upload_to='appuntamenti/documenti/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='File del documento caricato dal cliente'
    )
    
    # Stato del documento
    stato = models.CharField(
        max_length=20,
        choices=DocumentoStato.choices,
        default=DocumentoStato.DA_CARICARE
    )
    
    # Obbligatorietà (dal DocumentType o personalizzato)
    is_obbligatorio = models.BooleanField(
        default=True,
        help_text='Se il documento è obbligatorio per questo appuntamento'
    )
    
    # Caricamento
    caricato_da = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='documenti_caricati'
    )
    caricato_at = models.DateTimeField(blank=True, null=True)
    
    # Verifica
    verificato_da = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='documenti_verificati'
    )
    verificato_at = models.DateTimeField(blank=True, null=True)
    
    # Note
    note_rifiuto = models.TextField(
        blank=True,
        help_text='Motivazione del rifiuto del documento'
    )
    note_interne = models.TextField(
        blank=True,
        help_text='Note visibili solo al notaio/staff'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'documenti_appuntamento'
        verbose_name = 'Documento Appuntamento'
        verbose_name_plural = 'Documenti Appuntamento'
        ordering = ['document_type__category', 'document_type__name']
        unique_together = [['appuntamento', 'document_type']]
    
    def __str__(self):
        return f"{self.document_type.name} - {self.appuntamento.titolo}"
    
    def carica(self, file, caricato_da):
        """Carica il documento."""
        self.file = file
        self.stato = DocumentoStato.CARICATO
        self.caricato_da = caricato_da
        self.caricato_at = timezone.now()
        self.save()
        
        # Aggiorna stato appuntamento se necessario
        if self.appuntamento.status == AppointmentStatus.CONFERMATO:
            self.appuntamento.inizia_caricamento_documenti()
    
    def metti_in_verifica(self):
        """Mette il documento in verifica."""
        if self.stato == DocumentoStato.CARICATO:
            self.stato = DocumentoStato.IN_VERIFICA
            self.save()
            
            # Aggiorna stato appuntamento
            if self.appuntamento.status == AppointmentStatus.DOCUMENTI_IN_CARICAMENTO:
                self.appuntamento.status = AppointmentStatus.DOCUMENTI_IN_VERIFICA
                self.appuntamento.save()
    
    def accetta(self, verificato_da, note_interne=None):
        """Accetta il documento."""
        self.stato = DocumentoStato.ACCETTATO
        self.verificato_da = verificato_da
        self.verificato_at = timezone.now()
        if note_interne:
            self.note_interne = note_interne
        self.save()
        
        # Verifica se tutti i documenti sono stati verificati
        self.appuntamento.verifica_completamento_documenti()
    
    def rifiuta(self, verificato_da, motivo):
        """Rifiuta il documento."""
        self.stato = DocumentoStato.RIFIUTATO
        self.verificato_da = verificato_da
        self.verificato_at = timezone.now()
        self.note_rifiuto = motivo
        self.save()
        
        # Aggiorna stato appuntamento
        self.appuntamento.verifica_completamento_documenti()


# ============================================
# NOTIFICHE
# ============================================

class NotificaTipo(models.TextChoices):
    """Tipi di notifica."""
    # Appuntamenti
    APPUNTAMENTO_RICHIESTO = 'appuntamento_richiesto', 'Nuova Richiesta Appuntamento'
    APPUNTAMENTO_CONFERMATO = 'appuntamento_confermato', 'Appuntamento Confermato'
    APPUNTAMENTO_RIFIUTATO = 'appuntamento_rifiutato', 'Appuntamento Rifiutato'
    APPUNTAMENTO_MODIFICATO = 'appuntamento_modificato', 'Appuntamento Modificato'
    APPUNTAMENTO_ANNULLATO = 'appuntamento_annullato', 'Appuntamento Annullato'
    APPUNTAMENTO_REMINDER = 'appuntamento_reminder', 'Reminder Appuntamento'
    
    # Documenti
    DOCUMENTI_DA_CARICARE = 'documenti_da_caricare', 'Documenti da Caricare'
    DOCUMENTO_CARICATO = 'documento_caricato', 'Nuovo Documento Caricato'
    DOCUMENTO_ACCETTATO = 'documento_accettato', 'Documento Accettato'
    DOCUMENTO_RIFIUTATO = 'documento_rifiutato', 'Documento Rifiutato'
    DOCUMENTI_VERIFICATI = 'documenti_verificati', 'Tutti i Documenti Verificati'
    
    # Atto virtuale
    ATTO_VIRTUALE_DISPONIBILE = 'atto_virtuale_disponibile', 'Atto Virtuale Disponibile'
    
    # Atti
    ATTO_CREATO = 'atto_creato', 'Nuovo Atto Creato'
    ATTO_FIRMATO = 'atto_firmato', 'Atto Firmato'
    ATTO_COMPLETATO = 'atto_completato', 'Atto Completato'
    
    # Sistema
    MESSAGGIO_SISTEMA = 'messaggio_sistema', 'Messaggio di Sistema'
    ALTRO = 'altro', 'Altro'


class Notifica(models.Model):
    """
    Sistema di notifiche per gli utenti.
    Gestisce notifiche in-app per tutti gli eventi del sistema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Destinatario
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifiche'
    )
    
    # Tipo e contenuto
    tipo = models.CharField(
        max_length=50,
        choices=NotificaTipo.choices,
        default=NotificaTipo.ALTRO
    )
    titolo = models.CharField(max_length=255)
    messaggio = models.TextField()
    
    # Link/Riferimenti
    link_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='URL a cui reindirizzare quando si clicca la notifica'
    )
    
    # Riferimenti opzionali
    appuntamento = models.ForeignKey(
        Appuntamento,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='notifiche'
    )
    atto = models.ForeignKey(
        Act,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='notifiche'
    )
    
    # Stato
    letta = models.BooleanField(default=False)
    letta_at = models.DateTimeField(blank=True, null=True)
    
    # Invio email
    invia_email = models.BooleanField(
        default=False,
        help_text='Se True, invia anche una email'
    )
    email_inviata = models.BooleanField(default=False)
    email_inviata_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifiche'
        verbose_name = 'Notifica'
        verbose_name_plural = 'Notifiche'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'letta', '-created_at']),
            models.Index(fields=['tipo', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.titolo} - {self.user.email}"
    
    def segna_come_letta(self):
        """Segna la notifica come letta."""
        if not self.letta:
            self.letta = True
            self.letta_at = timezone.now()
            self.save()
    
    def segna_email_inviata(self):
        """Segna l'email come inviata."""
        if not self.email_inviata:
            self.email_inviata = True
            self.email_inviata_at = timezone.now()
            self.save()
    
    @classmethod
    def crea_notifica(cls, user, tipo, titolo, messaggio, **kwargs):
        """
        Helper method per creare una notifica.
        
        Args:
            user: Utente destinatario
            tipo: Tipo di notifica (NotificaTipo)
            titolo: Titolo della notifica
            messaggio: Messaggio della notifica
            **kwargs: Altri campi opzionali (link_url, appuntamento, atto, invia_email)
        """
        notifica = cls.objects.create(
            user=user,
            tipo=tipo,
            titolo=titolo,
            messaggio=messaggio,
            link_url=kwargs.get('link_url', ''),
            appuntamento=kwargs.get('appuntamento'),
            atto=kwargs.get('atto'),
            invia_email=kwargs.get('invia_email', False)
        )
        return notifica

