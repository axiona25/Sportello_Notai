from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SessionToken, Cliente, Notaio, Partner


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'role', 'status', 'mfa_enabled', 'email_verified', 'created_at']
    list_filter = ['role', 'status', 'mfa_enabled', 'email_verified']
    search_fields = ['email']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('role', 'status')}),
        ('MFA', {'fields': ('mfa_enabled', 'mfa_secret')}),
        ('Verification', {'fields': ('email_verified', 'email_verification_token')}),
        ('Security', {'fields': ('failed_login_attempts', 'locked_until')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']


@admin.register(SessionToken)
class SessionTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'revoked']
    list_filter = ['revoked']
    search_fields = ['user__email']
    ordering = ['-created_at']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['cognome', 'nome', 'codice_fiscale', 'mail', 'cellulare', 'stato_civile', 'created_at']
    list_filter = ['sesso', 'stato_civile', 'regime_patrimoniale', 'citta']
    search_fields = ['nome', 'cognome', 'codice_fiscale', 'mail', 'cellulare']
    ordering = ['cognome', 'nome']
    
    fieldsets = (
        ('Utente', {'fields': ('user',)}),
        ('Dati Anagrafici', {
            'fields': ('nome', 'cognome', 'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale')
        }),
        ('Residenza', {
            'fields': ('indirizzo', 'civico', 'cap', 'citta', 'nazione')
        }),
        ('Stato Civile e Patrimoniale', {
            'fields': ('stato_civile', 'regime_patrimoniale')
        }),
        ('Contatti', {
            'fields': ('cellulare', 'mail')
        }),
        ('Documenti', {
            'fields': ('carta_identita', 'documento_codice_fiscale', 'carta_sanitaria', 'passaporto')
        }),
        ('Date', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Notaio)
class NotaioAdmin(admin.ModelAdmin):
    list_display = ['cognome', 'nome', 'numero_iscrizione_albo', 'distretto_notarile', 'pec', 'is_active', 'is_verified']
    list_filter = ['sesso', 'tipologia', 'distretto_notarile', 'provincia', 'is_active', 'is_verified']
    search_fields = ['nome', 'cognome', 'codice_fiscale', 'numero_iscrizione_albo', 'denominazione_studio', 'pec']
    ordering = ['cognome', 'nome']
    
    fieldsets = (
        ('Utente', {'fields': ('user',)}),
        ('Dati Anagrafici', {
            'fields': ('nome', 'cognome', 'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale')
        }),
        ('Dati Professionali', {
            'fields': ('numero_iscrizione_albo', 'distretto_notarile', 'data_iscrizione_albo', 
                      'sede_notarile', 'tipologia')
        }),
        ('Studio Notarile', {
            'fields': ('denominazione_studio', 'partita_iva')
        }),
        ('Indirizzo Studio', {
            'fields': ('indirizzo_studio', 'civico', 'cap', 'citta', 'provincia', 'nazione')
        }),
        ('Contatti', {
            'fields': ('telefono_studio', 'cellulare', 'email_studio', 'pec', 'sito_web')
        }),
        ('Coordinate Geografiche', {
            'fields': ('latitudine', 'longitudine')
        }),
        ('Orari e Documenti', {
            'fields': ('orari_ricevimento', 'documento_identita', 'certificato_iscrizione_albo', 'visura_camerale')
        }),
        ('Stato', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Date', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['ragione_sociale', 'tipologia', 'partita_iva', 'referente_completo', 'mail', 'is_active', 'is_verified']
    list_filter = ['tipologia', 'citta', 'provincia', 'is_active', 'is_verified']
    search_fields = ['ragione_sociale', 'partita_iva', 'codice_fiscale', 'nome_referente', 'cognome_referente', 'mail']
    ordering = ['ragione_sociale']
    
    fieldsets = (
        ('Utente', {'fields': ('user',)}),
        ('Tipologia', {'fields': ('tipologia',)}),
        ('Dati Aziendali', {
            'fields': ('ragione_sociale', 'partita_iva', 'codice_fiscale')
        }),
        ('Indirizzo', {
            'fields': ('indirizzo', 'civico', 'cap', 'citta', 'provincia', 'nazione')
        }),
        ('Referente', {
            'fields': ('nome_referente', 'cognome_referente')
        }),
        ('Contatti', {
            'fields': ('cellulare', 'telefono', 'mail', 'pec', 'sito_web')
        }),
        ('Documenti', {
            'fields': ('visura_camera_commercio', 'certificato_iscrizione_albo', 
                      'documento_identita_referente', 'altri_documenti')
        }),
        ('Stato', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Date', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']

