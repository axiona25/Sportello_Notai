"""
Routing WebSocket per comunicazioni Real-Time

Definisce gli endpoint WebSocket per:
- PDF Collaboration (visualizzazione collaborativa documenti)
- Office Collaboration (editing collaborativo documenti Office)
- Video Calls (future: gestione chiamate video)
- Chat (future: chat real-time)
"""

from django.urls import path
from . import consumers
from .consumers_office import OfficeCollaborationConsumer

websocket_urlpatterns = [
    # WebSocket per PDF Collaboration
    # ws://localhost:8000/ws/pdf/<appointment_id>/
    # Supporta sia UUID che int per compatibilità
    path('ws/pdf/<str:appointment_id>/', consumers.PDFCollaborationConsumer.as_asgi()),
    
    # WebSocket per Office Collaboration (Word, Excel, PowerPoint editing)
    # ws://localhost:8000/ws/office/<appointment_id>/
    path('ws/office/<str:appointment_id>/', OfficeCollaborationConsumer.as_asgi()),
    
    # Future: Video call signaling
    # path('ws/video/<str:appointment_id>/', consumers.VideoCallConsumer.as_asgi()),
    
    # Future: Chat real-time
    # path('ws/chat/<str:appointment_id>/', consumers.ChatConsumer.as_asgi()),
]

