"""
Views per API Protocolli Atti Notarili.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models_protocollo import ProtocolloAttoNotarile
from .serializers_protocollo import (
    ProtocolloAttoNotarialeSerializer,
    ProtocolloAttoListSerializer,
    CreaProtocolloSerializer,
    FirmaAttoSerializer,
    ProtocollaAttoSerializer,
    AnnullaAttoSerializer,
)


class ProtocolloAttoViewSet(viewsets.ModelViewSet):
    """
    ViewSet per gestire i Protocolli Atti Notarili.
    
    list: Lista tutti i protocolli (con filtri)
    retrieve: Dettaglio di un singolo protocollo
    create: Crea un nuovo protocollo da appuntamento
    """
    
    queryset = ProtocolloAttoNotarile.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa serializer diversi per lista/dettaglio."""
        if self.action == 'list':
            return ProtocolloAttoListSerializer
        elif self.action == 'create':
            return CreaProtocolloSerializer
        elif self.action == 'firma':
            return FirmaAttoSerializer
        elif self.action == 'protocolla':
            return ProtocollaAttoSerializer
        elif self.action == 'annulla':
            return AnnullaAttoSerializer
        return ProtocolloAttoNotarialeSerializer
    
    def get_queryset(self):
        """Filtra protocolli in base all'utente e parametri."""
        user = self.request.user
        qs = ProtocolloAttoNotarile.objects.select_related(
            'appuntamento',
            'template',
            'notaio',
            'created_by'
        )
        
        # Filtra per ruolo
        if hasattr(user, 'notary_profile'):
            # Notaio vede solo i suoi
            qs = qs.filter(notaio=user.notary_profile)
        elif hasattr(user, 'client_profile'):
            # Cliente vede solo quelli dei suoi appuntamenti
            qs = qs.filter(appuntamento__client=user.client_profile)
        elif not user.is_staff:
            # Altri utenti non vedono nulla
            qs = qs.none()
        
        # Filtri query params
        stato = self.request.query_params.get('stato')
        if stato:
            qs = qs.filter(stato=stato)
        
        tipologia = self.request.query_params.get('tipologia')
        if tipologia:
            qs = qs.filter(tipologia_atto_code=tipologia)
        
        anno = self.request.query_params.get('anno')
        if anno:
            qs = qs.filter(data_creazione__year=anno)
        
        return qs.order_by('-data_creazione')
    
    def create(self, request, *args, **kwargs):
        """Crea un nuovo protocollo da appuntamento."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        protocollo = serializer.save()
        
        # Restituisci il protocollo completo
        output_serializer = ProtocolloAttoNotarialeSerializer(
            protocollo,
            context={'request': request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def by_appuntamento(self, request):
        """Ottieni il protocollo per un appuntamento specifico."""
        appuntamento_id = request.query_params.get('appuntamento_id')
        
        if not appuntamento_id:
            return Response(
                {'error': 'appuntamento_id richiesto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            protocollo = ProtocolloAttoNotarile.objects.get(
                appuntamento_id=appuntamento_id
            )
        except ProtocolloAttoNotarile.DoesNotExist:
            return Response(
                {'error': 'Protocollo non trovato per questo appuntamento'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(protocollo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def firma(self, request, pk=None):
        """
        Registra la firma di un atto.
        POST /api/acts/protocolli/{id}/firma/
        """
        protocollo = self.get_object()
        serializer = self.get_serializer(protocollo, data=request.data)
        serializer.is_valid(raise_exception=True)
        protocollo = serializer.save()
        
        output_serializer = ProtocolloAttoNotarialeSerializer(
            protocollo,
            context={'request': request}
        )
        return Response(output_serializer.data)
    
    @action(detail=True, methods=['post'])
    def protocolla(self, request, pk=None):
        """
        Protocolla definitivamente un atto.
        POST /api/acts/protocolli/{id}/protocolla/
        """
        protocollo = self.get_object()
        serializer = self.get_serializer(protocollo, data=request.data)
        serializer.is_valid(raise_exception=True)
        protocollo = serializer.save()
        
        output_serializer = ProtocolloAttoNotarialeSerializer(
            protocollo,
            context={'request': request}
        )
        return Response(output_serializer.data)
    
    @action(detail=True, methods=['post'])
    def annulla(self, request, pk=None):
        """
        Annulla un atto.
        POST /api/acts/protocolli/{id}/annulla/
        Body: {"motivo": "..."}
        """
        protocollo = self.get_object()
        serializer = self.get_serializer(protocollo, data=request.data)
        serializer.is_valid(raise_exception=True)
        protocollo = serializer.save()
        
        output_serializer = ProtocolloAttoNotarialeSerializer(
            protocollo,
            context={'request': request}
        )
        return Response(output_serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistiche(self, request):
        """
        Ottieni statistiche sui protocolli.
        GET /api/acts/protocolli/statistiche/?anno=2025
        """
        user = request.user
        anno = request.query_params.get('anno')
        
        if hasattr(user, 'notary_profile'):
            stats = ProtocolloAttoNotarile.get_statistiche_per_notaio(
                notaio=user.notary_profile,
                anno=int(anno) if anno else None
            )
            return Response(stats)
        
        return Response(
            {'error': 'Funzione disponibile solo per notai'},
            status=status.HTTP_403_FORBIDDEN
        )

