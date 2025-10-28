"""
WOPI Protocol Implementation per Collabora Online / LibreOffice Online

WOPI (Web Application Open Platform Interface) è il protocollo standard
per l'integrazione di editor di documenti online come Collabora, OnlyOffice, Microsoft Office Online.

Endpoints richiesti:
- GET  /wopi/files/{file_id}          → CheckFileInfo (metadata documento)
- GET  /wopi/files/{file_id}/contents → GetFile (contenuto documento)
- POST /wopi/files/{file_id}/contents → PutFile (salva modifiche)
- POST /wopi/files/{file_id}          → Lock/Unlock/RefreshLock (gestione lock)

Documentazione: https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/
"""

import os
import hashlib
from django.http import HttpResponse, JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ActDocument
from acts.models_templates import ActTemplate
from appointments.models import DocumentoAppuntamento


class WOPICheckFileInfo(APIView):
    """
    GET /wopi/files/{file_id}  → CheckFileInfo (metadata)
    POST /wopi/files/{file_id} → Lock/Unlock/RefreshLock
    
    Combina CheckFileInfo e Lock operations nello stesso endpoint.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, file_id):
        """Gestisce Lock/Unlock/RefreshLock (delega a WOPILock)"""
        lock_view = WOPILock()
        return lock_view.post(request, file_id)
    
    def get(self, request, file_id):
        print(f"\n🔍🔍🔍 WOPI CheckFileInfo START - file_id: {file_id}")
        try:
            # Cerca documento in ActDocument o ActTemplate
            document = None
            is_template = False
            try:
                print(f"🔍 Cerco in ActDocument...")
                document = ActDocument.objects.get(id=file_id)
                file_path = document.file.path
                filename = document.original_filename
                print(f"✅ Trovato ActDocument: {filename}")
            except ActDocument.DoesNotExist:
                print(f"❌ ActDocument non trovato, cerco in ActTemplate...")
                try:
                    document = ActTemplate.objects.get(id=file_id)
                    print(f"✅ Trovato ActTemplate: {document}")
                    print(f"🔍 Template fields: {dir(document)}")
                    print(f"🔍 Template template_file: {document.template_file}")
                    file_path = document.template_file.path  # ✅ ActTemplate usa template_file
                    filename = document.original_filename
                    is_template = True
                    print(f"✅ ActTemplate file_path: {file_path}, filename: {filename}")
                except ActTemplate.DoesNotExist:
                    print(f"❌ ActTemplate non trovato, cerco in DocumentoAppuntamento...")
                    try:
                        document = DocumentoAppuntamento.objects.get(id=file_id)
                        file_path = document.file.path
                        filename = os.path.basename(document.file.name)
                        is_template = False
                        print(f"✅ DocumentoAppuntamento trovato: {filename}")
                    except DocumentoAppuntamento.DoesNotExist:
                        print(f"❌❌❌ Documento non trovato!")
                        return Response(
                            {'error': 'Document not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                except Exception as e:
                    print(f"❌❌❌ ERRORE durante accesso documento: {type(e).__name__}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise
            
            # Verifica permessi
            # TODO: Implementare controllo permessi basato su appuntamento
            
            # Ottieni dimensione file
            file_size = os.path.getsize(file_path)
            
            # Calcola SHA256 per versioning
            sha256_hash = hashlib.sha256()
            with open(file_path, 'rb') as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            file_hash = sha256_hash.hexdigest()
            
            # User info
            user_id = str(request.user.id)
            # ✅ User custom non ha get_full_name(), usa email o first_name/last_name
            if hasattr(request.user, 'first_name') and request.user.first_name:
                user_name = f"{request.user.first_name} {request.user.last_name}".strip()
            else:
                user_name = request.user.email
            print(f"🔍 User info: ID={user_id}, Name={user_name}")
            
            # ✅ Mostra nome file originale
            display_name = filename
            print(f"🔍 Display name: '{display_name}' (is_template: {is_template})")
            
            # WOPI CheckFileInfo Response
            wopi_response = {
                # File metadata
                'BaseFileName': display_name,
                'Size': file_size,
                'Version': file_hash[:8],  # Usa primi 8 caratteri SHA256 come versione
                'SHA256': file_hash,
                
                # User info
                'UserId': user_id,
                'UserFriendlyName': user_name,
                'IsAnonymousUser': False,
                
                # ✅ Permissions - Abilita edit per mostrare UI completa
                'UserCanWrite': True,  # Permetti edit (anche se poi possiamo limitare)
                'UserCanRename': False,
                'UserCanNotWriteRelative': True,
                'SupportsUpdate': True,
                'SupportsLocks': True,
                'UserCanPrint': True,  # ✅ Permetti stampa
                'DisablePrint': False,  # ✅ Non disabilitare stampa
                'DisableCopy': False,   # ✅ Permetti copia
                'DisableExport': False, # ✅ Permetti export
                
                # ✅ UI Features - Mostra toolbar completa
                'EnableOwnerTermination': True,
                'HideUserList': False,  # Mostra lista utenti
                'SupportsDeleteComments': True,
                'SupportsUserInfo': True,
                
                # Collabora features
                'SupportsExtendedLockLength': True,
                'SupportsFolders': False,
                'SupportsCoauth': True,  # Collaborazione real-time
                
                # Owner info
                'OwnerId': user_id,
                'LastModifiedTime': document.updated_at.isoformat() if hasattr(document, 'updated_at') else '',
                
                # Watermark (opzionale)
                # 'WatermarkText': 'BOZZA - ' + user_name,
            }
            
            print(f"✅ WOPI CheckFileInfo: {filename} (Size: {file_size} bytes, Template: {is_template})")
            return Response(wopi_response, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ WOPI CheckFileInfo Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WOPIFileContents(APIView):
    """
    GET/POST /wopi/files/{file_id}/contents
    
    GET: Ritorna il contenuto binario del documento (download).
    POST: Salva le modifiche al documento (upload).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, file_id):
        try:
            # Cerca documento
            document = None
            is_template = False
            try:
                document = ActDocument.objects.get(id=file_id)
                file_path = document.file.path
                filename = document.original_filename
            except ActDocument.DoesNotExist:
                try:
                    document = ActTemplate.objects.get(id=file_id)
                    file_path = document.template_file.path  # ✅ ActTemplate usa template_file
                    filename = document.original_filename
                    is_template = True
                except ActTemplate.DoesNotExist:
                    try:
                        document = DocumentoAppuntamento.objects.get(id=file_id)
                        file_path = document.file.path
                        filename = os.path.basename(document.file.name)
                        is_template = False
                    except DocumentoAppuntamento.DoesNotExist:
                        return Response(
                            {'error': 'Document not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
            
            # Verifica permessi
            # TODO: Implementare controllo permessi
            
            if not os.path.exists(file_path):
                return Response(
                    {'error': 'File not found on disk'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"✅ WOPI GetFile: {filename} (Template: {is_template})")
            
            # Ritorna file come response binaria
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=False,
                content_type='application/octet-stream'
            )
            
        except Exception as e:
            print(f"❌ WOPI GetFile Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def post(self, request, file_id):
        """
        POST /wopi/files/{file_id}/contents
        
        Salva le modifiche al documento.
        Chiamato da Collabora quando l'utente salva il documento.
        """
        try:
            # Cerca documento
            document = None
            is_template = False
            try:
                document = ActDocument.objects.get(id=file_id)
                file_path = document.file.path
            except ActDocument.DoesNotExist:
                try:
                    document = ActTemplate.objects.get(id=file_id)
                    file_path = document.template_file.path  # ✅ ActTemplate usa template_file
                    is_template = True
                except ActTemplate.DoesNotExist:
                    try:
                        document = DocumentoAppuntamento.objects.get(id=file_id)
                        file_path = document.file.path
                        is_template = False
                    except DocumentoAppuntamento.DoesNotExist:
                        return Response(
                            {'error': 'Document not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
            
            # Ottieni contenuto binario dal body
            file_content = request.body
            
            print(f"\n{'='*60}")
            print(f"📥 WOPI PutFile Request:")
            print(f"   File ID: {file_id}")
            print(f"   User: {request.user.email} (Role: {getattr(request.user, 'role', 'N/A')})")
            print(f"   Content Size: {len(file_content)} bytes")
            print(f"   File Path: {file_path}")
            print(f"   Is Template: {is_template}")
            print(f"   Document Type: {type(document).__name__}")
            
            if not file_content:
                print(f"❌ No file content provided")
                return Response(
                    {'error': 'No file content provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calcola nuovo SHA256
            sha256_hash = hashlib.sha256(file_content).hexdigest()
            print(f"   SHA256: {sha256_hash[:16]}...")
            
            # ✅ Verifica permessi scrittura
            # Solo notaio/admin possono REALMENTE modificare il file
            user_can_write = hasattr(request.user, 'role') and request.user.role in ['notaio', 'admin']
            print(f"   Can Write: {user_can_write}")
            
            # Nome file per log
            filename = getattr(document, 'original_filename', None) or os.path.basename(file_path)
            
            if user_can_write:
                # ✅ NOTAIO: Salva realmente il file
                try:
                    with open(file_path, 'wb') as f:
                        f.write(file_content)
                    print(f"✅ File salvato su disco: {file_path}")
                    print(f"✅ WOPI PutFile [NOTAIO]: {filename} salvato (Size: {len(file_content)} bytes)")
                except Exception as write_error:
                    print(f"❌ Errore scrittura file: {str(write_error)}")
                    return Response(
                        {'error': f'Failed to write file: {str(write_error)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                # ✅ CLIENTE: Rispondi OK ma NON salvare (modalità passiva)
                print(f"⏭️ WOPI PutFile [CLIENTE]: {filename} ignorato - solo notaio può modificare")
            
            # Response WOPI PutFile (sempre 200 OK per evitare dialog)
            from django.utils import timezone
            response_data = {
                'Status': 'success',
                'Version': sha256_hash[:8],
                'LastModifiedTime': timezone.now().isoformat()
            }
            print(f"📤 Response: {response_data}")
            print(f"{'='*60}\n")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ WOPI PutFile Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ✅ Endpoint opzionale per Lock (gestione lock collaborativo)
class WOPILock(APIView):
    """
    POST /wopi/files/{file_id}
    
    Gestisce lock per editing collaborativo:
    - Lock: Blocca il documento per un utente
    - Unlock: Sblocca il documento
    - RefreshLock: Aggiorna il lock esistente
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, file_id):
        # TODO: Implementare gestione lock in database
        # Per ora ritorniamo successo (Collabora gestisce lock internamente)
        
        x_wopi_override = request.headers.get('X-WOPI-Override', '')
        
        if x_wopi_override == 'LOCK':
            print(f"✅ WOPI Lock: {file_id}")
            return Response({'Status': 'success'}, status=status.HTTP_200_OK)
        
        elif x_wopi_override == 'UNLOCK':
            print(f"✅ WOPI Unlock: {file_id}")
            return Response({'Status': 'success'}, status=status.HTTP_200_OK)
        
        elif x_wopi_override == 'REFRESH_LOCK':
            print(f"✅ WOPI RefreshLock: {file_id}")
            return Response({'Status': 'success'}, status=status.HTTP_200_OK)
        
        else:
            return Response(
                {'error': f'Unknown X-WOPI-Override: {x_wopi_override}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

