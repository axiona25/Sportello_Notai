from rest_framework import serializers
from .models import RtcSession, RtcParticipant


class RtcParticipantSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = RtcParticipant
        fields = '__all__'
        read_only_fields = ['id', 'joined_at']


class RtcSessionSerializer(serializers.ModelSerializer):
    participants = RtcParticipantSerializer(many=True, read_only=True)
    host_email = serializers.EmailField(source='host.email', read_only=True)
    
    class Meta:
        model = RtcSession
        fields = '__all__'
        read_only_fields = ['id', 'started_at', 'ended_at']

