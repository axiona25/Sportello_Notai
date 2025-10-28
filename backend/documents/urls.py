"""
URLs for documents endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentListView, DocumentUploadView, DocumentDetailView,
    DocumentPermissionListCreateView
)
from .views_annotations import PDFAnnotationViewSet
from .views_office import (
    convert_office_to_html,
    save_html_to_office,
    download_office_document
)
from .views_wopi import (
    WOPICheckFileInfo,
    WOPIFileContents  # ✅ View combinata per GET e POST
)

# Router per ViewSet annotazioni
router = DefaultRouter()
router.register(r'annotations', PDFAnnotationViewSet, basename='pdf-annotation')

urlpatterns = [
    path('acts/<uuid:act_id>/documents/', DocumentListView.as_view(), name='document-list'),
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<uuid:document_id>/permissions/', DocumentPermissionListCreateView.as_view(), name='document-permissions'),
    
    # API Office editing (legacy - mantenuto per retrocompatibilità)
    path('office/<uuid:document_id>/to-html/', convert_office_to_html, name='office-to-html'),
    path('office/<uuid:document_id>/save/', save_html_to_office, name='office-save'),
    path('office/<uuid:document_id>/download/', download_office_document, name='office-download'),
    
    # ✅ WOPI Protocol endpoints per Collabora Online / LibreOffice Online
    # ✅ WOPI Protocol Endpoints
    # CheckFileInfo: GET=metadata, POST=lock operations
    path('wopi/files/<uuid:file_id>', WOPICheckFileInfo.as_view(), name='wopi-checkfileinfo'),
    # FileContents: GET=download file, POST=upload/save file
    path('wopi/files/<uuid:file_id>/contents', WOPIFileContents.as_view(), name='wopi-filecontents'),
    
    # Include router per annotazioni
    path('', include(router.urls)),
]

