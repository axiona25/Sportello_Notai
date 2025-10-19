"""
Serializers for notaries.
"""
from rest_framework import serializers
from .models import Notary, Client, Collaborator, NotaryAvailability, Appointment


class NotarySerializer(serializers.ModelSerializer):
    """Full notary profile serializer."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    
    class Meta:
        model = Notary
        fields = [
            'id', 'user_email', 'studio_name', 'bio', 'specializations',
            'phone', 'pec_address', 'website',
            'address_street', 'address_city', 'address_province', 
            'address_cap', 'address_country',
            'latitude', 'longitude',
            'cover_image_url', 'profile_image_url',
            'services', 'tariffe',
            'total_reviews', 'average_rating', 'total_acts',
            'working_hours',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_reviews', 'average_rating', 'total_acts', 
                           'created_at', 'updated_at']
    
    def get_latitude(self, obj):
        if obj.coordinates:
            return obj.coordinates.y
        return obj.latitude  # Fallback to deprecated field
    
    def get_longitude(self, obj):
        if obj.coordinates:
            return obj.coordinates.x
        return obj.longitude  # Fallback to deprecated field


class NotaryListSerializer(serializers.ModelSerializer):
    """Simplified notary serializer for list view."""
    
    class Meta:
        model = Notary
        fields = [
            'id', 'studio_name', 'address_city', 'address_province',
            'specializations', 'average_rating', 'total_reviews',
            'profile_image_url'
        ]


class NotaryShowcaseSerializer(serializers.ModelSerializer):
    """Notary public showcase serializer - visible to all clients."""
    
    name = serializers.CharField(source='studio_name', read_only=True)
    title = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    rating = serializers.DecimalField(
        source='average_rating',
        max_digits=3,
        decimal_places=2,
        read_only=True
    )
    photo = serializers.CharField(source='showcase_photo', allow_blank=True)
    experience = serializers.IntegerField(source='showcase_experience')
    languages = serializers.CharField(source='showcase_languages')
    description = serializers.CharField(source='showcase_description', allow_blank=True)
    services = serializers.JSONField(source='showcase_services')
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = Notary
        fields = [
            'id', 'name', 'title', 'address', 'rating',
            'photo', 'experience', 'languages', 'description',
            'services', 'availability', 'updated_at'
        ]
        read_only_fields = ['id', 'rating', 'updated_at']
    
    def get_title(self, obj):
        """Generate title from specializations or default."""
        if obj.specializations and len(obj.specializations) > 0:
            return f"Notaio - {obj.specializations[0]}"
        return "Notaio"
    
    def get_address(self, obj):
        """Generate full address string."""
        parts = []
        if obj.address_street:
            parts.append(obj.address_street)
        if obj.address_city:
            city_part = obj.address_city
            if obj.address_country == 'San Marino':
                city_part += ' (SM)'
            parts.append(city_part)
        return ' - '.join(parts) if parts else ''
    
    def get_availability(self, obj):
        """Get availability info."""
        return {
            'enabled': obj.showcase_availability_enabled,
            'hours': obj.showcase_availability_hours or 'Lun-Ven 9:00-18:00'
        }


class ClientSerializer(serializers.ModelSerializer):
    """Client profile serializer."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'user_email', 'first_name', 'last_name', 'full_name',
            'fiscal_code', 'birth_date', 'birth_place',
            'phone', 'pec_address',
            'residence_street', 'residence_city', 'residence_province',
            'residence_cap', 'residence_country',
            'identity_document_type', 'identity_document_number',
            'identity_document_expiry',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class CollaboratorSerializer(serializers.ModelSerializer):
    """Collaborator serializer."""
    
    notary_studio = serializers.CharField(source='notary.studio_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Collaborator
        fields = [
            'id', 'user_email', 'notary_studio', 'first_name', 'last_name',
            'position', 'permissions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotaryAvailabilitySerializer(serializers.ModelSerializer):
    """Notary availability serializer."""
    
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = NotaryAvailability
        fields = [
            'id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("L'ora di fine deve essere dopo l'ora di inizio")
        return data


class AppointmentSerializer(serializers.ModelSerializer):
    """Appointment serializer."""
    
    notary_name = serializers.CharField(source='notary.studio_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'notary', 'notary_name', 'client', 'client_email', 'client_name',
            'appointment_type', 'type_display', 'date', 'start_time', 'end_time',
            'duration_minutes', 'status', 'status_display', 'notes', 'notary_notes',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_client_name(self, obj):
        """Get client full name or email."""
        if hasattr(obj.client, 'first_name') and obj.client.first_name:
            return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()
        return obj.client.email
    
    def validate(self, data):
        """Validate appointment data."""
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError("L'ora di fine deve essere dopo l'ora di inizio")
        return data


class AvailableSlotSerializer(serializers.Serializer):
    """Serializer for available appointment slots."""
    
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    duration_minutes = serializers.IntegerField()
    is_available = serializers.BooleanField()


# ========================================
# ADMIN SERIALIZERS
# ========================================

class AdminNotarySerializer(serializers.ModelSerializer):
    """
    Complete Notary serializer for Admin management.
    Includes all fields including license management.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    full_address = serializers.SerializerMethodField()
    license_status = serializers.SerializerMethodField()
    license_days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Notary
        fields = [
            # Identificazione
            'id', 'user_id', 'user_email',
            
            # Studio
            'studio_name', 'bio', 'specializations',
            
            # Contatti
            'phone', 'pec_address', 'website',
            
            # Indirizzo
            'address_street', 'address_city', 'address_province', 
            'address_cap', 'address_country', 'full_address',
            
            # Immagini
            'cover_image_url', 'profile_image_url',
            
            # Vetrina pubblica
            'showcase_photo', 'showcase_experience', 'showcase_languages',
            'showcase_description', 'showcase_services',
            'showcase_availability_enabled', 'showcase_availability_hours',
            
            # Servizi e Stats
            'services', 'tariffe',
            'total_reviews', 'average_rating', 'total_acts',
            
            # Orari
            'working_hours',
            
            # LICENZA (gestita da Admin)
            'license_active', 'license_start_date', 'license_expiry_date',
            'license_payment_amount', 'license_payment_frequency',
            'license_notes', 'license_status', 'license_days_remaining',
            
            # Timestamp
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_id', 'user_email', 'full_address', 
            'total_reviews', 'average_rating', 'total_acts',
            'license_status', 'license_days_remaining',
            'created_at', 'updated_at'
        ]
    
    def get_full_address(self, obj):
        """Generate complete address string."""
        parts = []
        if obj.address_street:
            parts.append(obj.address_street)
        if obj.address_city:
            parts.append(obj.address_city)
        if obj.address_province:
            parts.append(f"({obj.address_province})")
        if obj.address_cap:
            parts.append(obj.address_cap)
        if obj.address_country and obj.address_country != 'Italia':
            parts.append(obj.address_country)
        return ' '.join(parts) if parts else 'N/D'
    
    def get_license_status(self, obj):
        """
        Returns: 'active', 'expired', 'expiring_soon' (< 30 days), 'disabled'
        """
        if not obj.license_active:
            return 'disabled'
        
        if not obj.license_expiry_date:
            return 'active'  # No expiry = always active
        
        from django.utils import timezone
        today = timezone.now().date()
        days_remaining = (obj.license_expiry_date - today).days
        
        if days_remaining < 0:
            return 'expired'
        elif days_remaining <= 30:
            return 'expiring_soon'
        else:
            return 'active'
    
    def get_license_days_remaining(self, obj):
        """Calculate days remaining until license expires."""
        if not obj.license_active or not obj.license_expiry_date:
            return None
        
        from django.utils import timezone
        today = timezone.now().date()
        days = (obj.license_expiry_date - today).days
        return days if days >= 0 else 0


class AdminNotaryListSerializer(serializers.ModelSerializer):
    """
    Simplified Notary serializer for Admin list view.
    Shows essential info + license status.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    license_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Notary
        fields = [
            'id', 'user_email', 'studio_name',
            'address_city', 'address_province',
            'phone', 'pec_address',
            'total_reviews', 'average_rating',
            'license_active', 'license_expiry_date', 'license_status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_license_status(self, obj):
        """Returns: 'active', 'expired', 'expiring_soon', 'disabled'"""
        if not obj.license_active:
            return 'disabled'
        
        if not obj.license_expiry_date:
            return 'active'
        
        from django.utils import timezone
        today = timezone.now().date()
        days_remaining = (obj.license_expiry_date - today).days
        
        if days_remaining < 0:
            return 'expired'
        elif days_remaining <= 30:
            return 'expiring_soon'
        else:
            return 'active'


class AdminNotaryLicenseSerializer(serializers.ModelSerializer):
    """
    Serializer for updating ONLY license-related fields.
    Used by Admin to manage license activation/renewal.
    """
    
    license_status = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Notary
        fields = [
            'license_active',
            'license_start_date',
            'license_expiry_date',
            'license_payment_amount',
            'license_payment_frequency',
            'license_notes',
            'license_status'
        ]
    
    def get_license_status(self, obj):
        """Returns: 'active', 'expired', 'expiring_soon', 'disabled'"""
        if not obj.license_active:
            return 'disabled'
        
        if not obj.license_expiry_date:
            return 'active'
        
        from django.utils import timezone
        today = timezone.now().date()
        days_remaining = (obj.license_expiry_date - today).days
        
        if days_remaining < 0:
            return 'expired'
        elif days_remaining <= 30:
            return 'expiring_soon'
        else:
            return 'active'
    
    def validate(self, data):
        """Validate license dates."""
        start_date = data.get('license_start_date')
        expiry_date = data.get('license_expiry_date')
        
        if start_date and expiry_date:
            if expiry_date <= start_date:
                raise serializers.ValidationError(
                    "La data di scadenza deve essere successiva alla data di inizio"
                )
        
        return data

