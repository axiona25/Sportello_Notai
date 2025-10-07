"""
Serializers for acts.
"""
from rest_framework import serializers
from .models import Act


class ActSerializer(serializers.ModelSerializer):
    """Act serializer."""
    
    notary_name = serializers.CharField(source='notary.studio_name', read_only=True)
    client_name = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    signed_document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Act
        fields = [
            'id', 'notary', 'notary_name', 'client', 'client_name',
            'category', 'status', 'protocol_number', 'protocol_year',
            'title', 'description', 'notes', 'parties',
            'bank_name', 'bank_branch', 'loan_amount',
            'property_address', 'property_cadastral_data', 'property_value',
            'signing_date', 'registration_date',
            'survey_completed', 'survey_data',
            'document_count', 'signed_document_count',
            'created_at', 'updated_at', 'closed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'closed_at']
    
    def get_client_name(self, obj):
        return obj.client.get_full_name()
    
    def get_document_count(self, obj):
        return obj.get_total_documents()
    
    def get_signed_document_count(self, obj):
        return obj.get_signed_documents()


class ActListSerializer(serializers.ModelSerializer):
    """Simplified act serializer for list view."""
    
    notary_name = serializers.CharField(source='notary.studio_name', read_only=True)
    client_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Act
        fields = [
            'id', 'notary_name', 'client_name', 'category', 'status',
            'protocol_number', 'title', 'created_at'
        ]
    
    def get_client_name(self, obj):
        return obj.client.get_full_name()


class ActCloseSerializer(serializers.Serializer):
    """Serializer for closing an act."""
    
    survey_data = serializers.JSONField(required=False)
    
    def validate(self, data):
        act = self.instance
        if act.status == 'archiviato':
            raise serializers.ValidationError("L'atto è già chiuso")
        
        if not act.can_close():
            raise serializers.ValidationError("Survey obbligatoria non completata")
        
        return data

