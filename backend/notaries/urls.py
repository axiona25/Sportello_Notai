"""
URLs for notaries endpoints.
"""
from django.urls import path
from .views import (
    NotaryListView, NotaryDetailView, NotaryUpdateView,
    NotaryServicesView, NotaryAvailabilityListCreateView,
    NotaryAvailabilityDetailView, ClientProfileView,
    CollaboratorListView
)

urlpatterns = [
    # Notaries
    path('', NotaryListView.as_view(), name='notary-list'),
    path('<uuid:pk>/', NotaryDetailView.as_view(), name='notary-detail'),
    path('me/', NotaryUpdateView.as_view(), name='notary-profile'),
    path('<uuid:pk>/services/', NotaryServicesView.as_view(), name='notary-services'),
    
    # Availability
    path('<uuid:pk>/availability/', NotaryAvailabilityListCreateView.as_view(), name='notary-availability-list'),
    path('<uuid:pk>/availability/<uuid:availability_id>/', NotaryAvailabilityDetailView.as_view(), name='notary-availability-detail'),
    
    # Collaborators
    path('<uuid:pk>/collaborators/', CollaboratorListView.as_view(), name='collaborator-list'),
    
    # Client profile
    path('client/me/', ClientProfileView.as_view(), name='client-profile'),
]

