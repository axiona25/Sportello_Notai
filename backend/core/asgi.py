"""
ASGI config for Sportello Notai project.

Configurato per supportare WebSocket con Django Channels.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django is initialized
from rtc import routing as rtc_routing
from rtc.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # HTTP requests
    "http": django_asgi_app,
    
    # WebSocket requests
    # ✅ Autenticazione JWT per WebSocket
    "websocket": JWTAuthMiddleware(
        URLRouter(rtc_routing.websocket_urlpatterns)
    ),
})

