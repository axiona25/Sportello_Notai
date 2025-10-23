"""
Extended API Views per il sistema di gestione documenti e notifiche.
Implementa il flusso completo:
1. Conferma/Rifiuto appuntamenti
2. Upload e verifica documenti
3. Sistema notifiche
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import (
    Appuntamento, AppointmentStatus,
    DocumentoAppuntamento, DocumentoStato,
    Notifica, NotificaTipo
)
from acts.models import NotarialActCategory, NotarialActCategoryDocument
from .serializers import (
    AppuntamentoSerializer,
    AppuntamentoConfermaSerializer,
    AppuntamentoRifiutaSerializer,
    DocumentoAppuntamentoSerializer,
    DocumentoAppuntamentoUploadSerializer,
    DocumentoAppuntamentoVerificaSerializer,
    DocumentTypeSimpleSerializer,
    NotificaSerializer,
    NotificaListSerializer
)


# ============================================
# APPUNTAMENTI - CONFERMA/RIFIUTO
# ============================================

class AppuntamentoGestioneViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione degli appuntamenti (conferma/rifiuto).
    """
    queryset = Appuntamento.objects.all()
    serializer_class = AppuntamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'], url_path='conferma')
    def conferma_appuntamento(self, request, pk=None):
        """
        Conferma un appuntamento (solo Notaio).
        POST /api/appointments/{id}/conferma/
        Body: { "note": "..." } (opzionale)
        """
        appuntamento = self.get_object()
        
        # Verifica permessi: solo il notaio associato può confermare
        if request.user.role not in ['notaio', 'admin']:
            return Response(
                {'error': 'Solo i notai possono confermare gli appuntamenti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica che l'appuntamento sia in stato provvisorio/richiesto
        if appuntamento.status not in [AppointmentStatus.PROVVISORIO, AppointmentStatus.RICHIESTO]:
            return Response(
                {'error': f'Impossibile confermare appuntamento nello stato {appuntamento.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AppuntamentoConfermaSerializer(data=request.data)
        if serializer.is_valid():
            # Conferma l'appuntamento
            appuntamento.approva(confermato_da=request.user.email)
            
            # ⚠️ IMPORTANTE: Rifiuta automaticamente altri appuntamenti provvisori sullo stesso slot
            appuntamenti_concorrenti = Appuntamento.objects.filter(
                notary=appuntamento.notary,
                status=AppointmentStatus.PROVVISORIO,
                start_time__lt=appuntamento.end_time,
                end_time__gt=appuntamento.start_time
            ).exclude(id=appuntamento.id)
            
            # Rifiuta e notifica ciascuno
            for app_concorrente in appuntamenti_concorrenti:
                app_concorrente.rifiuta(
                    rifiutato_da=request.user.email,
                    motivo="Lo slot è stato confermato per un altro cliente"
                )
                
                # Notifica al cliente rifiutato
                cliente_rifiutato = app_concorrente.partecipanti.filter(cliente__isnull=False).first()
                if cliente_rifiutato and cliente_rifiutato.cliente:
                    Notifica.crea_notifica(
                        user=cliente_rifiutato.cliente.user,
                        tipo=NotificaTipo.APPUNTAMENTO_RIFIUTATO,
                        titolo='Appuntamento Non Disponibile',
                        messaggio=f'Ci dispiace, lo slot per "{app_concorrente.titolo}" non è più disponibile. È stato confermato per un altro cliente.',
                        link_url=f'/dashboard',
                        appuntamento=app_concorrente,
                        invia_email=True
                    )
            
            # Crea notifica per il cliente
            cliente = appuntamento.partecipanti.filter(cliente__isnull=False).first()
            if cliente and cliente.cliente:
                Notifica.crea_notifica(
                    user=cliente.cliente.user,
                    tipo=NotificaTipo.APPUNTAMENTO_CONFERMATO,
                    titolo='Appuntamento Confermato',
                    messaggio=f'Il tuo appuntamento "{appuntamento.titolo}" è stato confermato dal notaio.',
                    link_url=f'/dashboard/appuntamenti/{appuntamento.id}',
                    appuntamento=appuntamento,
                    invia_email=True
                )
            
            # Cambia stato a "documenti_in_caricamento" e crea i documenti richiesti
            if appuntamento.tipologia_atto:
                self._crea_documenti_richiesti(appuntamento)
                appuntamento.inizia_caricamento_documenti()
                
                # Notifica cliente che deve caricare i documenti
                if cliente and cliente.cliente:
                    Notifica.crea_notifica(
                        user=cliente.cliente.user,
                        tipo=NotificaTipo.DOCUMENTI_DA_CARICARE,
                        titolo='Documenti da Caricare',
                        messaggio=f'Per l\'appuntamento "{appuntamento.titolo}" devi caricare i documenti richiesti.',
                        link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                        appuntamento=appuntamento,
                        invia_email=True
                    )
            
            return Response({
                'message': 'Appuntamento confermato con successo',
                'appuntamento': AppuntamentoSerializer(appuntamento).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='rifiuta')
    def rifiuta_appuntamento(self, request, pk=None):
        """
        Rifiuta un appuntamento (solo Notaio).
        POST /api/appointments/{id}/rifiuta/
        Body: { "motivo": "..." } (obbligatorio)
        """
        appuntamento = self.get_object()
        
        # Verifica permessi
        if request.user.role not in ['notaio', 'admin']:
            return Response(
                {'error': 'Solo i notai possono rifiutare gli appuntamenti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica stato
        if appuntamento.status not in [AppointmentStatus.PROVVISORIO, AppointmentStatus.RICHIESTO]:
            return Response(
                {'error': f'Impossibile rifiutare appuntamento nello stato {appuntamento.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AppuntamentoRifiutaSerializer(data=request.data)
        if serializer.is_valid():
            motivo = serializer.validated_data['motivo']
            
            # Rifiuta l'appuntamento
            appuntamento.rifiuta(motivo=motivo, rifiutato_da=request.user.email)
            
            # Crea notifica per il cliente
            cliente = appuntamento.partecipanti.filter(cliente__isnull=False).first()
            if cliente and cliente.cliente:
                Notifica.crea_notifica(
                    user=cliente.cliente.user,
                    tipo=NotificaTipo.APPUNTAMENTO_RIFIUTATO,
                    titolo='Appuntamento Rifiutato',
                    messaggio=f'Il tuo appuntamento "{appuntamento.titolo}" è stato rifiutato. Motivo: {motivo}',
                    link_url=f'/dashboard/appuntamenti',
                    appuntamento=appuntamento,
                    invia_email=True
                )
            
            return Response({
                'message': 'Appuntamento rifiutato',
                'motivo': motivo
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _crea_documenti_richiesti(self, appuntamento):
        """Crea i DocumentoAppuntamento basati sulla tipologia atto."""
        if not appuntamento.tipologia_atto:
            return
        
        # Ottieni i documenti richiesti per questa tipologia di atto
        documenti_richiesti = NotarialActCategoryDocument.objects.filter(
            act_category=appuntamento.tipologia_atto
        ).select_related('document_type')
        
        # Crea i DocumentoAppuntamento
        for doc_rel in documenti_richiesti:
            DocumentoAppuntamento.objects.get_or_create(
                appuntamento=appuntamento,
                document_type=doc_rel.document_type,
                defaults={
                    'is_obbligatorio': doc_rel.is_mandatory,
                    'stato': DocumentoStato.DA_CARICARE
                }
            )


# ============================================
# DOCUMENTI APPUNTAMENTO
# ============================================

class DocumentoAppuntamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione dei documenti degli appuntamenti.
    """
    queryset = DocumentoAppuntamento.objects.all()
    serializer_class = DocumentoAppuntamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        """Filtra i documenti in base all'utente."""
        user = self.request.user
        queryset = DocumentoAppuntamento.objects.select_related(
            'appuntamento', 'document_type', 'caricato_da', 'verificato_da'
        )
        
        # Cliente vede solo i suoi documenti
        if user.role == 'cliente':
            return queryset.filter(
                appuntamento__partecipanti__cliente__user=user
            )
        
        # Notaio vede i documenti dei suoi appuntamenti
        if user.role == 'notaio':
            return queryset.filter(
                Q(appuntamento__notary__user=user) |
                Q(appuntamento__notaio__user=user)
            )
        
        # Admin vede tutto
        return queryset
    
    @action(detail=False, methods=['get'], url_path='appuntamento/(?P<appuntamento_id>[^/.]+)')
    def by_appuntamento(self, request, appuntamento_id=None):
        """
        Lista documenti per un appuntamento specifico.
        GET /api/documenti-appuntamento/appuntamento/{appuntamento_id}/
        """
        documenti = self.get_queryset().filter(appuntamento_id=appuntamento_id)
        serializer = self.get_serializer(documenti, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='appuntamento/(?P<appuntamento_id>[^/.]+)/upload-per-nome')
    def upload_per_nome(self, request, appuntamento_id=None):
        """
        Upload di un documento per nome (crea il documento se non esiste).
        POST /api/documenti-appuntamento/appuntamento/{appuntamento_id}/upload-per-nome/
        Body: FormData with 'file' and 'nome_documento'
        """
        print(f"🔍 Upload documento - User role: {request.user.role}")
        print(f"🔍 Appuntamento ID: {appuntamento_id}")
        
        # Verifica permessi: solo il cliente può caricare (accetta anche 'client')
        if request.user.role not in ['cliente', 'client']:
            return Response(
                {'error': f'Solo i clienti possono caricare documenti (ruolo attuale: {request.user.role})'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica che l'appuntamento esista
        try:
            appuntamento = Appuntamento.objects.get(id=appuntamento_id)
            print(f"✅ Appuntamento trovato: {appuntamento.id}, status: {appuntamento.status}")
            
            # Verifica che il cliente sia un partecipante dell'appuntamento
            from accounts.models import Cliente
            cliente = Cliente.objects.filter(user=request.user).first()
            if cliente:
                partecipante_exists = appuntamento.partecipanti.filter(cliente=cliente).exists()
                if not partecipante_exists:
                    print(f"❌ Cliente {cliente.user.email} non è partecipante dell'appuntamento")
                    return Response(
                        {'error': 'Non hai i permessi per caricare documenti per questo appuntamento'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                print(f"❌ Cliente non trovato per user {request.user.email}")
                return Response(
                    {'error': 'Profilo cliente non trovato'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Appuntamento.DoesNotExist:
            print(f"❌ Appuntamento non trovato per ID: {appuntamento_id}")
            return Response(
                {'error': 'Appuntamento non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verifica che l'appuntamento sia confermato (case-insensitive)
        status_upper = appuntamento.status.upper() if appuntamento.status else ''
        if status_upper not in ['CONFERMATO', 'DOCUMENTI_IN_CARICAMENTO']:
            print(f"❌ Status non valido: {appuntamento.status} (upper: {status_upper})")
            return Response(
                {'error': f'L\'appuntamento deve essere confermato prima di caricare documenti (stato attuale: {appuntamento.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ottieni il nome del documento
        nome_documento = request.data.get('nome_documento')
        print(f"📄 Nome documento: {nome_documento}")
        if not nome_documento:
            print(f"❌ Nome documento mancante. Data ricevuti: {request.data.keys()}")
            return Response(
                {'error': 'Il campo nome_documento è obbligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ottieni il file
        file = request.FILES.get('file')
        print(f"📎 File ricevuto: {file.name if file else 'None'}")
        if not file:
            print(f"❌ File mancante. Files ricevuti: {request.FILES.keys()}")
            return Response(
                {'error': 'Nessun file fornito'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trova o crea il DocumentType
        from acts.models import DocumentType
        document_type, _ = DocumentType.objects.get_or_create(
            name=nome_documento,
            defaults={
                'required': True,
                'category': 'generale',
                'description': f'Documento richiesto: {nome_documento}'
            }
        )
        print(f"📋 DocumentType trovato/creato: {document_type.name}")
        
        # Crea o aggiorna il documento
        documento, created = DocumentoAppuntamento.objects.get_or_create(
            appuntamento=appuntamento,
            document_type=document_type,
            defaults={
                'stato': DocumentoStato.CARICATO,
                'caricato_da': request.user
            }
        )
        
        # Se esiste già, aggiorna lo stato
        if not created:
            documento.stato = DocumentoStato.CARICATO
            documento.caricato_da = request.user
        
        # Salva il file
        documento.file = file
        documento.caricato_at = timezone.now()
        documento.save()
        
        print(f"✅ Documento salvato: {document_type.name} - {file.name}")
        
        # Notifica il notaio
        if appuntamento.notary:
            Notifica.crea_notifica(
                user=appuntamento.notary.user,
                tipo=NotificaTipo.DOCUMENTO_CARICATO,
                titolo='Nuovo Documento Caricato',
                messaggio=f'Un nuovo documento "{nome_documento}" è stato caricato per l\'appuntamento',
                link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                appuntamento=appuntamento
            )
        
        return Response({
            'message': 'Documento caricato con successo',
            'documento': DocumentoAppuntamentoSerializer(documento).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='upload')
    def upload_documento(self, request, pk=None):
        """
        Upload di un documento (solo Cliente).
        POST /api/documenti-appuntamento/{id}/upload/
        Body: FormData with 'file'
        """
        documento = self.get_object()
        
        # Verifica permessi: solo il cliente può caricare
        if request.user.role != 'cliente':
            return Response(
                {'error': 'Solo i clienti possono caricare documenti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica che il documento sia dello stato corretto
        if documento.stato not in [DocumentoStato.DA_CARICARE, DocumentoStato.RIFIUTATO]:
            return Response(
                {'error': f'Impossibile caricare documento nello stato {documento.get_stato_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DocumentoAppuntamentoUploadSerializer(
            documento,
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Notifica il notaio
            appuntamento = documento.appuntamento
            if appuntamento.notary:
                Notifica.crea_notifica(
                    user=appuntamento.notary.user,
                    tipo=NotificaTipo.DOCUMENTO_CARICATO,
                    titolo='Nuovo Documento Caricato',
                    messaggio=f'Un nuovo documento "{documento.document_type.name}" è stato caricato per l\'appuntamento "{appuntamento.titolo}"',
                    link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                    appuntamento=appuntamento
                )
            
            return Response({
                'message': 'Documento caricato con successo',
                'documento': DocumentoAppuntamentoSerializer(documento).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='verifica')
    def verifica_documento(self, request, pk=None):
        """
        Verifica (accetta/rifiuta) un documento (solo Notaio/Staff).
        POST /api/documenti-appuntamento/{id}/verifica/
        Body: {
            "azione": "accetta" | "rifiuta",
            "note_rifiuto": "...",  (obbligatorio se rifiuta)
            "note_interne": "..."  (opzionale)
        }
        """
        documento = self.get_object()
        
        # Verifica permessi
        if request.user.role not in ['notaio', 'admin']:
            return Response(
                {'error': 'Solo i notai possono verificare i documenti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica stato
        if documento.stato not in [DocumentoStato.CARICATO, DocumentoStato.IN_VERIFICA]:
            return Response(
                {'error': f'Impossibile verificare documento nello stato {documento.get_stato_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DocumentoAppuntamentoVerificaSerializer(data=request.data)
        if serializer.is_valid():
            azione = serializer.validated_data['azione']
            note_rifiuto = serializer.validated_data.get('note_rifiuto', '')
            note_interne = serializer.validated_data.get('note_interne', '')
            
            if azione == 'accetta':
                documento.accetta(request.user, note_interne)
                tipo_notifica = NotificaTipo.DOCUMENTO_ACCETTATO
                messaggio = f'Il documento "{documento.document_type.name}" è stato accettato'
            else:  # rifiuta
                documento.rifiuta(request.user, note_rifiuto)
                tipo_notifica = NotificaTipo.DOCUMENTO_RIFIUTATO
                messaggio = f'Il documento "{documento.document_type.name}" è stato rifiutato. Motivo: {note_rifiuto}'
            
            # Notifica il cliente
            appuntamento = documento.appuntamento
            cliente = appuntamento.partecipanti.filter(cliente__isnull=False).first()
            if cliente and cliente.cliente:
                Notifica.crea_notifica(
                    user=cliente.cliente.user,
                    tipo=tipo_notifica,
                    titolo=f'Documento {azione.capitalize()}to',
                    messaggio=messaggio,
                    link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                    appuntamento=appuntamento
                )
            
            # Verifica se tutti i documenti sono stati verificati
            if documento.appuntamento.verifica_completamento_documenti():
                # Tutti i documenti verificati, notifica cliente e abilita atto virtuale
                documento.appuntamento.abilita_atto_virtuale()
                
                if cliente and cliente.cliente:
                    Notifica.crea_notifica(
                        user=cliente.cliente.user,
                        tipo=NotificaTipo.ATTO_VIRTUALE_DISPONIBILE,
                        titolo='Atto Virtuale Disponibile',
                        messaggio=f'Tutti i documenti sono stati verificati. Puoi ora accedere all\'atto virtuale per "{appuntamento.titolo}"',
                        link_url=f'/dashboard/appuntamenti/{appuntamento.id}/atto-virtuale',
                        appuntamento=appuntamento,
                        invia_email=True
                    )
            
            return Response({
                'message': f'Documento {azione}to con successo',
                'documento': DocumentoAppuntamentoSerializer(documento).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='appuntamento/(?P<appuntamento_id>[^/.]+)/invia-per-verifica')
    def invia_per_verifica(self, request, appuntamento_id=None):
        """
        Invia tutti i documenti caricati per la verifica del notaio.
        Cambia lo stato da CARICATO a IN_VERIFICA.
        POST /api/documenti-appuntamento/appuntamento/{appuntamento_id}/invia-per-verifica/
        """
        print(f"📨 Invio documenti per verifica - Appuntamento: {appuntamento_id}")
        
        # Verifica permessi: solo il cliente può inviare
        if request.user.role not in ['cliente', 'client']:
            return Response(
                {'error': 'Solo i clienti possono inviare documenti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verifica che l'appuntamento esista
        try:
            appuntamento = Appuntamento.objects.get(id=appuntamento_id)
            
            # Verifica che il cliente sia un partecipante dell'appuntamento
            from accounts.models import Cliente
            cliente = Cliente.objects.filter(user=request.user).first()
            if cliente:
                partecipante_exists = appuntamento.partecipanti.filter(cliente=cliente).exists()
                if not partecipante_exists:
                    return Response(
                        {'error': 'Non hai i permessi per questo appuntamento'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'error': 'Profilo cliente non trovato'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Appuntamento.DoesNotExist:
            return Response(
                {'error': 'Appuntamento non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Trova tutti i documenti con stato CARICATO
        documenti_da_inviare = DocumentoAppuntamento.objects.filter(
            appuntamento=appuntamento,
            stato=DocumentoStato.CARICATO
        )
        
        if not documenti_da_inviare.exists():
            return Response(
                {'error': 'Nessun documento da inviare'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambia stato a IN_VERIFICA
        count = 0
        for documento in documenti_da_inviare:
            documento.stato = DocumentoStato.IN_VERIFICA
            documento.save()
            count += 1
        
        print(f"✅ {count} documenti inviati per verifica")
        
        # Notifica il notaio
        if appuntamento.notary:
            Notifica.crea_notifica(
                user=appuntamento.notary.user,
                tipo=NotificaTipo.DOCUMENTO_CARICATO,
                titolo='Documenti Pronti per Verifica',
                messaggio=f'{count} documento(i) sono stati inviati per la verifica per l\'appuntamento "{appuntamento.titolo}"',
                link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                appuntamento=appuntamento
            )
        
        return Response({
            'message': f'{count} documento(i) inviato(i) per verifica',
            'documenti_inviati': count
        }, status=status.HTTP_200_OK)


# ============================================
# DOCUMENTI RICHIESTI PER TIPOLOGIA ATTO
# ============================================

class DocumentiRichiestiView(viewsets.ViewSet):
    """
    ViewSet per ottenere i documenti richiesti per una tipologia di atto.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='tipologia/(?P<tipologia_id>[^/.]+)')
    def by_tipologia(self, request, tipologia_id=None):
        """
        Lista documenti richiesti per una tipologia di atto.
        GET /api/documenti-richiesti/tipologia/{tipologia_id}/
        """
        tipologia = get_object_or_404(NotarialActCategory, pk=tipologia_id)
        
        documenti_richiesti = NotarialActCategoryDocument.objects.filter(
            act_category=tipologia
        ).select_related('document_type').order_by('order', 'document_type__category')
        
        result = []
        for doc_rel in documenti_richiesti:
            doc_data = DocumentTypeSimpleSerializer(doc_rel.document_type).data
            doc_data['is_mandatory'] = doc_rel.is_mandatory
            doc_data['notes'] = doc_rel.notes
            doc_data['order'] = doc_rel.order
            result.append(doc_data)
        
        return Response({
            'tipologia': {
                'id': tipologia.id,
                'name': tipologia.name,
                'code': tipologia.code
            },
            'documenti_richiesti': result,
            'totale': len(result)
        })


# ============================================
# NOTIFICHE
# ============================================

class NotificaViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione delle notifiche.
    """
    serializer_class = NotificaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Ogni utente vede solo le sue notifiche."""
        return Notifica.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        """Usa serializer semplificato per la lista."""
        if self.action == 'list':
            return NotificaListSerializer
        return NotificaSerializer
    
    @action(detail=False, methods=['get'])
    def non_lette(self, request):
        """
        Lista notifiche non lette.
        GET /api/notifiche/non_lette/
        """
        notifiche = self.get_queryset().filter(letta=False)
        serializer = NotificaListSerializer(notifiche, many=True)
        return Response({
            'count': notifiche.count(),
            'notifiche': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='segna-letta')
    def segna_letta(self, request, pk=None):
        """
        Segna una notifica come letta.
        POST /api/notifiche/{id}/segna-letta/
        """
        notifica = self.get_object()
        notifica.segna_come_letta()
        return Response({
            'message': 'Notifica segnata come letta',
            'notifica': NotificaSerializer(notifica).data
        })
    
    @action(detail=False, methods=['post'], url_path='segna-tutte-lette')
    def segna_tutte_lette(self, request):
        """
        Segna tutte le notifiche come lette.
        POST /api/notifiche/segna-tutte-lette/
        """
        notifiche = self.get_queryset().filter(letta=False)
        count = notifiche.count()
        
        for notifica in notifiche:
            notifica.segna_come_letta()
        
        return Response({
            'message': f'{count} notifiche segnate come lette',
            'count': count
        })

