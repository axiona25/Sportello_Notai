from rest_framework import serializers
from .models import Element


class ElementSerializer(serializers.ModelSerializer):
    """Serializer for UI Elements."""
    
    class Meta:
        model = Element
        fields = [
            'id', 'name', 'type', 'description',
            'svg_content', 'image_url',
            'width', 'height',
            'primary_color', 'secondary_color',
            'location', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

