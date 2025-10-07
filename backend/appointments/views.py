from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Appointment
from .serializers import AppointmentSerializer
from accounts.models import UserRole


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'notary', 'client']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.NOTAIO:
            return Appointment.objects.filter(notary=user.notary_profile)
        elif user.role == UserRole.CLIENTE:
            return Appointment.objects.filter(client=user.client_profile)
        return Appointment.objects.none()


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all()

