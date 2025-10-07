"""
Models for PEC (Certified Email) management.
"""
import uuid
from django.db import models
from acts.models import Act
from notaries.models import Notary
from accounts.models import User


class PecStatus(models.TextChoices):
    """PEC message status."""
    BOZZA = 'bozza', 'Bozza'
    IN_CODA = 'in_coda', 'In Coda'
    INVIATO = 'inviato', 'Inviato'
    CONSEGNATO = 'consegnato', 'Consegnato'
    ERRORE = 'errore', 'Errore'
    QUARANTENA = 'quarantena', 'Quarantena'


class PecTemplate(models.Model):
    """PEC message template."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='pec_templates')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Template
    subject = models.CharField(max_length=500)
    body = models.TextField(help_text='Usa {{variabile}} per placeholder')
    
    # Variabili disponibili
    variables = models.JSONField(
        default=list,
        help_text='["cliente_nome", "atto_numero", ...]'
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pec_templates'
        verbose_name = 'PEC Template'
        verbose_name_plural = 'PEC Templates'
        ordering = ['notary', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.notary.studio_name})"
    
    def render(self, context):
        """Render template with context variables."""
        subject = self.subject
        body = self.body
        
        for key, value in context.items():
            subject = subject.replace(f'{{{{{key}}}}}', str(value))
            body = body.replace(f'{{{{{key}}}}}', str(value))
        
        return {
            'subject': subject,
            'body': body
        }


class PecMessage(models.Model):
    """PEC message."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    act = models.ForeignKey(Act, on_delete=models.CASCADE, related_name='pec_messages')
    
    # Mittente
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sent_pec_messages')
    sender_pec = models.EmailField()
    
    # Destinatari
    recipients = models.JSONField(
        help_text='[{"email": "...", "name": "...", "type": "to|cc|bcc"}, ...]'
    )
    
    # Contenuto
    subject = models.CharField(max_length=500)
    body = models.TextField()
    
    # Template usato
    template = models.ForeignKey(
        PecTemplate,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='messages'
    )
    
    # Allegati
    attachments = models.JSONField(
        default=list,
        help_text='[{"document_id": "...", "filename": "..."}, ...]'
    )
    
    # Stato invio
    status = models.CharField(
        max_length=20,
        choices=PecStatus.choices,
        default=PecStatus.BOZZA
    )
    
    # Log invio
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    # Ricevuta PEC
    receipt_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pec_messages'
        verbose_name = 'PEC Message'
        verbose_name_plural = 'PEC Messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['act', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['sender']),
        ]
    
    def __str__(self):
        return f"{self.subject} ({self.status})"
    
    def get_recipient_emails(self, recipient_type='to'):
        """Get list of recipient emails by type."""
        return [
            r['email'] for r in self.recipients 
            if r.get('type') == recipient_type
        ]

