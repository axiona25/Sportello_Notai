"""
Serializers per la gestione degli appuntamenti e agende condivise.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, timedelta

from .models import (
    Appuntamento, DisponibilitaNotaio, EccezioneDisponibilita,
    PartecipanteAppuntamento, AppointmentStatus, ParticipantStatus,
    DocumentoAppuntamento, DocumentoStato, Notifica, NotificaTipo
)
from accounts.models import Notaio, Cliente, Partner, User
from accounts.serializers import ClienteSerializer, NotaioSerializer, PartnerSerializer
from acts.models import DocumentType, NotarialActCategory
from .services import DisponibilitaService, AppuntamentoService


# ============================================
# DISPONIBILITÀ NOTAIO
# ============================================

class DisponibilitaNotaioSerializer(serializers.ModelSerializer):
    """Serializer per la disponibilità del notaio."""
    
    notaio_nome = serializers.CharField(source='notaio.nome_completo', read_only=True)
    giorno_display = serializers.CharField(source='get_giorno_settimana_display', read_only=True)
    
    class Meta:
        model = DisponibilitaNotaio
        fields = [
            'id', 'notaio', 'notaio_nome',
            'giorno_settimana', 'giorno_display',
            'ora_inizio', 'ora_fine',
            'data_inizio_validita', 'data_fine_validita',
            'durata_slot_minuti',
            'is_active', 'permetti_prenotazioni_online',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EccezioneDisponibilitaSerializer(serializers.ModelSerializer):
    """Serializer per le eccezioni alla disponibilità."""
    
    notaio_nome = serializers.CharField(source='notaio.nome_completo', read_only=True)
    
    class Meta:
        model = EccezioneDisponibilita
        fields = [
            'id', 'notaio', 'notaio_nome',
            'data_inizio', 'data_fine',
            'motivo', 'descrizione',
            'is_chiusura',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SlotDisponibileSerializer(serializers.Serializer):
    """Serializer per uno slot disponibile (wizard cliente)."""
    
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField()
    notaio_id = serializers.UUIDField()
    notaio_nome = serializers.CharField()


class RichiestaSlotDisponibiliSerializer(serializers.Serializer):
    """Serializer per richiedere gli slot disponibili di un notaio."""
    
    notaio_id = serializers.UUIDField()
    data_inizio = serializers.DateField()
    data_fine = serializers.DateField(required=False)
    durata_minuti = serializers.IntegerField(default=60, min_value=15, max_value=480)
    
    def validate(self, data):
        """Validazione."""
        # Se non specificata, data_fine = data_inizio + 14 giorni
        if 'data_fine' not in data or not data['data_fine']:
            data['data_fine'] = data['data_inizio'] + timedelta(days=14)
        
        # Verifica che data_fine sia dopo data_inizio
        if data['data_fine'] < data['data_inizio']:
            raise serializers.ValidationError("data_fine deve essere dopo data_inizio")
        
        # Limite massimo 60 giorni
        if (data['data_fine'] - data['data_inizio']).days > 60:
            raise serializers.ValidationError("Il periodo massimo è di 60 giorni")
        
        # Verifica che il notaio esista
        try:
            notaio = Notaio.objects.get(id=data['notaio_id'])
            data['notaio'] = notaio
        except Notaio.DoesNotExist:
            raise serializers.ValidationError("Notaio non trovato")
        
        return data


# ============================================
# PARTECIPANTI APPUNTAMENTO
# ============================================

class PartecipanteAppuntamentoSerializer(serializers.ModelSerializer):
    """Serializer per i partecipanti all'appuntamento."""
    
    nome_partecipante = serializers.CharField(source='get_nome_partecipante', read_only=True)
    tipo_partecipante = serializers.CharField(source='get_tipo_partecipante', read_only=True)
    ruolo_display = serializers.CharField(source='get_ruolo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Dati dettagliati partecipante
    cliente_dettagli = ClienteSerializer(source='cliente', read_only=True)
    partner_dettagli = PartnerSerializer(source='partner', read_only=True)
    
    class Meta:
        model = PartecipanteAppuntamento
        fields = [
            'id', 'appuntamento',
            'cliente', 'partner',
            'nome_partecipante', 'tipo_partecipante',
            'ruolo', 'ruolo_display',
            'status', 'status_display',
            'notificato', 'notificato_at',
            'risposta_at', 'note_partecipante',
            'cliente_dettagli', 'partner_dettagli',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'nome_partecipante', 'tipo_partecipante',
            'notificato', 'notificato_at', 'risposta_at',
            'created_at', 'updated_at'
        ]


class InvitoPartnerSerializer(serializers.Serializer):
    """Serializer per invitare partners all'appuntamento."""
    
    partner_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    ruolo = serializers.ChoiceField(
        choices=['invitato', 'opzionale'],
        default='invitato'
    )
    
    def validate_partner_ids(self, value):
        """Verifica che i partner esistano."""
        partners = Partner.objects.filter(id__in=value)
        if partners.count() != len(value):
            raise serializers.ValidationError("Uno o più partner non trovati")
        return value


class RispostaInvitoSerializer(serializers.Serializer):
    """Serializer per rispondere a un invito (accetta/rifiuta)."""
    
    accetta = serializers.BooleanField()
    note = serializers.CharField(required=False, allow_blank=True)


# ============================================
# APPUNTAMENTO
# ============================================

class AppuntamentoSerializer(serializers.ModelSerializer):
    """Serializer completo per l'appuntamento."""
    
    notaio_nome = serializers.CharField(source='notaio.nome_completo', read_only=True)
    notaio_dettagli = NotaioSerializer(source='notaio', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    # Partecipanti
    partecipanti = PartecipanteAppuntamentoSerializer(many=True, read_only=True)
    numero_partecipanti = serializers.SerializerMethodField()
    
    # Info utili
    is_past = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    can_be_modified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Appuntamento
        fields = [
            'id', 'notaio', 'notaio_nome', 'notaio_dettagli',
            'act', 'status', 'status_display', 'tipo', 'tipo_display',
            'start_time', 'end_time',
            'titolo', 'descrizione',
            'location', 'is_online', 'meeting_url',
            'note_notaio', 'note_pubbliche',
            'reminder_sent', 'reminder_sent_at', 'invio_reminder_ore_prima',
            'richiede_conferma', 'confermato_at', 'confermato_da',
            'partecipanti', 'numero_partecipanti',
            'is_past', 'duration_minutes', 'can_be_modified',
            'created_at', 'updated_at', 'created_by_email'
        ]
        read_only_fields = [
            'id', 'status', 'confermato_at', 'confermato_da',
            'reminder_sent', 'reminder_sent_at',
            'created_at', 'updated_at'
        ]
    
    def get_numero_partecipanti(self, obj):
        return obj.partecipanti.count()


class CreaRichiestaAppuntamentoSerializer(serializers.Serializer):
    """
    Serializer per creare una richiesta di appuntamento (dal cliente).
    Questo è quello che usa il wizard modale.
    """
    
    notaio_id = serializers.UUIDField()
    cliente_id = serializers.UUIDField()
    
    # Slot selezionato
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    
    # Dettagli
    titolo = serializers.CharField(max_length=255)
    descrizione = serializers.CharField(required=False, allow_blank=True)
    tipo = serializers.ChoiceField(
        choices=['consulenza', 'firma_atto', 'sopralluogo', 'incontro_preparatorio', 'altro'],
        default='consulenza'
    )
    
    # Ubicazione
    location = serializers.CharField(required=False, allow_blank=True)
    is_online = serializers.BooleanField(default=False)
    
    # Atto collegato (opzionale)
    act_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validazione completa."""
        # Verifica che end_time sia dopo start_time
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError("end_time deve essere dopo start_time")
        
        # Verifica notaio
        try:
            notaio = Notaio.objects.get(id=data['notaio_id'])
            data['notaio'] = notaio
        except Notaio.DoesNotExist:
            raise serializers.ValidationError("Notaio non trovato")
        
        # Verifica cliente
        try:
            cliente = Cliente.objects.get(id=data['cliente_id'])
            data['cliente'] = cliente
        except Cliente.DoesNotExist:
            raise serializers.ValidationError("Cliente non trovato")
        
        # Verifica che lo slot sia disponibile
        if not DisponibilitaService.verifica_slot_disponibile(
            notaio, data['start_time'], data['end_time']
        ):
            raise serializers.ValidationError(
                "Lo slot selezionato non è più disponibile. Ricarica gli slot disponibili."
            )
        
        return data
    
    def create(self, validated_data):
        """Crea la richiesta di appuntamento."""
        notaio = validated_data.pop('notaio')
        cliente = validated_data.pop('cliente')
        notaio_id = validated_data.pop('notaio_id')
        cliente_id = validated_data.pop('cliente_id')
        
        act_id = validated_data.pop('act_id', None)
        act = None
        if act_id:
            from acts.models import Act
            act = Act.objects.filter(id=act_id).first()
        
        appuntamento = AppuntamentoService.crea_richiesta_appuntamento(
            notaio=notaio,
            cliente=cliente,
            start_time=validated_data['start_time'],
            end_time=validated_data['end_time'],
            titolo=validated_data['titolo'],
            descrizione=validated_data.get('descrizione', ''),
            tipo=validated_data['tipo'],
            location=validated_data.get('location', ''),
            is_online=validated_data.get('is_online', False),
            act=act
        )
        
        return appuntamento


class ApprovaRifiutaAppuntamentoSerializer(serializers.Serializer):
    """Serializer per approvare/rifiutare un appuntamento."""
    
    approva = serializers.BooleanField()
    motivo = serializers.CharField(required=False, allow_blank=True)
    confermato_da = serializers.CharField(required=False, allow_blank=True)


class AggiornaAppuntamentoSerializer(serializers.ModelSerializer):
    """Serializer per aggiornare i dettagli di un appuntamento."""
    
    class Meta:
        model = Appuntamento
        fields = [
            'titolo', 'descrizione', 'tipo',
            'location', 'is_online', 'meeting_url',
            'note_notaio', 'note_pubbliche',
            'invio_reminder_ore_prima'
        ]
    
    def update(self, instance, validated_data):
        """Aggiorna solo se l'appuntamento può essere modificato."""
        if not instance.can_be_modified():
            raise serializers.ValidationError(
                "L'appuntamento non può più essere modificato"
            )
        
        return super().update(instance, validated_data)


class AgendaSerializer(serializers.Serializer):
    """Serializer per richiedere l'agenda di un utente."""
    
    data_inizio = serializers.DateTimeField()
    data_fine = serializers.DateTimeField()
    
    def validate(self, data):
        if data['data_fine'] <= data['data_inizio']:
            raise serializers.ValidationError("data_fine deve essere dopo data_inizio")
        
        # Limite massimo 90 giorni
        if (data['data_fine'] - data['data_inizio']).days > 90:
            raise serializers.ValidationError("Il periodo massimo è di 90 giorni")
        
        return data


# ============================================
# DOCUMENTI APPUNTAMENTO
# ============================================

class DocumentTypeSimpleSerializer(serializers.ModelSerializer):
    """Serializer semplice per DocumentType."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    required_from_display = serializers.CharField(source='get_required_from_display', read_only=True)
    
    class Meta:
        model = DocumentType
        fields = [
            'id', 'name', 'code', 'description',
            'category', 'category_display',
            'required_from', 'required_from_display',
            'is_mandatory', 'is_active'
        ]
        read_only_fields = ['id']


class DocumentoAppuntamentoSerializer(serializers.ModelSerializer):
    """Serializer per i documenti dell'appuntamento."""
    document_type = DocumentTypeSimpleSerializer(read_only=True)
    document_type_id = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all(),
        source='document_type',
        write_only=True
    )
    caricato_da_email = serializers.EmailField(source='caricato_da.email', read_only=True)
    verificato_da_email = serializers.EmailField(source='verificato_da.email', read_only=True)
    stato_display = serializers.CharField(source='get_stato_display', read_only=True)
    
    class Meta:
        model = DocumentoAppuntamento
        fields = [
            'id', 'appuntamento',
            'document_type', 'document_type_id',
            'file', 'stato', 'stato_display',
            'is_obbligatorio',
            'caricato_da', 'caricato_da_email', 'caricato_at',
            'verificato_da', 'verificato_da_email', 'verificato_at',
            'note_rifiuto', 'note_interne',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'stato', 'caricato_da', 'caricato_at',
            'verificato_da', 'verificato_at',
            'created_at', 'updated_at'
        ]


class DocumentoAppuntamentoUploadSerializer(serializers.ModelSerializer):
    """Serializer per l'upload di un documento."""
    
    class Meta:
        model = DocumentoAppuntamento
        fields = ['id', 'file']
    
    def update(self, instance, validated_data):
        """Carica il documento."""
        file = validated_data.get('file')
        request = self.context.get('request')
        
        if file and request:
            instance.carica(file, request.user)
        
        return instance


class DocumentoAppuntamentoVerificaSerializer(serializers.Serializer):
    """Serializer per la verifica (accettazione/rifiuto) di un documento."""
    azione = serializers.ChoiceField(choices=['accetta', 'rifiuta'], required=True)
    note_rifiuto = serializers.CharField(required=False, allow_blank=True)
    note_interne = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['azione'] == 'rifiuta' and not data.get('note_rifiuto'):
            raise serializers.ValidationError({
                'note_rifiuto': 'Il motivo del rifiuto è obbligatorio'
            })
        return data


# ============================================
# NOTIFICHE
# ============================================

class NotificaSerializer(serializers.ModelSerializer):
    """Serializer per le notifiche."""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    appuntamento_titolo = serializers.CharField(source='appuntamento.titolo', read_only=True)
    atto_titolo = serializers.CharField(source='atto.title', read_only=True)
    
    class Meta:
        model = Notifica
        fields = [
            'id', 'user',
            'tipo', 'tipo_display',
            'titolo', 'messaggio',
            'link_url',
            'appuntamento', 'appuntamento_titolo',
            'atto', 'atto_titolo',
            'letta', 'letta_at',
            'invia_email', 'email_inviata', 'email_inviata_at',
            'created_at'
        ]
        read_only_fields = [
            'id', 'letta_at', 'email_inviata', 'email_inviata_at', 'created_at'
        ]


class NotificaListSerializer(serializers.ModelSerializer):
    """Serializer semplificato per lista notifiche."""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Notifica
        fields = [
            'id', 'tipo', 'tipo_display',
            'titolo', 'messaggio', 'link_url',
            'letta', 'created_at'
        ]


# ============================================
# APPUNTAMENTO (ESTESO)
# ============================================

class AppuntamentoConfermaSerializer(serializers.Serializer):
    """Serializer per confermare un appuntamento."""
    note = serializers.CharField(required=False, allow_blank=True)


class AppuntamentoRifiutaSerializer(serializers.Serializer):
    """Serializer per rifiutare un appuntamento."""
    motivo = serializers.CharField(required=True, help_text='Motivazione del rifiuto')
    
    def validate_motivo(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(
                'La motivazione deve contenere almeno 10 caratteri'
            )
        return value

