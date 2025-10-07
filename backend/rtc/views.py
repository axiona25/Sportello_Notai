from rest_framework import generics, permissions
from .models import RtcSession, RtcParticipant
from .serializers import RtcSessionSerializer, RtcParticipantSerializer


class RtcSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RtcSessionSerializer
    
    def get_queryset(self):
        return RtcSession.objects.filter(host=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(host=self.request.user)


class RtcSessionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RtcSessionSerializer
    queryset = RtcSession.objects.all()

