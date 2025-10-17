"""
URLs for authentication endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView,
    MFASetupView, MFAEnableView, MFADisableView, MFAVerifyView,
    ChangePasswordView, UserProfileView,
    ClienteViewSet, NotaioViewSet, PartnerViewSet
)

# Router per i ViewSets
router = DefaultRouter()
router.register(r'clienti', ClienteViewSet, basename='cliente')
router.register(r'notai', NotaioViewSet, basename='notaio')
router.register(r'partners', PartnerViewSet, basename='partner')

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # MFA
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/enable/', MFAEnableView.as_view(), name='mfa-enable'),
    path('mfa/disable/', MFADisableView.as_view(), name='mfa-disable'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
    
    # User management
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # Include router URLs per Clienti, Notai e Partners
    path('', include(router.urls)),
]

