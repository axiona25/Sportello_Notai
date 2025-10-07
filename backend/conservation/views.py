from rest_framework import generics, permissions
from .models import ConservationPackage
from .serializers import ConservationPackageSerializer


class ConservationPackageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConservationPackageSerializer
    
    def get_queryset(self):
        return ConservationPackage.objects.filter(notary__user=self.request.user)

