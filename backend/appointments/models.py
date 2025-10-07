"""
Models for appointments management.
"""
import uuid
from django.db import models
from notaries.models import Notary, Client
from acts.models import Act


class AppointmentStatus(models.TextChoices):
    """Appointment status choices."""
    RICHIESTO = 'richiesto', 'Richiesto'
    CONFERMATO = 'confermato', 'Confermato'
    RIFIUTATO = 'rifiutato', 'Rifiutato'
    COMPLETATO = 'completato', 'Completato'
    ANNULLATO = 'annullato', 'Annullato'


class Appointment(models.Model):
    """Appointment between notary and client."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='appointments')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='appointments')
    act = models.ForeignKey(
        Act,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appointments'
    )
    
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.RICHIESTO
    )
    
    # Date e orari
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Dettagli
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_online = models.BooleanField(default=False)
    meeting_url = models.TextField(blank=True)  # link videoconferenza
    
    # Reminder
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)
    
    # Note
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['notary', 'start_time']),
            models.Index(fields=['client', 'start_time']),
            models.Index(fields=['status', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"
    
    def is_past(self):
        """Check if appointment is in the past."""
        from django.utils import timezone
        return self.end_time < timezone.now()
    
    def duration_minutes(self):
        """Get appointment duration in minutes."""
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)
    
    def send_reminder(self):
        """Send appointment reminder."""
        from django.utils import timezone
        # TODO: Implementare invio reminder via email/notifica
        self.reminder_sent = True
        self.reminder_sent_at = timezone.now()
        self.save()

