"""
Serializers for UI elements.
"""
from rest_framework import serializers
from .models import AppointmentTypeTemplate


class AppointmentTypeTemplateSerializer(serializers.ModelSerializer):
    """Serializer for appointment type templates."""
    
    class Meta:
        model = AppointmentTypeTemplate
        fields = [
            'id',
            'code',
            'name',
            'description',
            'default_duration_minutes',
            'icon',
            'color',
            'order',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
