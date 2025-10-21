"""
Serializers for acts.
"""
from rest_framework import serializers
from .models import Act, NotarialActMainCategory, NotarialActCategory, DocumentType, NotarialActCategoryDocument


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


class NotarialActMainCategorySerializer(serializers.ModelSerializer):
    """Serializer per le categorie principali di atto."""
    
    class Meta:
        model = NotarialActMainCategory
        fields = ['id', 'name', 'code', 'description', 'order', 'is_active']


class DocumentTypeSerializer(serializers.ModelSerializer):
    """Serializer per i tipi di documento."""
    
    class Meta:
        model = DocumentType
        fields = [
            'id', 'name', 'code', 'description', 'category',
            'required_from', 'is_mandatory', 'is_active'
        ]


class NotarialActCategoryDocumentSerializer(serializers.ModelSerializer):
    """Serializer per i documenti richiesti per una categoria di atto."""
    
    document = DocumentTypeSerializer(source='document_type', read_only=True)
    document_type_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = NotarialActCategoryDocument
        fields = [
            'id', 'document', 'document_type_id', 'is_mandatory', 'order', 'notes'
        ]


class NotarialActCategorySerializer(serializers.ModelSerializer):
    """Serializer per le categorie specifiche di atto."""
    
    main_category_name = serializers.CharField(source='main_category.name', read_only=True)
    required_documents = NotarialActCategoryDocumentSerializer(many=True, read_only=True)
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = NotarialActCategory
        fields = [
            'id', 'main_category', 'main_category_name',
            'name', 'code', 'description', 'order', 'is_active',
            'estimated_duration_minutes',
            'requires_property', 'requires_bank', 'requires_parties',
            'required_documents', 'document_count'
        ]
    
    def get_document_count(self, obj):
        return obj.required_documents.count()

