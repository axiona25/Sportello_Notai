"""
Serializers for notaries.
"""
from rest_framework import serializers
# from rest_framework_gis.serializers import GeoFeatureModelSerializer  # Temporaneamente disabilitato
from .models import Notary, Client, Collaborator, NotaryAvailability


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
        return obj.latitude  # Temporary: direct field access
    
    def get_longitude(self, obj):
        return obj.longitude  # Temporary: direct field access


class NotaryListSerializer(serializers.ModelSerializer):
    """Simplified notary serializer for list view."""
    
    class Meta:
        model = Notary
        fields = [
            'id', 'studio_name', 'address_city', 'address_province',
            'specializations', 'average_rating', 'total_reviews',
            'profile_image_url'
        ]


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

