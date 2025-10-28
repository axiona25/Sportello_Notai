"""
API per editing collaborativo documenti Office
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponse
import os
import tempfile
from pathlib import Path

from .models import ActDocument
from .office_parser import OfficeDocumentParser

try:
    from acts.models_templates import ActTemplate
    HAS_ACT_TEMPLATE = True
except ImportError:
    HAS_ACT_TEMPLATE = False
    ActTemplate = None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def convert_office_to_html(request, document_id):
    """
    Converte un documento Office in HTML per editing
    Supporta sia ActDocument che ActTemplate
    
    GET /api/documents/office/<id>/to-html/
    """
    try:
        # Cerca prima in ActDocument
        document = None
        file_path = None
        filename = None
        
        try:
            document = ActDocument.objects.get(pk=document_id)
            file_path = document.document_file.path
            filename = document.original_filename
            
            # Verifica accesso per ActDocument
            user = request.user
            is_owner = document.uploaded_by == user
            is_notary = hasattr(user, 'notary_profile')
            
            if not (is_owner or is_notary):
                return Response(
                    {'error': 'Non hai i permessi per accedere a questo documento'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ActDocument.DoesNotExist:
            # Cerca in ActTemplate
            try:
                template = ActTemplate.objects.get(pk=document_id)
                file_path = template.template_file.path
                filename = template.original_filename
                
                # Per i template, solo notai possono accedere
                user = request.user
                is_notary = hasattr(user, 'notary_profile')
                
                if not is_notary:
                    return Response(
                        {'error': 'Solo i notai possono accedere ai template'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ActTemplate.DoesNotExist:
                return Response(
                    {'error': 'Documento non trovato'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Converti DOCX → HTML
        parser = OfficeDocumentParser()
        result = parser.docx_to_html(file_path)
        
        if result['success']:
            return Response({
                'success': True,
                'html': result['html'],
                'metadata': result['metadata'],
                'document_id': str(document_id),
                'filename': filename,
            })
        else:
            # Formato non supportato o altro errore previsto - ritorna 200 con messaggio
            return Response({
                'success': False,
                'error': result.get('error', 'Errore conversione'),
                'html': result.get('html', ''),  # HTML con messaggio formattato
                'metadata': result.get('metadata', {})
            }, status=status.HTTP_200_OK)
            
    except ActDocument.DoesNotExist:
        return Response(
            {'error': 'Documento non trovato'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Errore: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_html_to_office(request, document_id):
    """
    Salva HTML modificato come nuovo file DOCX
    
    POST /api/documents/office/<id>/save/
    Body: {
        "html": "<div>...</div>",
        "metadata": {...}
    }
    """
    try:
        document = ActDocument.objects.get(pk=document_id)
        
        # Verifica accesso (solo notaio può salvare)
        user = request.user
        is_notary = hasattr(user, 'notary_profile')
        
        if not is_notary:
            return Response(
                {'error': 'Solo i notai possono salvare modifiche'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ottieni HTML dal body
        html_content = request.data.get('html')
        metadata = request.data.get('metadata', {})
        
        if not html_content:
            return Response(
                {'error': 'HTML content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crea file temporaneo per output
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        # Converti HTML → DOCX
        parser = OfficeDocumentParser()
        success = parser.html_to_docx(html_content, tmp_path, metadata)
        
        if success:
            # Salva nuovo file come versione modificata
            with open(tmp_path, 'rb') as f:
                # Crea nuovo nome file con suffisso "_edited"
                original_name = document.original_filename
                name_parts = original_name.rsplit('.', 1)
                new_filename = f"{name_parts[0]}_edited.{name_parts[1]}"
                
                # Salva in Django
                file_content = ContentFile(f.read())
                saved_path = default_storage.save(
                    f'documents/edited/{new_filename}',
                    file_content
                )
                
                # Aggiorna documento (o crea nuova versione)
                document.document_file = saved_path
                document.save()
            
            # Rimuovi file temporaneo
            os.unlink(tmp_path)
            
            return Response({
                'success': True,
                'message': 'Documento salvato con successo',
                'document_id': str(document.id),
                'filename': new_filename
            })
        else:
            return Response({
                'success': False,
                'error': 'Errore nella conversione HTML → DOCX'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except ActDocument.DoesNotExist:
        return Response(
            {'error': 'Documento non trovato'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Errore: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_office_document(request, document_id):
    """
    Download del documento Office modificato
    Se è .doc, lo converte automaticamente in .docx per compatibilità con docx-preview
    Supporta sia ActDocument che ActTemplate
    
    GET /api/documents/office/<id>/download/
    """
    try:
        # Cerca prima in ActDocument
        document = None
        file_path = None
        is_template = False
        
        try:
            document = ActDocument.objects.get(pk=document_id)
            file_path = document.document_file.path
            
            # Verifica accesso per ActDocument
            user = request.user
            is_owner = document.uploaded_by == user
            is_notary = hasattr(user, 'notary_profile')
            
            if not (is_owner or is_notary):
                return Response(
                    {'error': 'Non hai i permessi per scaricare questo documento'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ActDocument.DoesNotExist:
            # Prova con ActTemplate
            if not HAS_ACT_TEMPLATE or ActTemplate is None:
                return Response(
                    {'error': 'Documento non trovato'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            try:
                document = ActTemplate.objects.get(pk=document_id)
                file_path = document.template_file.path
                is_template = True
                
                # Per i template, solo i notai possono accedere
                if not hasattr(request.user, 'notary_profile'):
                    return Response(
                        {'error': 'Solo i notai possono accedere ai template'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ActTemplate.DoesNotExist:
                return Response(
                    {'error': 'Documento non trovato'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                print(f"❌ Errore cercando ActTemplate: {e}")
                return Response(
                    {'error': f'Errore: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        if not os.path.exists(file_path):
            return Response(
                {'error': 'File non trovato sul server'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verifica estensione file
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Determina filename (sia ActDocument che ActTemplate hanno 'original_filename')
        original_filename = document.original_filename
        
        # Se è .doc (Word 97-2003), converti in .docx per docx-preview
        if file_ext == '.doc':
            print(f"📄 File .doc rilevato, conversione automatica in .docx...")
            
            # Usa il parser per convertire
            docx_path = OfficeDocumentParser._convert_doc_to_docx(file_path)
            
            if docx_path and os.path.exists(docx_path):
                # Restituisci il file .docx convertito
                response = FileResponse(
                    open(docx_path, 'rb'),
                    as_attachment=False,
                    filename=os.path.splitext(original_filename)[0] + '.docx',
                    content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
                print(f"✅ Conversione .doc → .docx completata")
                return response
            else:
                # Conversione fallita, restituisci messaggio
                return Response(
                    {
                        'error': 'LibreOffice non disponibile',
                        'message': 'Il file .doc richiede LibreOffice per la conversione. Installa LibreOffice o converti manualmente in .docx'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Per .docx e altri formati, restituisci direttamente
        return FileResponse(
            open(file_path, 'rb'),
            as_attachment=False,
            filename=original_filename,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        print(f"❌ Errore download documento: {e}")
        return Response(
            {'error': f'Errore: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

