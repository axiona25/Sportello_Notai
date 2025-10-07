from rest_framework import generics, permissions
from .models import SignatureRequest, TimestampRequest
from .serializers import SignatureRequestSerializer, TimestampRequestSerializer


class SignatureRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignatureRequestSerializer
    
    def get_queryset(self):
        return SignatureRequest.objects.filter(signer=self.request.user)


class TimestampRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TimestampRequestSerializer
    
    def get_queryset(self):
        return TimestampRequest.objects.filter(requested_by=self.request.user)

