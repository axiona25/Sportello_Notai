"""
Admin per Protocolli Atti Notarili.
"""
from django.contrib import admin
from .models_protocollo import ProtocolloAttoNotarile


@admin.register(ProtocolloAttoNotarile)
class ProtocolloAttoNotarialeAdmin(admin.ModelAdmin):
    """Admin per Protocollo Atto Notarile."""
    
    list_display = [
        'numero_protocollo',
        'tipologia_atto_nome',
        'notaio',
        'get_cliente',
        'stato',
        'data_creazione',
        'data_protocollo',
    ]
    
    list_filter = [
        'stato',
        'tipologia_atto_code',
        'data_creazione',
        'notaio',
    ]
    
    search_fields = [
        'numero_protocollo',
        'tipologia_atto_nome',
        'notaio__nome',
        'notaio__cognome',
    ]
    
    readonly_fields = [
        'numero_protocollo',
        'code_prefix',
        'progressivo',
        'data_creazione',
        'data_firma',
        'data_protocollo',
        'data_annullamento',
        'updated_at',
    ]
    
    fieldsets = (
        ('Identificazione', {
            'fields': (
                'numero_protocollo',
                'code_prefix',
                'progressivo',
            )
        }),
        ('Relazioni', {
            'fields': (
                'appuntamento',
                'template',
                'notaio',
            )
        }),
        ('Tipologia Atto', {
            'fields': (
                'tipologia_atto_code',
                'tipologia_atto_nome',
            )
        }),
        ('Parti Coinvolte', {
            'fields': (
                'parti_coinvolte',
            )
        }),
        ('Stato e Date', {
            'fields': (
                'stato',
                'data_creazione',
                'data_firma',
                'data_protocollo',
                'data_annullamento',
                'motivo_annullamento',
            )
        }),
        ('Documenti', {
            'fields': (
                'documento_finale_url',
            )
        }),
        ('Note e Metadati', {
            'fields': (
                'note',
                'metadata',
            )
        }),
        ('Audit', {
            'fields': (
                'created_by',
                'updated_at',
            )
        }),
    )
    
    def get_cliente(self, obj):
        """Estrae nome cliente dalle parti coinvolte."""
        return obj.parti_coinvolte.get('cliente', {}).get('nome', 'N/A')
    get_cliente.short_description = 'Cliente'
    
    def has_delete_permission(self, request, obj=None):
        """Non permettere eliminazione diretta, solo annullamento."""
        return False

