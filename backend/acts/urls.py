"""
URLs for acts endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActListCreateView, ActDetailView, ActCloseView, NotarialActCategoryViewSet, DocumentTypeViewSet

# Router per ViewSets
router = DefaultRouter()
router.register(r'categories', NotarialActCategoryViewSet, basename='act-category')
router.register(r'document-types', DocumentTypeViewSet, basename='document-type')

urlpatterns = [
    path('', ActListCreateView.as_view(), name='act-list-create'),
    path('<uuid:pk>/', ActDetailView.as_view(), name='act-detail'),
    path('<uuid:pk>/close/', ActCloseView.as_view(), name='act-close'),
    
    # Categories API
    path('', include(router.urls)),
]

