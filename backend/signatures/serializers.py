from rest_framework import serializers
from .models import SignatureRequest, TimestampRequest


class SignatureRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignatureRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class TimestampRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimestampRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

