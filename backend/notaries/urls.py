"""
URLs for notaries endpoints.
"""
from django.urls import path
from .views import (
    NotaryListView, NotaryDetailView, NotaryUpdateView,
    NotaryServicesView, NotaryAvailabilityListCreateView,
    NotaryAvailabilityDetailView, ClientProfileView,
    CollaboratorListView, NotaryShowcaseListView,
    NotaryShowcaseDetailView, AvailableSlotsView,
    AppointmentCreateView, AppointmentListView,
    AppointmentDetailView, AppointmentActionView,
    # Admin views
    AdminNotaryListCreateView, AdminNotaryDetailView,
    AdminNotaryLicenseUpdateView, AdminNotaryStatsView
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
    
    # Showcases (public notary profiles)
    path('showcases/', NotaryShowcaseListView.as_view(), name='notary-showcases'),
    path('showcase/me/', NotaryShowcaseDetailView.as_view(), name='notary-showcase-me'),
    
    # Client profile
    path('client/me/', ClientProfileView.as_view(), name='client-profile'),
    
    # Appointments
    path('<uuid:notary_id>/slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('appointments/', AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/create/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/<uuid:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<uuid:appointment_id>/action/', AppointmentActionView.as_view(), name='appointment-action'),
    
    # ========================================
    # ADMIN ENDPOINTS
    # ========================================
    path('admin/notaries/', AdminNotaryListCreateView.as_view(), name='admin-notary-list'),
    path('admin/notaries/<uuid:id>/', AdminNotaryDetailView.as_view(), name='admin-notary-detail'),
    path('admin/notaries/<uuid:id>/license/', AdminNotaryLicenseUpdateView.as_view(), name='admin-notary-license'),
    path('admin/stats/', AdminNotaryStatsView.as_view(), name='admin-stats'),
]

