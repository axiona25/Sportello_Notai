"""
Views per la gestione degli appuntamenti e agende condivise.
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    Appuntamento, DisponibilitaNotaio, EccezioneDisponibilita,
    PartecipanteAppuntamento, AppointmentStatus
)
from .serializers import (
    AppuntamentoSerializer, DisponibilitaNotaioSerializer,
    EccezioneDisponibilitaSerializer, PartecipanteAppuntamentoSerializer,
    CreaRichiestaAppuntamentoSerializer, ApprovaRifiutaAppuntamentoSerializer,
    AggiornaAppuntamentoSerializer, InvitoPartnerSerializer,
    RispostaInvitoSerializer, RichiestaSlotDisponibiliSerializer,
    SlotDisponibileSerializer, AgendaSerializer
)
from .services import DisponibilitaService, AppuntamentoService
from accounts.models import Notaio, Cliente, Partner, UserRole
from audit.models import AuditLog, AuditAction


# ============================================
# DISPONIBILITÀ NOTAIO
# ============================================

class DisponibilitaNotaioViewSet(viewsets.ModelViewSet):
    """
    ViewSet per gestire la disponibilità del notaio.
    Solo i notai possono gestire la propria disponibilità.
    """
    queryset = DisponibilitaNotaio.objects.all()
    serializer_class = DisponibilitaNotaioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notaio', 'giorno_settimana', 'is_active']
    ordering_fields = ['giorno_settimana', 'ora_inizio']
    ordering = ['giorno_settimana', 'ora_inizio']
    
    def get_queryset(self):
        """Filtra in base al ruolo."""
        user = self.request.user
        
        if user.role == 'admin':
            return DisponibilitaNotaio.objects.all()
        elif user.role == 'notaio':
            return DisponibilitaNotaio.objects.filter(notaio__user=user)
        else:
            # Clienti e partner vedono solo disponibilità attive
            return DisponibilitaNotaio.objects.filter(
                is_active=True,
                permetti_prenotazioni_online=True
            )
    
    def perform_create(self, serializer):
        """Crea disponibilità solo per il proprio profilo notaio."""
        if self.request.user.role != 'notaio':
            raise permissions.PermissionDenied("Solo i notai possono creare disponibilità")
        
        notaio = Notaio.objects.get(user=self.request.user)
        disponibilita = serializer.save(notaio=notaio)
        
        AuditLog.log(
            action=AuditAction.CREATE,
            user=self.request.user,
            resource_type='disponibilita_notaio',
            resource_id=disponibilita.id,
            description=f"Disponibilità creata: {disponibilita}",
            request=self.request
        )


class EccezioneDisponibilitaViewSet(viewsets.ModelViewSet):
    """
    ViewSet per gestire le eccezioni (chiusure/ferie del notaio).
    """
    queryset = EccezioneDisponibilita.objects.all()
    serializer_class = EccezioneDisponibilitaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notaio', 'is_chiusura']
    ordering = ['data_inizio']
    
    def get_queryset(self):
        """Filtra in base al ruolo."""
        user = self.request.user
        
        if user.role == 'admin':
            return EccezioneDisponibilita.objects.all()
        elif user.role == 'notaio':
            return EccezioneDisponibilita.objects.filter(notaio__user=user)
        else:
            # Altri vedono solo chiusure
            return EccezioneDisponibilita.objects.filter(is_chiusura=True)
    
    def perform_create(self, serializer):
        """Crea eccezione solo per il proprio profilo notaio."""
        if self.request.user.role != 'notaio':
            raise permissions.PermissionDenied("Solo i notai possono creare eccezioni")
        
        notaio = Notaio.objects.get(user=self.request.user)
        eccezione = serializer.save(notaio=notaio)
        
        AuditLog.log(
            action=AuditAction.CREATE,
            user=self.request.user,
            resource_type='eccezione_disponibilita',
            resource_id=eccezione.id,
            description=f"Eccezione creata: {eccezione.motivo}",
            request=self.request
        )


# ============================================
# APPUNTAMENTI
# ============================================

class AppuntamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo per gestire gli appuntamenti.
    Supporta tutto il flusso: richiesta, approvazione, invito partners, conferma.
    """
    queryset = Appuntamento.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo', 'notaio', 'is_online']
    search_fields = ['titolo', 'descrizione']
    ordering_fields = ['start_time', 'created_at']
    ordering = ['-start_time']
    
    def get_serializer_class(self):
        """Scegli il serializer in base all'action."""
        if self.action == 'create':
            return CreaRichiestaAppuntamentoSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return AggiornaAppuntamentoSerializer
        return AppuntamentoSerializer
    
    def get_queryset(self):
        """Filtra appuntamenti in base al ruolo."""
        from django.db.models import Q
        from datetime import datetime
        user = self.request.user
        
        # Base queryset: escludi appuntamenti rifiutati
        base_qs = Appuntamento.objects.exclude(status=AppointmentStatus.RIFIUTATO)
        
        if user.role == 'admin':
            queryset = base_qs
        elif user.role == 'notaio':
            # Notaio vede i suoi appuntamenti (campo unificato Notary o deprecato Notaio)
            queryset = base_qs.filter(
                Q(notary__user=user) | Q(notaio__user=user)
            )
        elif user.role == 'cliente':
            # Cliente vede appuntamenti dove partecipa
            queryset = base_qs.filter(
                partecipanti__cliente__user=user
            ).distinct()
        elif user.role == 'partner':
            # Partner vede appuntamenti dove è invitato
            queryset = base_qs.filter(
                partecipanti__partner__user=user
            ).distinct()
        else:
            queryset = Appuntamento.objects.none()
        
        # Filtro per data (se fornito come parametro)
        data_param = self.request.query_params.get('data')
        if data_param:
            try:
                # Supporta sia formato YYYY-MM-DD che DD/MM/YYYY
                if '-' in data_param:
                    data_obj = datetime.strptime(data_param, '%Y-%m-%d').date()
                else:
                    data_obj = datetime.strptime(data_param, '%d/%m/%Y').date()
                queryset = queryset.filter(start_time__date=data_obj)
            except ValueError:
                # Se il formato data è invalido, ignora il filtro
                pass
        
        # Filtro per anno e mese (opzionale, per compatibilità con getAppuntamentiMese)
        anno_param = self.request.query_params.get('anno')
        mese_param = self.request.query_params.get('mese')
        if anno_param and mese_param:
            try:
                anno = int(anno_param)
                mese = int(mese_param)
                queryset = queryset.filter(
                    start_time__year=anno,
                    start_time__month=mese
                )
            except ValueError:
                pass
        
        return queryset
    
    def perform_create(self, serializer):
        """Crea richiesta di appuntamento."""
        appuntamento = serializer.save()
        
        AuditLog.log(
            action=AuditAction.CREATE,
            user=self.request.user,
            resource_type='appuntamento',
            resource_id=appuntamento.id,
            description=f"Appuntamento richiesto: {appuntamento.titolo}",
            request=self.request
        )
    
    @action(detail=False, methods=['post'], url_path='slot-disponibili')
    def slot_disponibili(self, request):
        """
        Ottiene gli slot disponibili per un notaio (per il wizard cliente).
        POST /api/appuntamenti/slot-disponibili/
        Body: {notaio_id, data_inizio, data_fine, durata_minuti}
        """
        serializer = RichiestaSlotDisponibiliSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notaio = serializer.validated_data['notaio']
        data_inizio = serializer.validated_data['data_inizio']
        data_fine = serializer.validated_data['data_fine']
        durata_minuti = serializer.validated_data['durata_minuti']
        
        # Calcola slot disponibili
        slots = DisponibilitaService.get_slots_disponibili(
            notaio=notaio,
            data_inizio=data_inizio,
            data_fine=data_fine,
            durata_minuti=durata_minuti
        )
        
        # Serializza risultati
        slots_data = [slot.to_dict() for slot in slots]
        
        return Response({
            'notaio_id': str(notaio.id),
            'notaio_nome': notaio.nome_completo,
            'periodo': {
                'data_inizio': data_inizio.isoformat(),
                'data_fine': data_fine.isoformat()
            },
            'durata_minuti': durata_minuti,
            'slots_disponibili': slots_data,
            'totale_slots': len(slots_data)
        })
    
    @action(detail=True, methods=['post'], url_path='approva-rifiuta')
    def approva_rifiuta(self, request, pk=None):
        """
        Il notaio approva o rifiuta una richiesta di appuntamento.
        POST /api/appuntamenti/{id}/approva-rifiuta/
        Body: {approva: true/false, motivo: "...", confermato_da: "..."}
        """
        appuntamento = self.get_object()
        
        # Solo il notaio può approvare/rifiutare
        if request.user.role != 'notaio':
            return Response(
                {'error': 'Solo il notaio può approvare o rifiutare'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica che sia l'appuntamento del notaio
        if appuntamento.notaio.user != request.user:
            return Response(
                {'error': 'Non puoi gestire appuntamenti di altri notai'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ApprovaRifiutaAppuntamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            if serializer.validated_data['approva']:
                # Approva
                confermato_da = serializer.validated_data.get('confermato_da', request.user.email)
                appuntamento = AppuntamentoService.approva_appuntamento(
                    appuntamento, confermato_da
                )
                message = 'Appuntamento approvato'
                
                AuditLog.log(
                    action=AuditAction.UPDATE,
                    user=request.user,
                    resource_type='appuntamento',
                    resource_id=appuntamento.id,
                    description=f"Appuntamento approvato",
                    request=request
                )
            else:
                # Rifiuta
                motivo = serializer.validated_data.get('motivo')
                appuntamento = AppuntamentoService.rifiuta_appuntamento(
                    appuntamento, motivo
                )
                message = 'Appuntamento rifiutato'
                
                AuditLog.log(
                    action=AuditAction.UPDATE,
                    user=request.user,
                    resource_type='appuntamento',
                    resource_id=appuntamento.id,
                    description=f"Appuntamento rifiutato: {motivo}",
                    request=request
                )
            
            return Response({
                'message': message,
                'appuntamento': AppuntamentoSerializer(appuntamento).data
            })
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='invita-partners')
    def invita_partners(self, request, pk=None):
        """
        Il notaio invita uno o più partners all'appuntamento approvato.
        POST /api/appuntamenti/{id}/invita-partners/
        Body: {partner_ids: [uuid, uuid, ...], ruolo: "invitato"}
        """
        appuntamento = self.get_object()
        
        # Solo il notaio può invitare
        if request.user.role != 'notaio':
            return Response(
                {'error': 'Solo il notaio può invitare partners'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appuntamento.notaio.user != request.user:
            return Response(
                {'error': 'Non puoi gestire appuntamenti di altri notai'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = InvitoPartnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            partner_ids = serializer.validated_data['partner_ids']
            ruolo = serializer.validated_data['ruolo']
            
            partners = Partner.objects.filter(id__in=partner_ids)
            
            partecipanti_creati = AppuntamentoService.invita_partners(
                appuntamento=appuntamento,
                partners=partners,
                ruolo=ruolo
            )
            
            AuditLog.log(
                action=AuditAction.CREATE,
                user=request.user,
                resource_type='partecipante_appuntamento',
                resource_id=appuntamento.id,
                description=f"Invitati {len(partecipanti_creati)} partners",
                request=request
            )
            
            return Response({
                'message': f'{len(partecipanti_creati)} partner(s) invitati',
                'partecipanti': PartecipanteAppuntamentoSerializer(
                    partecipanti_creati, many=True
                ).data
            })
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='annulla')
    def annulla(self, request, pk=None):
        """
        Annulla un appuntamento.
        POST /api/appuntamenti/{id}/annulla/
        Body: {motivo: "..."}
        """
        appuntamento = self.get_object()
        
        # Verifica permessi
        can_cancel = False
        if request.user.role == 'notaio' and appuntamento.notaio.user == request.user:
            can_cancel = True
        elif request.user.role == 'cliente':
            # Cliente può annullare se è il richiedente
            if appuntamento.partecipanti.filter(
                cliente__user=request.user,
                ruolo='richiedente'
            ).exists():
                can_cancel = True
        
        if not can_cancel:
            return Response(
                {'error': 'Non hai i permessi per annullare questo appuntamento'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            motivo = request.data.get('motivo', '')
            appuntamento = AppuntamentoService.annulla_appuntamento(
                appuntamento, motivo
            )
            
            AuditLog.log(
                action=AuditAction.UPDATE,
                user=request.user,
                resource_type='appuntamento',
                resource_id=appuntamento.id,
                description=f"Appuntamento annullato: {motivo}",
                request=request
            )
            
            return Response({
                'message': 'Appuntamento annullato',
                'appuntamento': AppuntamentoSerializer(appuntamento).data
            })
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='mia-agenda')
    def mia_agenda(self, request):
        """
        Ottiene l'agenda dell'utente loggato.
        GET /api/appuntamenti/mia-agenda/?data_inizio=...&data_fine=...
        """
        # Parsing parametri
        try:
            data_inizio_str = request.query_params.get('data_inizio')
            data_fine_str = request.query_params.get('data_fine')
            
            if not data_inizio_str:
                data_inizio = timezone.now()
            else:
                data_inizio = datetime.fromisoformat(data_inizio_str.replace('Z', '+00:00'))
            
            if not data_fine_str:
                data_fine = data_inizio + timedelta(days=30)
            else:
                data_fine = datetime.fromisoformat(data_fine_str.replace('Z', '+00:00'))
        
        except ValueError:
            return Response(
                {'error': 'Formato data non valido. Usa ISO 8601'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        appuntamenti = []
        
        if user.role == 'notaio':
            notaio = Notaio.objects.get(user=user)
            appuntamenti = AppuntamentoService.get_agenda_notaio(
                notaio, data_inizio, data_fine
            )
        elif user.role == 'cliente':
            cliente = Cliente.objects.get(user=user)
            appuntamenti = AppuntamentoService.get_agenda_cliente(
                cliente, data_inizio, data_fine
            )
        elif user.role == 'partner':
            partner = Partner.objects.get(user=user)
            appuntamenti = AppuntamentoService.get_agenda_partner(
                partner, data_inizio, data_fine
            )
        
        return Response({
            'data_inizio': data_inizio.isoformat(),
            'data_fine': data_fine.isoformat(),
            'appuntamenti': AppuntamentoSerializer(appuntamenti, many=True).data,
            'totale': len(appuntamenti)
        })


# ============================================
# PARTECIPANTI (per rispondere agli inviti)
# ============================================

class PartecipanteAppuntamentoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet per visualizzare e rispondere agli inviti.
    """
    queryset = PartecipanteAppuntamento.objects.all()
    serializer_class = PartecipanteAppuntamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['appuntamento', 'status', 'ruolo']
    
    def get_queryset(self):
        """Filtra in base all'utente."""
        user = self.request.user
        
        if user.role == 'admin':
            return PartecipanteAppuntamento.objects.all()
        elif user.role == 'notaio':
            # Notaio vede partecipanti dei suoi appuntamenti
            return PartecipanteAppuntamento.objects.filter(
                appuntamento__notaio__user=user
            )
        elif user.role == 'cliente':
            # Cliente vede solo i propri
            return PartecipanteAppuntamento.objects.filter(cliente__user=user)
        elif user.role == 'partner':
            # Partner vede solo i propri
            return PartecipanteAppuntamento.objects.filter(partner__user=user)
        
        return PartecipanteAppuntamento.objects.none()
    
    @action(detail=True, methods=['post'], url_path='rispondi')
    def rispondi(self, request, pk=None):
        """
        Risponde a un invito (accetta/rifiuta).
        POST /api/partecipanti/{id}/rispondi/
        Body: {accetta: true/false, note: "..."}
        """
        partecipante = self.get_object()
        
        # Verifica che sia il partecipante giusto
        can_respond = False
        if request.user.role == 'cliente' and partecipante.cliente and partecipante.cliente.user == request.user:
            can_respond = True
        elif request.user.role == 'partner' and partecipante.partner and partecipante.partner.user == request.user:
            can_respond = True
        
        if not can_respond:
            return Response(
                {'error': 'Non puoi rispondere a questo invito'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RispostaInvitoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            if serializer.validated_data['accetta']:
                note = serializer.validated_data.get('note')
                partecipante = AppuntamentoService.accetta_invito_partner(
                    partecipante, note
                )
                message = 'Invito accettato'
                
                AuditLog.log(
                    action=AuditAction.UPDATE,
                    user=request.user,
                    resource_type='partecipante_appuntamento',
                    resource_id=partecipante.id,
                    description=f"Invito accettato",
                    request=request
                )
            else:
                note = serializer.validated_data.get('note')
                partecipante = AppuntamentoService.rifiuta_invito_partner(
                    partecipante, note
                )
                message = 'Invito rifiutato'
                
                AuditLog.log(
                    action=AuditAction.UPDATE,
                    user=request.user,
                    resource_type='partecipante_appuntamento',
                    resource_id=partecipante.id,
                    description=f"Invito rifiutato",
                    request=request
                )
            
            return Response({
                'message': message,
                'partecipante': PartecipanteAppuntamentoSerializer(partecipante).data,
                'appuntamento': AppuntamentoSerializer(partecipante.appuntamento).data
            })
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

