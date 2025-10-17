"""
Configurazione pannello admin per gli appuntamenti.
"""
from django.contrib import admin
from .models import (
    DisponibilitaNotaio, EccezioneDisponibilita,
    Appuntamento, PartecipanteAppuntamento
)


@admin.register(DisponibilitaNotaio)
class DisponibilitaNotaioAdmin(admin.ModelAdmin):
    list_display = [
        'notaio', 'giorno_settimana', 'ora_inizio', 'ora_fine',
        'durata_slot_minuti', 'is_active', 'permetti_prenotazioni_online'
    ]
    list_filter = ['giorno_settimana', 'is_active', 'permetti_prenotazioni_online', 'notaio']
    search_fields = ['notaio__nome', 'notaio__cognome']
    ordering = ['notaio', 'giorno_settimana', 'ora_inizio']
    
    fieldsets = (
        ('Notaio', {
            'fields': ('notaio',)
        }),
        ('Orari', {
            'fields': ('giorno_settimana', 'ora_inizio', 'ora_fine', 'durata_slot_minuti')
        }),
        ('Validità', {
            'fields': ('data_inizio_validita', 'data_fine_validita')
        }),
        ('Configurazione', {
            'fields': ('is_active', 'permetti_prenotazioni_online')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EccezioneDisponibilita)
class EccezioneDisponibilitaAdmin(admin.ModelAdmin):
    list_display = [
        'notaio', 'motivo', 'data_inizio', 'data_fine', 'is_chiusura'
    ]
    list_filter = ['is_chiusura', 'notaio']
    search_fields = ['notaio__nome', 'notaio__cognome', 'motivo', 'descrizione']
    ordering = ['-data_inizio']
    date_hierarchy = 'data_inizio'
    
    fieldsets = (
        ('Notaio', {
            'fields': ('notaio',)
        }),
        ('Periodo', {
            'fields': ('data_inizio', 'data_fine')
        }),
        ('Dettagli', {
            'fields': ('motivo', 'descrizione', 'is_chiusura')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


class PartecipanteInline(admin.TabularInline):
    model = PartecipanteAppuntamento
    extra = 0
    fields = ['cliente', 'partner', 'ruolo', 'status', 'notificato', 'risposta_at']
    readonly_fields = ['notificato_at', 'risposta_at']


@admin.register(Appuntamento)
class AppuntamentoAdmin(admin.ModelAdmin):
    list_display = [
        'titolo', 'notaio', 'start_time', 'status',
        'tipo', 'is_online', 'numero_partecipanti'
    ]
    list_filter = ['status', 'tipo', 'is_online', 'notaio']
    search_fields = ['titolo', 'descrizione', 'notaio__nome', 'notaio__cognome']
    ordering = ['-start_time']
    date_hierarchy = 'start_time'
    inlines = [PartecipanteInline]
    
    fieldsets = (
        ('Organizzatore', {
            'fields': ('notaio',)
        }),
        ('Stato e Tipo', {
            'fields': ('status', 'tipo', 'act')
        }),
        ('Orari', {
            'fields': ('start_time', 'end_time')
        }),
        ('Dettagli', {
            'fields': ('titolo', 'descrizione')
        }),
        ('Ubicazione', {
            'fields': ('location', 'is_online', 'meeting_url')
        }),
        ('Note', {
            'fields': ('note_notaio', 'note_pubbliche')
        }),
        ('Reminder', {
            'fields': ('invio_reminder_ore_prima', 'reminder_sent', 'reminder_sent_at'),
            'classes': ('collapse',)
        }),
        ('Conferma', {
            'fields': ('richiede_conferma', 'confermato_at', 'confermato_da'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by_email'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'confermato_at', 'confermato_da',
        'reminder_sent', 'reminder_sent_at',
        'created_at', 'updated_at'
    ]
    
    def numero_partecipanti(self, obj):
        return obj.partecipanti.count()
    numero_partecipanti.short_description = 'Partecipanti'


@admin.register(PartecipanteAppuntamento)
class PartecipanteAppuntamentoAdmin(admin.ModelAdmin):
    list_display = [
        'appuntamento', 'get_nome_partecipante', 'get_tipo_partecipante',
        'ruolo', 'status', 'notificato', 'risposta_at'
    ]
    list_filter = ['ruolo', 'status', 'notificato']
    search_fields = [
        'appuntamento__titolo',
        'cliente__nome', 'cliente__cognome',
        'partner__ragione_sociale'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Appuntamento', {
            'fields': ('appuntamento',)
        }),
        ('Partecipante', {
            'fields': ('cliente', 'partner')
        }),
        ('Ruolo e Stato', {
            'fields': ('ruolo', 'status')
        }),
        ('Notifiche', {
            'fields': ('notificato', 'notificato_at')
        }),
        ('Risposta', {
            'fields': ('risposta_at', 'note_partecipante')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['notificato_at', 'risposta_at', 'created_at', 'updated_at']

