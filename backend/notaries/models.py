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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notaries'
        verbose_name = 'Notary'
        verbose_name_plural = 'Notaries'
        ordering = ['-average_rating', '-total_reviews']
    
    def __str__(self):
        return f"{self.studio_name}"
    
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

