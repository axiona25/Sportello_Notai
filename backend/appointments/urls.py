"""
URLs per gli appuntamenti e agende condivise.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DisponibilitaNotaioViewSet,
    EccezioneDisponibilitaViewSet,
    AppuntamentoViewSet,
    PartecipanteAppuntamentoViewSet
)
from .views_extended import (
    AppuntamentoGestioneViewSet,
    DocumentoAppuntamentoViewSet,
    DocumentiRichiestiView,
    NotificaViewSet
)

# Router per i ViewSets
router = DefaultRouter()
router.register(r'disponibilita', DisponibilitaNotaioViewSet, basename='disponibilita')
router.register(r'eccezioni', EccezioneDisponibilitaViewSet, basename='eccezioni')
router.register(r'appuntamenti', AppuntamentoViewSet, basename='appuntamento')
router.register(r'partecipanti', PartecipanteAppuntamentoViewSet, basename='partecipante')

# Extended API - Gestione appuntamenti (conferma/rifiuto)
router.register(r'gestione-appuntamenti', AppuntamentoGestioneViewSet, basename='gestione-appuntamento')

# Extended API - Documenti appuntamento
router.register(r'documenti-appuntamento', DocumentoAppuntamentoViewSet, basename='documento-appuntamento')

# Extended API - Documenti richiesti per tipologia atto
router.register(r'documenti-richiesti', DocumentiRichiestiView, basename='documenti-richiesti')

# Extended API - Notifiche
router.register(r'notifiche', NotificaViewSet, basename='notifica')

urlpatterns = [
    path('', include(router.urls)),
]

