"""
Models for UI elements and admin configurations.
"""
import uuid
from django.db import models


class AppointmentTypeTemplate(models.Model):
    """
    Template di tipologie di appuntamento gestibili dall'admin.
    Questi template sono poi disponibili per tutti i notai.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identificatore univoco
    code = models.CharField(
        max_length=50, 
        unique=True,
        help_text='Codice identificativo (es: rogito, consulenza)'
    )
    
    # Informazioni visualizzate
    name = models.CharField(
        max_length=100,
        help_text='Nome della tipologia (es: Rogito Notarile)'
    )
    
    description = models.TextField(
        blank=True,
        help_text='Descrizione del servizio'
    )
    
    # Durata suggerita
    default_duration_minutes = models.IntegerField(
        default=30,
        help_text='Durata suggerita in minuti'
    )
    
    # Icona (nome dell'icona da usare nel frontend)
    icon = models.CharField(
        max_length=50,
        default='Calendar',
        help_text='Nome icona Lucide React (es: FileSignature, Users, Calendar)'
    )
    
    # Colore (hex)
    color = models.CharField(
        max_length=7,
        default='#4FADFF',
        help_text='Colore hex per il badge (es: #4FADFF)'
    )
    
    # Ordinamento
    order = models.IntegerField(
        default=0,
        help_text='Ordine di visualizzazione'
    )
    
    # Stato
    is_active = models.BooleanField(
        default=True,
        help_text='Se disattivato non sarà visibile ai notai'
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointment_type_templates'
        verbose_name = 'Tipologia Appuntamento'
        verbose_name_plural = 'Tipologie Appuntamenti'
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.default_duration_minutes} min)"
