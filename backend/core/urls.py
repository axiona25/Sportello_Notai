"""
URL configuration for Sportello Notai project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from .views import health_check, readiness_check, liveness_check

urlpatterns = [
    # Health Checks (per Load Balancer/Kubernetes)
    path('health/', health_check, name='health'),
    path('ready/', readiness_check, name='readiness'),
    path('alive/', liveness_check, name='liveness'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/notaries/', include('notaries.urls')),
    path('api/acts/', include('acts.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/pec/', include('pec.urls')),
    path('api/rtc/', include('rtc.urls')),
    path('api/signatures/', include('signatures.urls')),
    path('api/conservation/', include('conservation.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/ui/', include('ui_elements.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

