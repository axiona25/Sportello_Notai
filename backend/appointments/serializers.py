from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    notary_name = serializers.CharField(source='notary.studio_name', read_only=True)
    client_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_client_name(self, obj):
        return obj.client.get_full_name()

