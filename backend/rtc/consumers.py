"""
WebSocket Consumers per Real-Time Communication

PDFCollaborationConsumer: Gestisce la sincronizzazione in tempo reale
della visualizzazione collaborativa dei documenti PDF.

Features:
- Sincronizzazione pagina corrente
- Sincronizzazione zoom level
- Sincronizzazione scroll position
- Sincronizzazione rotazione pagina
- Condivisione annotazioni (evidenziazioni, note)
- Gestione accessi partecipanti
- Presenza utenti attivi
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class PDFCollaborationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket per visualizzazione collaborativa PDF.
    
    Ogni appuntamento ha una "room" dedicata dove tutti i partecipanti
    si sincronizzano. Il notaio guida la visualizzazione (cambio pagina, zoom),
    ma tutti possono aggiungere annotazioni.
    """
    
    async def connect(self):
        """
        Connessione WebSocket - L'utente entra nella room PDF.
        """
        self.appointment_id = self.scope['url_route']['kwargs']['appointment_id']
        self.room_group_name = f'pdf_collaboration_{self.appointment_id}'
        self.user = self.scope.get('user')
        
        # Log connessione
        user_id = self.user.id if self.user and self.user.is_authenticated else 'Anonymous'
        logger.info(f"📡 WebSocket PDF - Connessione da user {user_id} per appointment {self.appointment_id}")
        
        # ✅ ACCETTA ANCHE CONNESSIONI ANONIME (per testing)
        # In produzione, aggiungere controllo: if not self.user or not self.user.is_authenticated: await self.close()
        
        # Aggiungi il canale al gruppo della room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accetta la connessione WebSocket
        await self.accept()
        
        # Invia messaggio di benvenuto
        await self.send(text_data=json.dumps({
            'type': 'CONNECTION_SUCCESS',
            'message': f'Connesso alla room PDF per appuntamento {self.appointment_id}',
            'appointmentId': self.appointment_id
        }))
        
        logger.info(f"✅ WebSocket PDF - User {self.user.id if self.user and self.user.is_authenticated else 'Anonymous'} connesso a room {self.room_group_name}")
    
    async def disconnect(self, close_code):
        """
        Disconnessione WebSocket - L'utente esce dalla room PDF.
        """
        logger.info(f"🔌 WebSocket PDF - Disconnessione user {self.user.id if self.user and self.user.is_authenticated else 'Anonymous'} da room {self.room_group_name} (code: {close_code})")
        
        # Notifica agli altri che l'utente è uscito
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'userId': self.user.id,
                    'userName': self.get_user_name(self.user)
                }
            )
        
        # Rimuovi il canale dal gruppo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Ricezione messaggio dal client - Broadcasting ad altri partecipanti.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'UNKNOWN')
            
            user_id = self.user.id if self.user and self.user.is_authenticated else 'Anonymous'
            logger.info(f"📨 WebSocket PDF - Ricevuto messaggio tipo '{message_type}' da user {user_id}")
            
            # ✅ PERMETTI AZIONI ANCHE PER UTENTI ANONIMI (per testing)
            # In produzione, abilitare questo controllo:
            # if not self.user or not self.user.is_authenticated:
            #     await self.send(text_data=json.dumps({
            #         'type': 'ERROR',
            #         'message': 'Autenticazione richiesta'
            #     }))
            #     return
            
            # Aggiungi info utente al messaggio
            try:
                data['userId'] = self.user.id if self.user and self.user.is_authenticated else data.get('userId', 'anonymous')
                data['userName'] = self.get_user_name(self.user) if self.user and self.user.is_authenticated else data.get('userName', 'Anonymous User')
                data['userRole'] = await self.get_user_role()
            except Exception as e:
                logger.error(f'❌ Errore ottenimento info utente: {e}')
                data['userId'] = data.get('userId', 'anonymous')
                data['userName'] = data.get('userName', 'Anonymous User')
                data['userRole'] = 'notary'  # Default per test
            
            # Gestione messaggi speciali
            if message_type in ['JOIN', 'JOIN_CALL']:
                # Notifica ingresso utente
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_joined',
                        'userId': data['userId'],  # ✅ Usa userId già estratto dai dati
                        'userName': data['userName'],
                        'userRole': data['userRole']
                    }
                )
                logger.info(f"👋 User {data['userName']} ({data['userRole']}) entrato in room PDF {self.appointment_id}")
            
            elif message_type in ['OPEN_PDF', 'CLOSE_PDF']:
                # Broadcast apertura/chiusura PDF a tutti i partecipanti
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'pdf_action',
                        'action': data
                    }
                )
                logger.info(f"📄 {message_type} broadcast da {data.get('userName', 'Unknown')} in room {self.appointment_id}")
            
            elif message_type == 'PAGE_CHANGE':
                # Solo notaio/admin può cambiare pagina
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"📄 Notaio cambia pagina: {data.get('page')}")
                else:
                    logger.warning(f"⚠️ Cliente {data['userId']} ha tentato di cambiare pagina (non autorizzato)")
            
            elif message_type == 'ZOOM_CHANGE':
                # Solo notaio/admin può cambiare zoom
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"🔍 Notaio cambia zoom: {data.get('zoom')}%")
                else:
                    logger.warning(f"⚠️ Cliente {data['userId']} ha tentato di cambiare zoom (non autorizzato)")
            
            elif message_type == 'SCROLL':
                # Solo notaio/admin guida lo scroll
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    # Non loggare ogni scroll (troppo verbose)
            
            elif message_type == 'VIEW_MODE_CHANGE':
                # Solo notaio/admin può cambiare modalità vista
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"👁️ Notaio cambia vista: {data.get('mode')}")
            
            elif message_type == 'ROTATION_CHANGE':
                # Solo notaio/admin può ruotare
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"🔄 Notaio ruota pagina: {data.get('rotation')}°")
            
            elif message_type == 'ANNOTATION_ADD':
                # Tutti possono aggiungere annotazioni
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'pdf_action',
                        'action': data
                    }
                )
                logger.info(f"✏️ {data['userName']} aggiunge annotazione tipo {data.get('annotation', {}).get('type')}")
            
            elif message_type == 'HIGHLIGHT_ADD':
                # Tutti possono evidenziare testo
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'pdf_action',
                        'action': data
                    }
                )
                highlight = data.get('highlight', {})
                logger.info(f"✨ {data['userName']} evidenzia testo (colore: {highlight.get('color')}, pagina: {highlight.get('page')})")
            
            elif message_type == 'ACCESS_CHANGE':
                # Solo notaio/admin può gestire accessi
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"🔐 Notaio modifica accessi: participant {data.get('participantId')} -> {data.get('hasAccess')}")
            
            elif message_type == 'SIGNATURE_ENABLED':
                # Solo notaio/admin può abilitare/disabilitare firma
                if data['userRole'] in ['notaio', 'notary', 'admin']:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'pdf_action',
                            'action': data
                        }
                    )
                    logger.info(f"🖊️ Notaio {'abilita' if data.get('enabled') else 'disabilita'} firma per i clienti")
                else:
                    logger.warning(f"⚠️ Cliente {data['userId']} ha tentato di modificare stato firma (non autorizzato)")
            
            else:
                # Altri messaggi: broadcast generico
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'pdf_action',
                        'action': data
                    }
                )
        
        except json.JSONDecodeError as e:
            logger.error(f"❌ Errore parsing JSON: {e}")
            await self.send(text_data=json.dumps({
                'type': 'ERROR',
                'message': 'Formato messaggio non valido'
            }))
        except Exception as e:
            logger.error(f"❌ Errore gestione messaggio WebSocket: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'ERROR',
                'message': 'Errore interno del server'
            }))
    
    # ============================================
    # Handler messaggi gruppo
    # ============================================
    
    async def pdf_action(self, event):
        """
        Invia azione PDF a questo client.
        """
        action = event['action']
        
        # Non inviare al mittente stesso (evita echo)
        current_user_id = self.user.id if self.user and hasattr(self.user, 'id') else None
        if action.get('userId') != current_user_id:
            await self.send(text_data=json.dumps(action))
    
    async def user_joined(self, event):
        """
        Notifica che un utente è entrato nella room.
        """
        # Non notificare a se stesso
        current_user_id = self.user.id if self.user and hasattr(self.user, 'id') else None
        if event['userId'] != current_user_id:
            await self.send(text_data=json.dumps({
                'type': 'USER_JOINED',
                'userId': event['userId'],
                'userName': event['userName'],
                'userRole': event['userRole']
            }))
    
    async def user_left(self, event):
        """
        Notifica che un utente è uscito dalla room.
        """
        # Non notificare a se stesso
        current_user_id = self.user.id if self.user and hasattr(self.user, 'id') else None
        if event['userId'] != current_user_id:
            await self.send(text_data=json.dumps({
                'type': 'USER_LEFT',
                'userId': event['userId'],
                'userName': event['userName']
            }))
    
    # ============================================
    # Helper methods
    # ============================================
    
    def get_user_name(self, user):
        """
        Ottiene il nome visualizzato dell'utente.
        """
        if not user or not hasattr(user, 'email'):
            return 'Anonymous User'
            
        try:
            if hasattr(user, 'notary_profile') and user.notary_profile:
                return user.notary_profile.studio_name or f"{user.first_name} {user.last_name}".strip() or user.email
            elif hasattr(user, 'cliente_profile') and user.cliente_profile:
                return user.cliente_profile.full_name or f"{user.first_name} {user.last_name}".strip() or user.email
            else:
                return f"{user.first_name} {user.last_name}".strip() or user.email
        except Exception:
            return 'Anonymous User'
    
    @database_sync_to_async
    def get_user_role(self):
        """
        Ottiene il ruolo dell'utente.
        """
        if not self.user or not self.user.is_authenticated:
            # Per testing: permetti di specificare ruolo in userRole del messaggio
            return 'notary'  # Default per test
        
        if self.user.is_superuser:
            return 'admin'
        
        user_type = getattr(self.user, 'user_type', None)
        if user_type == 'notaio':
            return 'notary'
        elif user_type == 'cliente':
            return 'client'
        elif user_type == 'partner':
            return 'partner'
        else:
            return 'unknown'

