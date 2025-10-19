"""
Views for notaries management.
"""
from rest_framework import generics, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter
from datetime import datetime, timedelta, time
from collections import defaultdict

from .models import Notary, Client, Collaborator, NotaryAvailability, Appointment
from .serializers import (
    NotarySerializer, NotaryListSerializer, NotaryShowcaseSerializer,
    ClientSerializer, CollaboratorSerializer, NotaryAvailabilitySerializer,
    AppointmentSerializer, AvailableSlotSerializer
)
from accounts.models import UserRole


class NotaryListView(generics.ListAPIView):
    """List all notaries with filtering and search."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = NotaryListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['studio_name', 'address_city', 'specializations']
    ordering_fields = ['average_rating', 'total_reviews', 'created_at']
    ordering = ['-average_rating']
    
    def get_queryset(self):
        # Ottimizzato: select_related per evitare N+1 queries
        queryset = Notary.objects.select_related('user').all()
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(address_city__icontains=city)
        
        # Filter by province
        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(address_province__icontains=province)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(average_rating__gte=float(min_rating))
        
        # Filter by specialization
        specialization = self.request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specializations__contains=[specialization])
        
        # Nearby search (requires lat/lng)
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius_km = self.request.query_params.get('radius', '50')
        
        if lat and lng:
            point = Point(float(lng), float(lat), srid=4326)
            queryset = queryset.filter(
                coordinates__distance_lte=(point, D(km=float(radius_km)))
            ).distance(point).order_by('distance')
        
        return queryset


class NotaryDetailView(generics.RetrieveAPIView):
    """Get notary details."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = NotarySerializer
    queryset = Notary.objects.all()


