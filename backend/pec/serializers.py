from rest_framework import serializers
from .models import PecTemplate, PecMessage


class PecTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PecTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PecMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PecMessage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

