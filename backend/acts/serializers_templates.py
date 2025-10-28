"""
Serializers for Act Templates.
"""
from rest_framework import serializers
from .models_templates import ActTemplate, ACT_CODE_PREFIXES


class ActTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Act Template."""
    
    template_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()  # Alias per compatibilità frontend
    created_by_name = serializers.SerializerMethodField()
    next_code_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = ActTemplate
        fields = [
            'id',
            'act_type_code',
            'act_type_name',
            'code_prefix',
            'current_progressive',
            'template_file',
            'template_url',
            'file_url',  # Alias
            'original_filename',
            'mime_type',
            'file_size',
            'description',
            'usage_notes',
            'is_active',
            'version',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
            'next_code_preview',
        ]
        read_only_fields = [
            'id',
            'current_progressive',
            'created_by',
            'created_at',
            'updated_at',
        ]
    
    def get_template_url(self, obj):
        """Get the full URL for the template file."""
        if obj.template_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.template_file.url)
            return obj.template_file.url
        return None
    
    def get_file_url(self, obj):
        """Alias per template_url (compatibilità frontend)."""
        return self.get_template_url(obj)
    
    def get_created_by_name(self, obj):
        """Get the creator's name."""
        if obj.created_by:
            # Il modello User custom ha solo email, non first_name/last_name
            # Prova a prendere il nome dal profilo notary se esiste
            if hasattr(obj.created_by, 'notary_profile') and obj.created_by.notary_profile:
                notary = obj.created_by.notary_profile
                full_name = f"{notary.nome} {notary.cognome}".strip()
                return full_name if full_name else obj.created_by.email
            return obj.created_by.email
        return None
    
    def get_next_code_preview(self, obj):
        """Preview of the next code that will be generated."""
        return f"{obj.code_prefix}-{obj.current_progressive + 1:04d}"


class ActTemplateUploadSerializer(serializers.Serializer):
    """Serializer for uploading a new act template."""
    
    act_type_code = serializers.CharField(max_length=50)
    act_type_name = serializers.CharField(max_length=200)
    code_prefix = serializers.CharField(max_length=20, required=False)
    template_file = serializers.FileField()
    description = serializers.CharField(required=False, allow_blank=True)
    usage_notes = serializers.CharField(required=False, allow_blank=True)
    version = serializers.CharField(max_length=20, required=False, default='1.0')
    
    def validate_template_file(self, value):
        """Validate file type."""
        allowed_types = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
            'application/msword',  # .doc
            'application/pdf',  # .pdf
            'application/vnd.oasis.opendocument.text',  # .odt
        ]
        
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Tipo file non supportato. Formati accettati: DOCX, DOC, PDF, ODT"
            )
        
        # Max 50MB
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("Il file non può superare 50MB")
        
        return value
    
    def create(self, validated_data):
        """Create a new template."""
        from .models_templates import ACT_CODE_PREFIXES
        
        template_file = validated_data.pop('template_file')
        act_type_code = validated_data['act_type_code']
        
        # Auto-assign code prefix if not provided
        if 'code_prefix' not in validated_data or not validated_data['code_prefix']:
            validated_data['code_prefix'] = ACT_CODE_PREFIXES.get(act_type_code, 'ATT')
        
        # Deactivate any existing template for this act type
        ActTemplate.objects.filter(
            act_type_code=act_type_code,
            is_active=True
        ).update(is_active=False)
        
        # Create new template
        template = ActTemplate.objects.create(
            **validated_data,
            template_file=template_file,
            original_filename=template_file.name,
            mime_type=template_file.content_type,
            file_size=template_file.size,
            created_by=self.context['request'].user
        )
        
        return template


class ActCodeGenerateSerializer(serializers.Serializer):
    """Serializer for generating a new act code."""
    
    act_type_code = serializers.CharField(max_length=50)
    
    def validate_act_type_code(self, value):
        """Validate that template exists for this act type."""
        template = ActTemplate.get_active_template_for_act_type(value)
        if not template:
            raise serializers.ValidationError(
                f"Nessun template attivo trovato per la tipologia: {value}"
            )
        return value
    
    def save(self):
        """Generate and return the next code."""
        act_type_code = self.validated_data['act_type_code']
        template = ActTemplate.get_active_template_for_act_type(act_type_code)
        
        if not template:
            raise serializers.ValidationError(
                f"Nessun template attivo trovato per la tipologia: {act_type_code}"
            )
        
        # Genera il prossimo codice (incrementa automaticamente il progressivo)
        new_code = template.generate_next_code()
        
        return {
            'act_code': new_code,
            'act_type_code': act_type_code,
            'act_type_name': template.act_type_name,
            'code_prefix': template.code_prefix,
            'progressive': template.current_progressive,
        }