class NotaryUpdateView(generics.RetrieveUpdateAPIView):
    """Update notary profile (notary only)."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotarySerializer
    
    def get_object(self):
        # Notary can only update their own profile
        if self.request.user.role != UserRole.NOTAIO:
            self.permission_denied(self.request)
        
        return self.request.user.notary_profile


class NotaryServicesView(APIView):
    """Manage notary services."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'services': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'name': {'type': 'string'},
                                'price': {'type': 'number'},
                                'description': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }
    )
    def post(self, request, pk):
        """Add/update services for a notary."""
        try:
            notary = Notary.objects.get(pk=pk)
        except Notary.DoesNotExist:
            return Response(
                {'error': 'Notaio non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if request.user.role != UserRole.NOTAIO or request.user.notary_profile.id != notary.id:
            return Response(
                {'error': 'Non autorizzato'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        services = request.data.get('services', [])
        notary.services = services
        notary.save()
        
        return Response(NotarySerializer(notary).data)


class NotaryAvailabilityListCreateView(generics.ListCreateAPIView):
    """List and create notary availability slots."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotaryAvailabilitySerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return NotaryAvailability.objects.filter(notary_id=notary_id)
    
    def perform_create(self, serializer):
        notary_id = self.kwargs.get('pk')
        notary = Notary.objects.get(pk=notary_id)
        
        # Check permission
        if self.request.user.role != UserRole.NOTAIO or self.request.user.notary_profile.id != notary.id:
            self.permission_denied(self.request)
        
        serializer.save(notary=notary)


class NotaryAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete availability slot."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotaryAvailabilitySerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return NotaryAvailability.objects.filter(notary_id=notary_id)


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """Client profile endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientSerializer
    
    def get_object(self):
        if self.request.user.role != UserRole.CLIENTE:
            self.permission_denied(self.request)
        
        return self.request.user.client_profile


class CollaboratorListView(generics.ListCreateAPIView):
    """List and create collaborators for a notary."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaboratorSerializer
    
    def get_queryset(self):
        notary_id = self.kwargs.get('pk')
        return Collaborator.objects.filter(notary_id=notary_id)
    
    def perform_create(self, serializer):
        notary_id = self.kwargs.get('pk')
        notary = Notary.objects.get(pk=notary_id)
        
        # Check permission - only notary can add collaborators
        if self.request.user.role != UserRole.NOTAIO or self.request.user.notary_profile.id != notary.id:
            self.permission_denied(self.request)
        
        serializer.save(notary=notary)


class NotaryShowcaseListView(generics.ListAPIView):
    """List all notary public showcases - visible to all users."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = NotaryShowcaseSerializer
    
    def get_queryset(self):
        """Return only notaries with valid licenses."""
        from django.utils import timezone
        today = timezone.now().date()
        
        # Filtra solo notai con licenza attiva e NON scaduta
        queryset = Notary.objects.select_related('user').filter(
            license_active=True
        ).filter(
            Q(license_expiry_date__isnull=True) | Q(license_expiry_date__gte=today)
        )
        
        return queryset
    
    @extend_schema(
        summary="Get all notary public showcases",
        description="Returns a list of all notary public profiles with valid licenses. No authentication required."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class NotaryShowcaseDetailView(generics.RetrieveUpdateAPIView):
    """Notary showcase profile - GET/PUT for notary's own showcase."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotaryShowcaseSerializer
    
    def get_object(self):
        # Notary can only access their own showcase
        if self.request.user.role != UserRole.NOTAIO:
            self.permission_denied(self.request, message="Only notaries can access this endpoint")
        
        return self.request.user.notary_profile
    
    @extend_schema(
        summary="Get my showcase profile",
        description="Returns the authenticated notary's showcase profile"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update my showcase profile",
        description="Update the authenticated notary's showcase profile (photo, services, description, etc.)",
        request=NotaryShowcaseSerializer
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        summary="Partially update my showcase profile",
        description="Partially update the authenticated notary's showcase profile",
        request=NotaryShowcaseSerializer
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class AvailableSlotsView(APIView):
    """Get available appointment slots for a notary."""
    
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Get available slots",
        description="Get available appointment slots for a notary in a date range",
        parameters=[
            OpenApiParameter('notary_id', str, OpenApiParameter.PATH),
            OpenApiParameter('start_date', str, OpenApiParameter.QUERY, description='Start date (YYYY-MM-DD)'),
            OpenApiParameter('end_date', str, OpenApiParameter.QUERY, description='End date (YYYY-MM-DD)'),
            OpenApiParameter('duration', int, OpenApiParameter.QUERY, description='Duration in minutes (default: 30)'),
        ],
        responses={200: AvailableSlotSerializer(many=True)}
    )
    def get(self, request, notary_id):
        """Calculate available slots based on notary's working hours and existing appointments."""
        
        # Get parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        duration = int(request.query_params.get('duration', 30))
        
        if not start_date_str or not end_date_str:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get notary
        try:
            notary = Notary.objects.get(id=notary_id)
        except Notary.DoesNotExist:
            return Response(
                {'error': 'Notary not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ⚠️ VERIFICA LICENZA NOTAIO
        if not notary.is_license_valid():
            return Response(
                {
                    'error': 'This notary cannot accept new appointments',
                    'reason': 'license_expired',
                    'message': 'La licenza del notaio è scaduta o disattivata',
                    'slots': []  # Nessuno slot disponibile
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get notary's working hours
        availabilities = NotaryAvailability.objects.filter(
            notary=notary,
            is_available=True
        )
        
        # Organize by day of week
        hours_by_day = defaultdict(list)
        for avail in availabilities:
            hours_by_day[avail.day_of_week].append({
                'start': avail.start_time,
                'end': avail.end_time
            })
        
        # Get existing appointments in date range
        existing_appointments = Appointment.objects.filter(
            notary=notary,
            date__gte=start_date,
            date__lte=end_date,
            status__in=['pending', 'accepted']
        ).values('date', 'start_time', 'end_time')
        
        # Organize appointments by date
        appointments_by_date = defaultdict(list)
        for apt in existing_appointments:
            appointments_by_date[apt['date']].append({
                'start': apt['start_time'],
                'end': apt['end_time']
            })
        
        # Calculate available slots
        available_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            day_of_week = current_date.weekday()  # 0 = Monday, 6 = Sunday
            
            # Check if notary works this day
            if day_of_week in hours_by_day:
                for work_period in hours_by_day[day_of_week]:
                    # Generate slots for this work period
                    slots = self._generate_slots(
                        current_date,
                        work_period['start'],
                        work_period['end'],
                        duration,
                        appointments_by_date.get(current_date, [])
                    )
                    available_slots.extend(slots)
            
            current_date += timedelta(days=1)
        
        serializer = AvailableSlotSerializer(available_slots, many=True)
        return Response(serializer.data)
    
    def _generate_slots(self, date, start_time, end_time, duration, existing_appointments):
        """Generate time slots for a work period, excluding existing appointments."""
        
        slots = []
        current_time = datetime.combine(date, start_time)
        end_datetime = datetime.combine(date, end_time)
        slot_duration = timedelta(minutes=duration)
        
        while current_time + slot_duration <= end_datetime:
            slot_start = current_time.time()
            slot_end = (current_time + slot_duration).time()
            
            # Check if slot conflicts with existing appointment
            is_available = True
            for apt in existing_appointments:
                if not (slot_end <= apt['start'] or slot_start >= apt['end']):
                    is_available = False
                    break
            
            slots.append({
                'date': date,
                'start_time': slot_start,
                'end_time': slot_end,
                'duration_minutes': duration,
                'is_available': is_available
            })
            
            current_time += slot_duration
        
        return slots


class AppointmentCreateView(generics.CreateAPIView):
    """Create a new appointment (client only)."""
    
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Book an appointment",
        description="Book a new appointment with a notary (client only)",
        request=AppointmentSerializer
    )
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """Create appointment with concurrency lock."""
        
        # Only clients can book appointments
        if request.user.role != 'CLIENTE':
            return Response(
                {'error': 'Only clients can book appointments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notary_id = request.data.get('notary')
        appointment_date = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        
        # ⚠️ VERIFICA LICENZA NOTAIO
        try:
            notary = Notary.objects.get(id=notary_id)
            if not notary.is_license_valid():
                return Response(
                    {
                        'error': 'This notary cannot accept new appointments at this time',
                        'reason': 'license_expired',
                        'message': 'La licenza del notaio è scaduta o disattivata'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        except Notary.DoesNotExist:
            return Response(
                {'error': 'Notary not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if slot is still available (with SELECT FOR UPDATE for concurrency)
        existing = Appointment.objects.select_for_update().filter(
            notary_id=notary_id,
            date=appointment_date,
            status__in=['pending', 'accepted']
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        ).exists()
        
        if existing:
            return Response(
                {'error': 'This time slot is no longer available'},
                status=status.HTTP_409_CONFLICT
            )
        
        # Set client automatically
        request.data['client'] = request.user.id
        request.data['status'] = 'pending'
        
        return super().post(request, *args, **kwargs)


class AppointmentListView(generics.ListAPIView):
    """List appointments (filtered by user role)."""
    
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['date', 'start_time', 'created_at']
    ordering = ['date', 'start_time']
    filterset_fields = ['status', 'appointment_type']
    
    @extend_schema(
        summary="List appointments",
        description="List appointments (clients see their own, notaries see their appointments)"
    )
    def get_queryset(self):
        """Filter appointments by user role."""
        user = self.request.user
        
        if user.role == 'NOTAIO':
            # Notary sees appointments for their office
            return Appointment.objects.filter(
                notary__user=user
            ).select_related('notary', 'client')
        else:
            # Client sees their own appointments
            return Appointment.objects.filter(
                client=user
            ).select_related('notary', 'client')


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a specific appointment."""
    
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get appointment details",
        description="Get details of a specific appointment"
    )
    def get_queryset(self):
        """Filter by user role."""
        user = self.request.user
        
        if user.role == 'NOTAIO':
            return Appointment.objects.filter(notary__user=user)
        else:
            return Appointment.objects.filter(client=user)
    
    @extend_schema(
        summary="Update appointment",
        description="Update appointment (notary can change status, client can cancel)"
    )
    def update(self, request, *args, **kwargs):
        """Only allow specific updates based on user role."""
        appointment = self.get_object()
        
        if request.user.role == 'NOTAIO':
            # Notary can update status and notes
            allowed_fields = ['status', 'notary_notes', 'rejection_reason']
        else:
            # Client can only cancel
            if request.data.get('status') != 'cancelled':
                return Response(
                    {'error': 'Clients can only cancel appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            allowed_fields = ['status']
        
        # Filter request data
        filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(appointment, data=filtered_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


class AppointmentActionView(APIView):
    """Accept or reject an appointment (notary only)."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Accept or reject appointment",
        description="Notary can accept or reject a pending appointment",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'action': {'type': 'string', 'enum': ['accept', 'reject']},
                    'rejection_reason': {'type': 'string'}
                }
            }
        }
    )
    def post(self, request, appointment_id):
        """Accept or reject appointment."""
        
        if request.user.role != 'NOTAIO':
            return Response(
                {'error': 'Only notaries can accept/reject appointments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            appointment = Appointment.objects.get(
                id=appointment_id,
                notary__user=request.user
            )
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')
        
        if action == 'accept':
            appointment.status = 'accepted'
            appointment.save()
            message = 'Appointment accepted'
        elif action == 'reject':
            appointment.status = 'rejected'
            appointment.rejection_reason = request.data.get('rejection_reason', '')
            appointment.save()
            message = 'Appointment rejected'
        else:
            return Response(
                {'error': 'Invalid action. Use "accept" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AppointmentSerializer(appointment)
        return Response({
            'message': message,
            'appointment': serializer.data
        })


# ========================================
# ADMIN VIEWS - Gestione Notai
# ========================================

from .serializers import (
    AdminNotarySerializer, 
    AdminNotaryListSerializer, 
    AdminNotaryLicenseSerializer
)


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN


class AdminNotaryListCreateView(generics.ListCreateAPIView):
    """
    Admin view to list all notaries or create a new one.
    
    GET: Lista tutti i notai con filtri
    POST: Crea un nuovo notaio
    """
    
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['studio_name', 'user__email', 'address_city', 'phone']
    ordering_fields = ['studio_name', 'created_at', 'license_expiry_date', 'average_rating']
    ordering = ['-created_at']
    filterset_fields = ['license_active', 'address_city', 'address_province']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminNotarySerializer
        return AdminNotaryListSerializer
    
    def get_queryset(self):
        queryset = Notary.objects.select_related('user').all()
        
        # Filtro per stato licenza
        license_status = self.request.query_params.get('license_status')
        if license_status:
            from django.utils import timezone
            today = timezone.now().date()
            
            if license_status == 'active':
                queryset = queryset.filter(
                    license_active=True
                ).filter(
                    Q(license_expiry_date__isnull=True) | Q(license_expiry_date__gte=today)
                )
            elif license_status == 'expired':
                queryset = queryset.filter(
                    license_active=True,
                    license_expiry_date__lt=today
                )
            elif license_status == 'expiring_soon':
                # Scade entro 30 giorni
                in_30_days = today + timedelta(days=30)
                queryset = queryset.filter(
                    license_active=True,
                    license_expiry_date__gte=today,
                    license_expiry_date__lte=in_30_days
                )
            elif license_status == 'disabled':
                queryset = queryset.filter(license_active=False)
        
        return queryset
    
    @extend_schema(
        summary="Lista notai (Admin)",
        description="Recupera l'elenco di tutti i notai con informazioni su licenze e filtri avanzati",
        parameters=[
            OpenApiParameter('license_status', str, description='Filtra per stato licenza: active, expired, expiring_soon, disabled'),
            OpenApiParameter('license_active', bool, description='Filtra per licenza attiva/disattivata'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="Crea notaio (Admin)",
        description="Crea un nuovo notaio con tutti i dati iniziali"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AdminNotaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view to retrieve, update or delete a specific notary.
    
    GET: Dettaglio notaio completo
    PUT/PATCH: Aggiorna dati notaio
    DELETE: Elimina notaio (soft delete: disattiva licenza)
    """
    
    permission_classes = [IsAdminUser]
    serializer_class = AdminNotarySerializer
    queryset = Notary.objects.select_related('user').all()
    lookup_field = 'id'
    
    @extend_schema(
        summary="Dettaglio notaio (Admin)",
        description="Recupera tutti i dati di un notaio specifico, incluse le informazioni sulla licenza"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="Aggiorna notaio (Admin)",
        description="Aggiorna i dati di un notaio, inclusi i parametri della licenza"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        summary="Aggiorna parzialmente notaio (Admin)",
        description="Aggiorna solo alcuni campi di un notaio"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @extend_schema(
        summary="Elimina notaio (Admin)",
        description="Disattiva la licenza del notaio (soft delete)"
    )
    def delete(self, request, *args, **kwargs):
        """Soft delete: disabilita la licenza invece di eliminare il record."""
        notary = self.get_object()
        notary.license_active = False
        notary.save()
        return Response(
            {'message': f'Notaio {notary.studio_name} disabilitato con successo'},
            status=status.HTTP_200_OK
        )


class AdminNotaryLicenseUpdateView(generics.UpdateAPIView):
    """
    Admin view to update ONLY license-related fields of a notary.
    
    PATCH: Aggiorna solo i dati di licenza
    """
    
    permission_classes = [IsAdminUser]
    serializer_class = AdminNotaryLicenseSerializer
    queryset = Notary.objects.all()
    lookup_field = 'id'
    http_method_names = ['patch']  # Solo PATCH
    
    @extend_schema(
        summary="Aggiorna licenza notaio (Admin)",
        description="Aggiorna esclusivamente i parametri di licenza di un notaio (attivazione, scadenza, pagamento)"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class AdminNotaryStatsView(APIView):
    """
    Admin view to get general statistics about notaries and licenses.
    
    GET: Statistiche generali dashboard admin
    """
    
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Statistiche notai (Admin)",
        description="Recupera statistiche aggregate su notai, licenze, appuntamenti"
    )
    def get(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        
        # Conta totali
        total_notaries = Notary.objects.count()
        active_licenses = Notary.objects.filter(
            license_active=True
        ).filter(
            Q(license_expiry_date__isnull=True) | Q(license_expiry_date__gte=today)
        ).count()
        
        expired_licenses = Notary.objects.filter(
            license_active=True,
            license_expiry_date__lt=today
        ).count()
        
        # Licenze in scadenza (prossimi 30 giorni)
        in_30_days = today + timedelta(days=30)
        expiring_soon = Notary.objects.filter(
            license_active=True,
            license_expiry_date__gte=today,
            license_expiry_date__lte=in_30_days
        ).count()
        
        disabled_licenses = Notary.objects.filter(license_active=False).count()
        
        # Appuntamenti stats
        total_appointments = Appointment.objects.count()
        pending_appointments = Appointment.objects.filter(status='pending').count()
        completed_appointments = Appointment.objects.filter(status='completed').count()
        
        # Revenue stats (approssimato)
        monthly_revenue = Notary.objects.filter(
            license_active=True,
            license_payment_frequency='monthly'
        ).aggregate(
            total=transaction.models.Sum('license_payment_amount')
        )['total'] or 0
        
        annual_revenue = Notary.objects.filter(
            license_active=True,
            license_payment_frequency='annual'
        ).aggregate(
            total=transaction.models.Sum('license_payment_amount')
        )['total'] or 0
        
        return Response({
            'notaries': {
                'total': total_notaries,
                'active_licenses': active_licenses,
                'expired_licenses': expired_licenses,
                'expiring_soon': expiring_soon,
                'disabled': disabled_licenses
            },
            'appointments': {
                'total': total_appointments,
                'pending': pending_appointments,
                'completed': completed_appointments
            },
            'revenue': {
                'monthly': float(monthly_revenue),
                'annual': float(annual_revenue),
                'projected_annual': float(monthly_revenue * 12 + annual_revenue)
            },
            'timestamp': timezone.now().isoformat()
        })

