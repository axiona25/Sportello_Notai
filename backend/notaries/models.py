"""
Models for notaries, clients, and collaborators.
"""
import uuid
from django.db import models
from django.contrib.gis.db import models as gis_models
from accounts.models import User


class Notary(models.Model):
    """Notary profile with services and showcase."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notary_profile')
    
    # Studio
    studio_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    specializations = models.JSONField(default=list, blank=True)  # ["Compravendite", "Successioni", ...]
    
    # Contatti
    phone = models.CharField(max_length=50, blank=True)
    pec_address = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Indirizzo
    address_street = models.CharField(max_length=255, blank=True)
    address_city = models.CharField(max_length=100, blank=True)
    address_province = models.CharField(max_length=50, blank=True)
    address_cap = models.CharField(max_length=10, blank=True)
    address_country = models.CharField(max_length=50, default='Italia')
    coordinates = gis_models.PointField(blank=True, null=True)  # PostGIS point for geospatial queries
    latitude = models.FloatField(blank=True, null=True)  # Deprecated - kept for backward compatibility
    longitude = models.FloatField(blank=True, null=True)  # Deprecated - kept for backward compatibility
    
    # Vetrina
    cover_image_url = models.TextField(blank=True)
    profile_image_url = models.TextField(blank=True)
    
    # Vetrina Pubblica (configurabile dal notaio)
    showcase_photo = models.TextField(blank=True, help_text='Base64 encoded photo for public showcase')
    showcase_experience = models.IntegerField(default=0, help_text='Years of experience')
    showcase_languages = models.CharField(max_length=255, blank=True, default='Italiano')
    showcase_description = models.TextField(blank=True)
    showcase_services = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"documents": true, "agenda": true, "chat": true, "acts": true, "signature": true, "pec": true, "conservation": true}'
    )
    showcase_availability_enabled = models.BooleanField(default=True)
    showcase_availability_hours = models.CharField(max_length=100, blank=True, default='Lun-Ven 9:00-18:00')
    
    # Servizi e tariffe (JSON flessibile)
    services = models.JSONField(
        default=list, 
        blank=True,
        help_text='[{"name": "Compravendita", "price": 1500, "description": "..."}, ...]'
    )
    tariffe = models.JSONField(default=dict, blank=True)
    
    # Stats
    total_reviews = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_acts = models.IntegerField(default=0)
    
    # Orari di lavoro
    working_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"monday": {"start": "09:00", "end": "18:00"}, ...}'
    )
    
    # Gestione Licenza (Admin)
    license_active = models.BooleanField(
        default=True,
        help_text='Se False, il notaio può solo visualizzare dati esistenti, non creare nuovi appuntamenti'
    )
    license_start_date = models.DateField(
        blank=True,
        null=True,
        help_text='Data di attivazione della licenza'
    )
    license_expiry_date = models.DateField(
        blank=True,
        null=True,
        help_text='Data di scadenza della licenza'
    )
    license_payment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.0,
        help_text='Importo del canone (es. 99.00 per mensile, 990.00 per annuale)'
    )
    license_payment_frequency = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Mensile'),
            ('annual', 'Annuale'),
        ],
        default='annual',
        help_text='Frequenza di pagamento della licenza'
    )
    license_notes = models.TextField(
        blank=True,
        help_text='Note amministrative sulla licenza (rinnovi, comunicazioni, etc.)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notaries'
        verbose_name = 'Notary'
        verbose_name_plural = 'Notaries'
        ordering = ['-average_rating', '-total_reviews']
    
    def __str__(self):
        return f"{self.studio_name}"
    
    def is_license_valid(self):
        """
        Verifica se la licenza è valida.
        Returns True se:
        - license_active è True
        - license_expiry_date non è impostata OPPURE non è scaduta
        """
        if not self.license_active:
            return False
        
        if self.license_expiry_date:
            from django.utils import timezone
            today = timezone.now().date()
            return today <= self.license_expiry_date
        
        return True
    
    def can_accept_new_appointments(self):
        """
        Il notaio può accettare nuovi appuntamenti solo se la licenza è valida.
        """
        return self.is_license_valid()
    
    def update_rating(self):
        """Update average rating from reviews."""
        from reviews.models import Review
        reviews = Review.objects.filter(notary=self, is_approved=True)
        if reviews.exists():
            self.total_reviews = reviews.count()
            self.average_rating = reviews.aggregate(
                models.Avg('rating')
            )['rating__avg'] or 0.0
            self.save()


class Client(models.Model):
    """Client profile."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    
    # Anagrafica
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    fiscal_code = models.CharField(max_length=16, blank=True)
    birth_date = models.DateField(blank=True, null=True)
    birth_place = models.CharField(max_length=100, blank=True)
    
    # Contatti
    phone = models.CharField(max_length=50, blank=True)
    pec_address = models.EmailField(blank=True)
    
    # Residenza
    residence_street = models.CharField(max_length=255, blank=True)
    residence_city = models.CharField(max_length=100, blank=True)
    residence_province = models.CharField(max_length=50, blank=True)
    residence_cap = models.CharField(max_length=10, blank=True)
    residence_country = models.CharField(max_length=50, default='Italia')
    
    # Documento identità (cifrato)
    identity_document_type = models.CharField(max_length=50, blank=True)  # CI, Passaporto, Patente
    identity_document_number = models.CharField(max_length=100, blank=True)
    identity_document_expiry = models.DateField(blank=True, null=True)
    identity_document_url = models.TextField(blank=True)  # URL blob cifrato
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class Collaborator(models.Model):
    """Collaborator/staff member of notary studio."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='collaborator_profile')
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='collaborators')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100, blank=True)  # "Praticante", "Segretaria"
    
    # Permessi granulari (RBAC)
    permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"can_create_acts": true, "can_sign": false, "can_manage_clients": true, ...}'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'collaborators'
        verbose_name = 'Collaborator'
        verbose_name_plural = 'Collaborators'
        ordering = ['notary', 'last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.notary.studio_name})"
    
    def has_permission(self, permission_key):
        """Check if collaborator has a specific permission."""
        return self.permissions.get(permission_key, False)


class NotaryAvailability(models.Model):
    """Notary weekly availability schedule."""
    
    WEEKDAY_CHOICES = [
        (0, 'Domenica'),
        (1, 'Lunedì'),
        (2, 'Martedì'),
        (3, 'Mercoledì'),
        (4, 'Giovedì'),
        (5, 'Venerdì'),
        (6, 'Sabato'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='availability_slots')
    
    day_of_week = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    is_available = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'notary_availability'
        verbose_name = 'Notary Availability'
        verbose_name_plural = 'Notary Availabilities'
        unique_together = ['notary', 'day_of_week', 'start_time']
        ordering = ['notary', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.notary.studio_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Appointment(models.Model):
    """Appointment between a client and a notary."""
    
    STATUS_CHOICES = [
        ('pending', 'In attesa di conferma'),
        ('accepted', 'Confermato'),
        ('rejected', 'Rifiutato'),
        ('cancelled', 'Annullato'),
        ('completed', 'Completato'),
    ]
    
    TYPE_CHOICES = [
        ('rogito', 'Rogito Notarile'),
        ('consulenza', 'Consulenza'),
        ('revisione', 'Revisione Documenti'),
        ('altro', 'Altro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='appointments')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    
    # Dettagli appuntamento
    appointment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='consulenza')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField(help_text='Durata in minuti')
    
    # Stato
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text='Note del cliente')
    notary_notes = models.TextField(blank=True, help_text='Note del notaio')
    rejection_reason = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        verbose_name = 'Appuntamento'
        verbose_name_plural = 'Appuntamenti'
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['notary', 'date', 'status']),
            models.Index(fields=['client', 'status']),
        ]
    
    def __str__(self):
        return f"{self.client.email} → {self.notary.studio_name} - {self.date} {self.start_time}"

