from rest_framework import serializers
from .models import ConservationPackage


class ConservationPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConservationPackage
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

