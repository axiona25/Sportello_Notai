"""
JWT Authentication Middleware per Django Channels WebSocket

Autentica l'utente tramite JWT token passato nei query params.
"""

import logging
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

logger = logging.getLogger(__name__)
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """
    Estrae e valida il token JWT, ritorna l'utente autenticato.
    
    Usa rest_framework_simplejwt per garantire la stessa configurazione
    del REST API (stessa SECRET_KEY, stesso algoritmo).
    """
    try:
        # Decodifica JWT usando SimpleJWT (stesso sistema del REST API)
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        
        if not user_id:
            logger.warning("❌ Token JWT senza user_id")
            return AnonymousUser()
        
        # Ottieni utente dal database
        user = User.objects.get(id=user_id)
        logger.info(f"✅ Utente autenticato via JWT: {user.email} (ID: {user.id})")
        return user
        
    except (TokenError, InvalidToken) as e:
        logger.warning(f"❌ Token JWT non valido o scaduto: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.warning(f"❌ Utente con ID {user_id} non trovato")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"❌ Errore autenticazione JWT: {e}", exc_info=True)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware per autenticazione JWT nei WebSocket.
    
    Estrae il token dai query params (?token=...) e autentica l'utente.
    """
    
    async def __call__(self, scope, receive, send):
        # Estrai query params
        query_string = scope.get('query_string', b'').decode('utf-8')
        logger.info(f"🔍 [JWT Middleware] Query string: {query_string[:100]}...")  # Log primi 100 char
        query_params = parse_qs(query_string)
        logger.info(f"🔍 [JWT Middleware] Query params keys: {list(query_params.keys())}")
        token = query_params.get('token', [None])[0]
        
        if token:
            logger.info(f"🔑 Token JWT trovato nei query params (length: {len(token)})")
            # Autentica utente
            scope['user'] = await get_user_from_token(token)
        else:
            logger.warning(f"⚠️ Nessun token JWT nei query params, utente Anonymous")
            logger.warning(f"   Query string completa: {query_string}")
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)

