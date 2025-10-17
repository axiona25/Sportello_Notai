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

# Router per i ViewSets
router = DefaultRouter()
router.register(r'disponibilita', DisponibilitaNotaioViewSet, basename='disponibilita')
router.register(r'eccezioni', EccezioneDisponibilitaViewSet, basename='eccezioni')
router.register(r'appuntamenti', AppuntamentoViewSet, basename='appuntamento')
router.register(r'partecipanti', PartecipanteAppuntamentoViewSet, basename='partecipante')

urlpatterns = [
    path('', include(router.urls)),
]

