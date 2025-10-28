"""
Serializers per Protocolli Atti Notarili.
"""
from rest_framework import serializers
from .models_protocollo import ProtocolloAttoNotarile


class ProtocolloAttoNotarialeSerializer(serializers.ModelSerializer):
    """Serializer completo per Protocollo Atto Notarile."""
    
    # Campi calcolati
    notaio_nome = serializers.SerializerMethodField()
    cliente_nome = serializers.SerializerMethodField()
    appuntamento_id = serializers.UUIDField(source='appuntamento.id', read_only=True)
    documento_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProtocolloAttoNotarile
        fields = [
            'id',
            'numero_protocollo',
            'appuntamento',
            'appuntamento_id',
            'template',
            'notaio',
            'notaio_nome',
            'cliente_nome',
            'tipologia_atto_code',
            'tipologia_atto_nome',
            'code_prefix',
            'progressivo',
            'parti_coinvolte',
            'stato',
            'data_creazione',
            'data_firma',
            'data_protocollo',
            'data_annullamento',
            'motivo_annullamento',
            'documento_finale_url',
            'documento_url',
            'note',
            'metadata',
            'created_by',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'numero_protocollo',
            'code_prefix',
            'progressivo',
            'data_creazione',
            'data_firma',
            'data_protocollo',
            'data_annullamento',
            'updated_at',
        ]
    
    def get_notaio_nome(self, obj):
        """Nome completo del notaio."""
        if obj.notaio:
            return f"{obj.notaio.nome} {obj.notaio.cognome}"
        return "N/A"
    
    def get_cliente_nome(self, obj):
        """Nome del cliente dalle parti coinvolte."""
        return obj.parti_coinvolte.get('cliente', {}).get('nome', 'N/A')
    
    def get_documento_url(self, obj):
        """URL completo del documento finale."""
        if obj.documento_finale_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.documento_finale_url.url)
            return obj.documento_finale_url.url
        return None


class ProtocolloAttoListSerializer(serializers.ModelSerializer):
    """Serializer ridotto per lista protocolli."""
    
    notaio_nome = serializers.SerializerMethodField()
    cliente_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = ProtocolloAttoNotarile
        fields = [
            'id',
            'numero_protocollo',
            'tipologia_atto_nome',
            'notaio_nome',
            'cliente_nome',
            'stato',
            'data_creazione',
            'data_protocollo',
        ]
    
    def get_notaio_nome(self, obj):
        if obj.notaio:
            return f"{obj.notaio.nome} {obj.notaio.cognome}"
        return "N/A"
    
    def get_cliente_nome(self, obj):
        return obj.parti_coinvolte.get('cliente', {}).get('nome', 'N/A')


class CreaProtocolloSerializer(serializers.Serializer):
    """Serializer per creare un nuovo protocollo da appuntamento."""
    
    appuntamento_id = serializers.UUIDField(required=True)
    note = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)
    
    def validate_appuntamento_id(self, value):
        """Verifica che l'appuntamento esista e non abbia già un protocollo."""
        from appointments.models import Appuntamento
        
        try:
            appuntamento = Appuntamento.objects.get(id=value)
        except Appuntamento.DoesNotExist:
            raise serializers.ValidationError("Appuntamento non trovato")
        
        if hasattr(appuntamento, 'protocollo_atto'):
            raise serializers.ValidationError(
                f"Protocollo già esistente: {appuntamento.protocollo_atto.numero_protocollo}"
            )
        
        return value
    
    def create(self, validated_data):
        """Crea un nuovo protocollo."""
        from appointments.models import Appuntamento
        
        appuntamento = Appuntamento.objects.get(id=validated_data['appuntamento_id'])
        user = self.context['request'].user
        
        protocollo = ProtocolloAttoNotarile.genera_protocollo_da_appuntamento(
            appuntamento=appuntamento,
            created_by=user
        )
        
        # Aggiungi note e metadata se forniti
        if validated_data.get('note'):
            protocollo.note = validated_data['note']
        if validated_data.get('metadata'):
            protocollo.metadata = validated_data['metadata']
        
        if protocollo.note or protocollo.metadata != {}:
            protocollo.save(update_fields=['note', 'metadata'])
        
        return protocollo


class FirmaAttoSerializer(serializers.Serializer):
    """Serializer per firmare un atto."""
    
    documento_firmato = serializers.FileField(required=False)
    
    def update(self, instance, validated_data):
        """Registra la firma dell'atto."""
        documento = validated_data.get('documento_firmato')
        instance.firma_atto(documento_firmato=documento)
        return instance


class ProtocollaAttoSerializer(serializers.Serializer):
    """Serializer per protocollare definitivamente un atto."""
    
    def update(self, instance, validated_data):
        """Protocolla l'atto."""
        instance.protocolla_atto()
        return instance


class AnnullaAttoSerializer(serializers.Serializer):
    """Serializer per annullare un atto."""
    
    motivo = serializers.CharField(required=True)
    
    def update(self, instance, validated_data):
        """Annulla l'atto."""
        user = self.context['request'].user
        instance.annulla_atto(
            motivo=validated_data['motivo'],
            user=user
        )
        return instance

