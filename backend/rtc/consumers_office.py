"""
WebSocket Consumer per editing collaborativo Office
Sincronizzazione real-time del contenuto HTML tra utenti
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class OfficeCollaborationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket per collaborazione Office real-time
    Un room per appointment_id
    """
    
    async def connect(self):
        """Connessione WebSocket"""
        self.appointment_id = self.scope['url_route']['kwargs']['appointment_id']
        self.room_group_name = f'office_collaboration_{self.appointment_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"✅ WebSocket Office - User connesso a room {self.room_group_name}")
    
    async def disconnect(self, close_code):
        """Disconnessione WebSocket"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"🔌 WebSocket Office - User disconnesso da {self.room_group_name}")
    
    async def receive(self, text_data):
        """Riceve messaggi dal WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"📨 WebSocket Office - Ricevuto messaggio tipo '{message_type}'")
            
            if message_type == 'JOIN_OFFICE_EDITING':
                # User entrato nella sessione editing
                user_info = data.get('user', {})
                document_id = data.get('document_id')
                
                # Broadcast a tutti nel room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'office_user_joined',
                        'user': user_info,
                        'document_id': document_id
                    }
                )
                
            elif message_type == 'OFFICE_CONTENT_UPDATE':
                # Contenuto modificato - broadcast a tutti tranne mittente
                html_content = data.get('html')
                document_id = data.get('document_id')
                user_id = data.get('user_id')
                
                # Broadcast a tutti
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'office_content_update',
                        'html': html_content,
                        'document_id': document_id,
                        'user_id': user_id
                    }
                )
                
            elif message_type == 'OFFICE_CURSOR_POSITION':
                # Posizione cursore - per mostrare dove stanno editando gli altri
                cursor_data = data.get('cursor')
                user_info = data.get('user')
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'office_cursor_position',
                        'cursor': cursor_data,
                        'user': user_info
                    }
                )
                
        except json.JSONDecodeError:
            logger.error(f"❌ Errore parsing JSON: {text_data}")
        except Exception as e:
            logger.error(f"❌ Errore WebSocket Office: {e}")
    
    # Handler per messaggi dal channel layer
    
    async def office_user_joined(self, event):
        """User entrato nella sessione editing"""
        await self.send(text_data=json.dumps({
            'type': 'OFFICE_USER_JOINED',
            'user': event['user'],
            'document_id': event['document_id']
        }))
    
    async def office_content_update(self, event):
        """Contenuto documento aggiornato"""
        await self.send(text_data=json.dumps({
            'type': 'OFFICE_CONTENT_UPDATE',
            'html': event['html'],
            'document_id': event['document_id'],
            'user_id': event['user_id']
        }))
    
    async def office_cursor_position(self, event):
        """Posizione cursore aggiornata"""
        await self.send(text_data=json.dumps({
            'type': 'OFFICE_CURSOR_POSITION',
            'cursor': event['cursor'],
            'user': event['user']
        }))

