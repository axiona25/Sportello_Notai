"""
URLs for documents endpoints.
"""
from django.urls import path
from .views import (
    DocumentListView, DocumentUploadView, DocumentDetailView,
    DocumentPermissionListCreateView
)

urlpatterns = [
    path('acts/<uuid:act_id>/documents/', DocumentListView.as_view(), name='document-list'),
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<uuid:document_id>/permissions/', DocumentPermissionListCreateView.as_view(), name='document-permissions'),
]

