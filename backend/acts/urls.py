"""
URLs for acts endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActListCreateView, ActDetailView, ActCloseView, NotarialActCategoryViewSet, DocumentTypeViewSet
from .views_templates import ActTemplateViewSet
from .views_protocollo import ProtocolloAttoViewSet
from .views_convert import ConvertTemplateToPDFView

# Router per ViewSets
router = DefaultRouter()
router.register(r'categories', NotarialActCategoryViewSet, basename='act-category')
router.register(r'document-types', DocumentTypeViewSet, basename='document-type')
router.register(r'templates', ActTemplateViewSet, basename='act-template')
router.register(r'protocolli', ProtocolloAttoViewSet, basename='protocollo-atto')

urlpatterns = [
    path('', ActListCreateView.as_view(), name='act-list-create'),
    path('<uuid:pk>/', ActDetailView.as_view(), name='act-detail'),
    path('<uuid:pk>/close/', ActCloseView.as_view(), name='act-close'),
    
    # Conversione template Word → PDF
    path('convert-template-to-pdf/', ConvertTemplateToPDFView.as_view(), name='convert-template-to-pdf'),
    
    # Categories API
    path('', include(router.urls)),
]

