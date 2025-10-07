from rest_framework import generics, permissions
from .models import PecTemplate, PecMessage
from .serializers import PecTemplateSerializer, PecMessageSerializer


class PecTemplateListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PecTemplateSerializer
    
    def get_queryset(self):
        return PecTemplate.objects.filter(notary__user=self.request.user)


class PecMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PecMessageSerializer
    
    def get_queryset(self):
        return PecMessage.objects.filter(sender=self.request.user)


class PecMessageDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PecMessageSerializer
    queryset = PecMessage.objects.all()

