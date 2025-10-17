"""
Management command to populate document types and their associations with notarial act categories.
Based on research of required documents for notarial acts in Repubblica di San Marino.
"""
from django.core.management.base import BaseCommand
from acts.models import DocumentType, NotarialActCategory, NotarialActCategoryDocument


class Command(BaseCommand):
    help = 'Popola i tipi di documenti e le associazioni con le categorie di atti notarili'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Popolamento tipi di documenti...'))
        
        # Definizione dei tipi di documenti
        document_types = [
            # Documenti di Identità
            {'name': 'Documento d\'identità valido', 'code': 'DOC_IDENTITA', 'category': 'identita', 'required_from': 'cliente', 'description': 'Carta d\'identità, passaporto o patente'},
            {'name': 'Codice fiscale', 'code': 'CODICE_FISCALE', 'category': 'fiscale', 'required_from': 'cliente', 'description': 'Tessera del codice fiscale'},
            {'name': 'Permesso di soggiorno (extra UE)', 'code': 'PERMESSO_SOGGIORNO', 'category': 'identita', 'required_from': 'cliente', 'description': 'Per cittadini non UE', 'is_mandatory': False},
            
            # Stato Civile
            {'name': 'Certificato di stato civile', 'code': 'CERT_STATO_CIVILE', 'category': 'stato_civile', 'required_from': 'cliente', 'description': 'Certificato di matrimonio o stato libero'},
            {'name': 'Estratto di matrimonio', 'code': 'ESTRATTO_MATRIMONIO', 'category': 'stato_civile', 'required_from': 'cliente', 'description': 'Se coniugato', 'is_mandatory': False},
            {'name': 'Convenzione patrimoniale', 'code': 'CONVENZIONE_PATRIMONIALE', 'category': 'stato_civile', 'required_from': 'cliente', 'description': 'Se applicabile', 'is_mandatory': False},
            {'name': 'Certificato di morte', 'code': 'CERT_MORTE', 'category': 'stato_civile', 'required_from': 'cliente', 'description': 'Per atti di successione'},
            
            # Documenti Immobile
            {'name': 'Atto di provenienza', 'code': 'ATTO_PROVENIENZA', 'category': 'immobile', 'required_from': 'venditore', 'description': 'Precedente atto di acquisto dell\'immobile'},
            {'name': 'Visura catastale', 'code': 'VISURA_CATASTALE', 'category': 'immobile', 'required_from': 'PA', 'description': 'Dati catastali aggiornati'},
            {'name': 'Planimetria catastale', 'code': 'PLANIMETRIA_CATASTALE', 'category': 'immobile', 'required_from': 'PA', 'description': 'Planimetria aggiornata e conforme'},
            {'name': 'Certificato di agibilità', 'code': 'CERT_AGIBILITA', 'category': 'immobile', 'required_from': 'PA', 'description': 'Certificato di abitabilità/agibilità'},
            {'name': 'Attestato di Prestazione Energetica (APE)', 'code': 'APE', 'category': 'tecnico', 'required_from': 'professionista', 'description': 'Certificazione energetica'},
            {'name': 'Certificato di conformità urbanistica', 'code': 'CERT_URBANISTICA', 'category': 'immobile', 'required_from': 'PA', 'description': 'Conformità urbanistica dell\'immobile'},
            {'name': 'Certificati di conformità impiantistica', 'code': 'CERT_IMPIANTI', 'category': 'tecnico', 'required_from': 'professionista', 'description': 'Certificati impianti elettrico, idraulico, gas'},
            {'name': 'Regolamento di condominio', 'code': 'REGOLAMENTO_CONDOMINIO', 'category': 'immobile', 'required_from': 'venditore', 'description': 'Se immobile in condominio', 'is_mandatory': False},
            {'name': 'Tabella millesimale', 'code': 'TABELLA_MILLESIMALE', 'category': 'immobile', 'required_from': 'venditore', 'description': 'Per immobili in condominio', 'is_mandatory': False},
            {'name': 'Perizia di stima immobile', 'code': 'PERIZIA_STIMA', 'category': 'tecnico', 'required_from': 'professionista', 'description': 'Valutazione del valore di mercato', 'is_mandatory': False},
            
            # Documenti Societari
            {'name': 'Certificato di iscrizione al Registro delle Imprese', 'code': 'CERT_REGISTRO_IMPRESE', 'category': 'societario', 'required_from': 'cliente', 'description': 'Visura camerale'},
            {'name': 'Statuto sociale', 'code': 'STATUTO_SOCIALE', 'category': 'societario', 'required_from': 'cliente', 'description': 'Statuto della società'},
            {'name': 'Atto costitutivo', 'code': 'ATTO_COSTITUTIVO', 'category': 'societario', 'required_from': 'cliente', 'description': 'Atto costitutivo della società'},
            {'name': 'Delibera assembleare', 'code': 'DELIBERA_ASSEMBLEARE', 'category': 'societario', 'required_from': 'cliente', 'description': 'Delibera con delega di poteri'},
            {'name': 'Verbale di assemblea', 'code': 'VERBALE_ASSEMBLEA', 'category': 'societario', 'required_from': 'cliente', 'description': 'Verbale delle decisioni assembleari'},
            {'name': 'Certificato versamento capitale sociale', 'code': 'CERT_CAPITALE', 'category': 'finanziario', 'required_from': 'banca', 'description': 'Attestazione versamento capitale'},
            
            # Documenti Finanziari/Banca
            {'name': 'Contratto di mutuo', 'code': 'CONTRATTO_MUTUO', 'category': 'finanziario', 'required_from': 'banca', 'description': 'Contratto di finanziamento'},
            {'name': 'Delibera di concessione mutuo', 'code': 'DELIBERA_MUTUO', 'category': 'finanziario', 'required_from': 'banca', 'description': 'Approvazione del finanziamento'},
            {'name': 'Documentazione reddituale', 'code': 'DOC_REDDITUALE', 'category': 'fiscale', 'required_from': 'cliente', 'description': 'Ultime dichiarazioni dei redditi, buste paga'},
            {'name': 'Piano di ammortamento', 'code': 'PIANO_AMMORTAMENTO', 'category': 'finanziario', 'required_from': 'banca', 'description': 'Piano di rimborso del mutuo'},
            
            # Successioni
            {'name': 'Testamento', 'code': 'TESTAMENTO', 'category': 'altro', 'required_from': 'cliente', 'description': 'Testamento del de cuius', 'is_mandatory': False},
            {'name': 'Dichiarazione di successione', 'code': 'DICHIARAZIONE_SUCCESSIONE', 'category': 'fiscale', 'required_from': 'cliente', 'description': 'Dichiarazione degli eredi'},
            {'name': 'Certificato degli eredi', 'code': 'CERT_EREDI', 'category': 'stato_civile', 'required_from': 'cliente', 'description': 'Elenco degli aventi diritto'},
            
            # Procure
            {'name': 'Dati del mandatario', 'code': 'DATI_MANDATARIO', 'category': 'altro', 'required_from': 'cliente', 'description': 'Dati anagrafici completi del procuratore'},
            {'name': 'Descrizione poteri conferiti', 'code': 'DESC_POTERI', 'category': 'altro', 'required_from': 'cliente', 'description': 'Elenco dettagliato dei poteri da conferire'},
            
            # Altri
            {'name': 'Contratto preliminare', 'code': 'CONTRATTO_PRELIMINARE', 'category': 'altro', 'required_from': 'entrambi', 'description': 'Compromesso di compravendita', 'is_mandatory': False},
            {'name': 'Ricevuta caparra confirmatoria', 'code': 'RICEVUTA_CAPARRA', 'category': 'finanziario', 'required_from': 'venditore', 'description': 'Prova del pagamento della caparra', 'is_mandatory': False},
            {'name': 'Autodichiarazione requisiti prima casa', 'code': 'AUTODICH_PRIMA_CASA', 'category': 'fiscale', 'required_from': 'acquirente', 'description': 'Per agevolazioni fiscali', 'is_mandatory': False},
            {'name': 'Perizia giurata', 'code': 'PERIZIA_GIURATA', 'category': 'tecnico', 'required_from': 'professionista', 'description': 'Perizia tecnica giurata', 'is_mandatory': False},
        ]
        
        created_docs = 0
        for doc_data in document_types:
            doc, created = DocumentType.objects.update_or_create(
                code=doc_data['code'],
                defaults={
                    'name': doc_data['name'],
                    'description': doc_data.get('description', ''),
                    'category': doc_data['category'],
                    'required_from': doc_data['required_from'],
                    'is_mandatory': doc_data.get('is_mandatory', True),
                    'is_active': True,
                }
            )
            if created:
                created_docs += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Creato documento: {doc.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Documenti creati: {created_docs}'))
        self.stdout.write(self.style.SUCCESS(f'   Totale documenti: {DocumentType.objects.count()}'))
        
        # Ora associo i documenti alle categorie di atti
        self.stdout.write(self.style.SUCCESS('\n\nAssociazione documenti alle categorie di atti...'))
        
        associations = self._get_document_associations()
        created_assoc = 0
        
        for assoc_data in associations:
            try:
                act_category = NotarialActCategory.objects.get(code=assoc_data['act_code'])
                document_type = DocumentType.objects.get(code=assoc_data['doc_code'])
                
                assoc, created = NotarialActCategoryDocument.objects.update_or_create(
                    act_category=act_category,
                    document_type=document_type,
                    defaults={
                        'is_mandatory': assoc_data.get('is_mandatory', True),
                        'notes': assoc_data.get('notes', ''),
                        'order': assoc_data.get('order', 0),
                    }
                )
                
                if created:
                    created_assoc += 1
            except (NotarialActCategory.DoesNotExist, DocumentType.DoesNotExist) as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Categoria o documento non trovato: {e}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Associazioni completate!\n'
            f'   - Nuove associazioni create: {created_assoc}\n'
            f'   - Totale associazioni: {NotarialActCategoryDocument.objects.count()}'
        ))
    
    def _get_document_associations(self):
        """Ritorna le associazioni tra categorie di atti e documenti richiesti."""
        
        # Documenti comuni per tutte le compravendite immobiliari
        docs_compravendita = [
            'DOC_IDENTITA', 'CODICE_FISCALE', 'CERT_STATO_CIVILE', 
            'ATTO_PROVENIENZA', 'VISURA_CATASTALE', 'PLANIMETRIA_CATASTALE',
            'CERT_AGIBILITA', 'APE', 'CERT_IMPIANTI'
        ]
        
        # Documenti comuni per atti con persone fisiche
        docs_persona_fisica = ['DOC_IDENTITA', 'CODICE_FISCALE', 'CERT_STATO_CIVILE']
        
        # Documenti comuni per atti societari
        docs_societari = [
            'DOC_IDENTITA', 'CODICE_FISCALE', 'CERT_REGISTRO_IMPRESE',
            'STATUTO_SOCIALE', 'DELIBERA_ASSEMBLEARE'
        ]
        
        associations = []
        
        # PROCURE
        for act_code in ['PROCURA_GENERALE', 'PROCURA_SPECIALE_VENDITA']:
            for idx, doc_code in enumerate(docs_persona_fisica + ['DATI_MANDATARIO', 'DESC_POTERI']):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # Se procura speciale a vendere, aggiungi anche documenti immobile
        for idx, doc_code in enumerate(['ATTO_PROVENIENZA', 'VISURA_CATASTALE'], start=10):
            associations.append({'act_code': 'PROCURA_SPECIALE_VENDITA', 'doc_code': doc_code, 'order': idx})
        
        # AUTENTICAZIONE FIRMA
        for idx, doc_code in enumerate(['DOC_IDENTITA']):
            associations.append({'act_code': 'AUTENTICAZIONE_FIRMA', 'doc_code': doc_code, 'order': idx})
        
        # MATRIMONIO
        for idx, doc_code in enumerate(docs_persona_fisica):
            associations.append({'act_code': 'NOTORIETA_MATRIMONIO', 'doc_code': doc_code, 'order': idx})
        
        # REGIME PATRIMONIALE
        for idx, doc_code in enumerate(docs_persona_fisica + ['ESTRATTO_MATRIMONIO']):
            associations.append({'act_code': 'REGIME_PATRIMONIALE', 'doc_code': doc_code, 'order': idx})
        
        # TESTAMENTI
        for act_code in ['TESTAMENTO_PUBBLICO', 'TESTAMENTO_SEGRETO', 'TESTAMENTO_OLOGRAFO']:
            for idx, doc_code in enumerate(docs_persona_fisica):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # SUCCESSIONI
        docs_successione = docs_persona_fisica + ['CERT_MORTE', 'DICHIARAZIONE_SUCCESSIONE', 'CERT_EREDI']
        for act_code in ['ACCETTAZIONE_EREDITA', 'RINUNCIA_EREDITA']:
            for idx, doc_code in enumerate(docs_successione):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # DONAZIONI IMMOBILI
        for idx, doc_code in enumerate(docs_compravendita):
            associations.append({'act_code': 'DONAZIONE_IMMOBILI', 'doc_code': doc_code, 'order': idx})
        
        # COMPRAVENDITE IMMOBILIARI
        for act_code in ['COMPRAVENDITA_IMMOBILI', 'COMPRAVENDITA_PRIMA_CASA', 'PERMUTA', 'DIVISIONE_IMMOBILE']:
            for idx, doc_code in enumerate(docs_compravendita):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # Prima casa - aggiungi autodichiarazione
        associations.append({'act_code': 'COMPRAVENDITA_PRIMA_CASA', 'doc_code': 'AUTODICH_PRIMA_CASA', 'order': 20})
        
        # MUTUI
        docs_mutuo = docs_persona_fisica + [
            'CONTRATTO_MUTUO', 'DELIBERA_MUTUO', 'DOC_REDDITUALE',
            'VISURA_CATASTALE', 'PERIZIA_STIMA'
        ]
        for act_code in ['MUTUO_CON_IPOTECA', 'MUTUO_SENZA_IPOTECA']:
            for idx, doc_code in enumerate(docs_mutuo):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # CANCELLAZIONE IPOTECA
        for idx, doc_code in enumerate(['DOC_IDENTITA', 'CODICE_FISCALE', 'VISURA_CATASTALE']):
            associations.append({'act_code': 'CANCELLAZIONE_IPOTECA', 'doc_code': doc_code, 'order': idx})
        
        # LEASING
        for idx, doc_code in enumerate(docs_compravendita + ['CONTRATTO_MUTUO']):
            associations.append({'act_code': 'LEASING', 'doc_code': doc_code, 'order': idx})
        
        # LOCAZIONE
        for idx, doc_code in enumerate(docs_persona_fisica + ['VISURA_CATASTALE', 'CERT_AGIBILITA']):
            associations.append({'act_code': 'LOCAZIONE_IMMOBILE', 'doc_code': doc_code, 'order': idx})
        
        # COSTITUZIONE SOCIETÀ
        for act_code in ['COSTITUZIONE_SPA', 'COSTITUZIONE_SRL']:
            for idx, doc_code in enumerate(docs_societari + ['ATTO_COSTITUTIVO', 'CERT_CAPITALE']):
                associations.append({'act_code': act_code, 'doc_code': doc_code, 'order': idx})
        
        # VERBALE ASSEMBLEA
        for idx, doc_code in enumerate(['CERT_REGISTRO_IMPRESE', 'STATUTO_SOCIALE']):
            associations.append({'act_code': 'VERBALE_ASSEMBLEA', 'doc_code': doc_code, 'order': idx})
        
        # CESSIONE QUOTE
        for idx, doc_code in enumerate(docs_societari):
            associations.append({'act_code': 'CESSIONE_QUOTE_SRL', 'doc_code': doc_code, 'order': idx})
        
        return associations

