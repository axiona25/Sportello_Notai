from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    notary_name = serializers.CharField(source='notary.studio_name', read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_client_name(self, obj):
        return obj.client.get_full_name()

