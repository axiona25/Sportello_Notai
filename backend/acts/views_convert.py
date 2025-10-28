"""
Conversione template Word → PDF per creazione atto
Usa Collabora Online per la conversione (già installato via Docker)
"""
import os
import uuid
import requests
import shutil
import hashlib
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from acts.models_templates import ActTemplate
from documents.models import ActDocument
from appointments.models import Appuntamento, DocumentoAppuntamento, DocumentoStato
from acts.models import DocumentType


class ConvertTemplateToPDFView(APIView):
    """
    Converte template Word in PDF e lo salva come documento atto
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        template_id = request.data.get('template_id')
        document_id = request.data.get('document_id')  # ID del DocumentoAppuntamento (Word)
        appointment_id = request.data.get('appointment_id')
        
        if not appointment_id:
            return Response(
                {'error': 'appointment_id richiesto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            appointment = Appuntamento.objects.get(id=appointment_id)
            
            # Se abbiamo template_id, usa quello
            if template_id:
                template = ActTemplate.objects.get(id=template_id)
            else:
                # Cerca il template basandosi sulla tipologia atto
                print(f"🔍 Cerco template per tipologia atto: {appointment.tipologia_atto.code if appointment.tipologia_atto else 'N/A'}")
                
                # Prova diverse strategie per trovare il template
                template = None
                
                # 1. Cerca per codice esatto
                if appointment.tipologia_atto and appointment.tipologia_atto.code:
                    template = ActTemplate.objects.filter(
                        act_type_code=appointment.tipologia_atto.code
                    ).order_by('-updated_at').first()
                
                # 2. Cerca per nome contenente "testamento" (case insensitive)
                if not template and appointment.tipologia_atto:
                    act_type_name = appointment.tipologia_atto.name.lower()
                    if 'testamento' in act_type_name:
                        template = ActTemplate.objects.filter(
                            act_type_name__icontains='testamento'
                        ).order_by('-updated_at').first()
                        print(f"✅ Template trovato per nome: {template.act_type_name if template else 'N/A'}")
                
                # 3. Usa l'ultimo template aggiornato come fallback
                if not template:
                    template = ActTemplate.objects.order_by('-updated_at').first()
                    print(f"⚠️ Uso ultimo template disponibile: {template.act_type_name if template else 'N/A'}")
                
                if not template:
                    return Response(
                        {'error': f'Nessun template trovato nel sistema'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Path del file Word da convertire
            # Se abbiamo document_id, usa il DocumentoAppuntamento (versione modificata)
            # Altrimenti usa il template originale
            if document_id:
                try:
                    word_doc = DocumentoAppuntamento.objects.get(id=document_id)
                    word_path = word_doc.file.path
                    print(f"📄 Uso DocumentoAppuntamento modificato: {document_id}")
                except DocumentoAppuntamento.DoesNotExist:
                    print(f"⚠️ DocumentoAppuntamento {document_id} non trovato, uso template")
                    word_path = template.template_file.path
            else:
                word_path = template.template_file.path
                print(f"📄 Uso template originale: {template.id}")
            
            print(f"📄 Conversione Word → PDF")
            print(f"   Template: {template.act_type_name}")
            print(f"   File: {word_path}")
            
            # Usa Collabora Online per convertire Word → PDF
            collabora_url = os.getenv('COLLABORA_URL', 'http://localhost:9980')
            convert_endpoint = f"{collabora_url}/lool/convert-to/pdf"
            
            # Leggi il file Word
            with open(word_path, 'rb') as word_file:
                files = {'data': (os.path.basename(word_path), word_file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
                
                print(f"🔄 Invio richiesta conversione a Collabora: {convert_endpoint}")
                
                # Richiesta di conversione a Collabora
                response = requests.post(
                    convert_endpoint,
                    files=files,
                    timeout=30
                )
            
            if response.status_code != 200:
                print(f"❌ Errore Collabora: {response.status_code} - {response.text}")
                return Response(
                    {'error': 'Errore durante la conversione PDF'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Salva il PDF ricevuto
            pdf_dir = os.path.join(settings.MEDIA_ROOT, 'documents', 'acts', str(appointment_id))
            os.makedirs(pdf_dir, exist_ok=True)
            
            # ✅ Usa lo stesso nome del Word originale ma con .pdf
            original_word_name = os.path.basename(word_path)
            pdf_filename = os.path.splitext(original_word_name)[0] + '.pdf'
            pdf_path = os.path.join(pdf_dir, pdf_filename)
            
            with open(pdf_path, 'wb') as pdf_file:
                pdf_file.write(response.content)
            
            print(f"✅ PDF salvato: {pdf_path} ({len(response.content)} bytes)")
            
            # Trova il cliente dall'appuntamento (primo partecipante cliente)
            from appointments.models import PartecipanteAppuntamento
            partecipante_cliente = PartecipanteAppuntamento.objects.filter(
                appuntamento=appointment,
                cliente__isnull=False
            ).first()
            
            if not partecipante_cliente:
                return Response({
                    'error': 'Nessun cliente trovato per questo appuntamento'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crea documento ActDocument
            from acts.models import Act
            
            # Trova o crea Act per questo appuntamento
            act, created = Act.objects.get_or_create(
                notary_id=appointment.notary_id,
                client_id=partecipante_cliente.cliente_id,
                defaults={
                    'category': 'rogito',
                    'status': 'bozza'
                }
            )
            
            # ✅ AGGIORNA il template con il PDF generato (appare nel BOX AZZURRO)
            from django.core.files import File
            
            # Rimuovi il vecchio file del template (Word)
            if template.template_file:
                template.template_file.delete(save=False)
            
            # Salva il PDF come nuovo template_file
            with open(pdf_path, 'rb') as pdf_file:
                template.template_file.save(pdf_filename, File(pdf_file), save=True)
            
            print(f"✅ Template aggiornato con PDF nel BOX AZZURRO: {template.id}")
            print(f"   File: {pdf_filename}")
            
            # 📦 OPZIONALE: Salva anche in ActDocument per lo storage cifrato
            with open(pdf_path, 'rb') as f:
                pdf_hash = hashlib.sha256(f.read()).hexdigest()
            
            relative_path = os.path.relpath(pdf_path, settings.MEDIA_ROOT)
            blob_url = f"/media/{relative_path.replace(os.sep, '/')}"
            
            act_document = ActDocument.objects.create(
                act=act,
                category='atto_principale',
                filename=pdf_filename,
                original_filename=pdf_filename,
                mime_type='application/pdf',
                file_size=os.path.getsize(pdf_path),
                blob_url=blob_url,
                blob_storage_key='plain',
                ciphertext_hash=pdf_hash,
                uploaded_by=request.user
            )
            
            print(f"✅ PDF salvato anche in ActDocument: {act_document.id}")
            
            return Response({
                'success': True,
                'template_id': str(template.id),
                'filename': pdf_filename,
                'message': 'PDF creato con successo nel BOX AZZURRO'
            }, status=status.HTTP_201_CREATED)
            
        except ActTemplate.DoesNotExist:
            return Response(
                {'error': 'Template non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Appuntamento.DoesNotExist:
            return Response(
                {'error': 'Appuntamento non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        except requests.exceptions.Timeout:
            return Response(
                {'error': 'Timeout durante la conversione'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except requests.exceptions.RequestException as e:
            print(f"❌ Errore connessione a Collabora: {str(e)}")
            return Response(
                {'error': 'Impossibile connettersi al servizio di conversione'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            print(f"❌ Errore conversione PDF: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

