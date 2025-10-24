from django.core.management.base import BaseCommand
from appointments.models import Appuntamento, Notifica, NotificaTipo, DocumentoAppuntamento


class Command(BaseCommand):
    help = 'Ricrea notifiche "Documenti da Caricare" per appuntamenti che non hanno ancora tutti i documenti'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Ricerca appuntamenti che necessitano notifica documenti...')
        
        # Trova appuntamenti in documenti_in_caricamento o confermato
        appuntamenti = Appuntamento.objects.filter(
            status__in=['documenti_in_caricamento', 'confermato']
        ).select_related('tipologia_atto')
        
        self.stdout.write(f'📋 Trovati {appuntamenti.count()} appuntamenti da verificare')
        
        notifiche_create = 0
        
        for appuntamento in appuntamenti:
            # Verifica se esiste già una notifica DOCUMENTI_DA_CARICARE non letta
            cliente_partecipante = appuntamento.partecipanti.filter(ruolo='richiedente').first()
            
            if not cliente_partecipante or not cliente_partecipante.cliente:
                continue
                
            cliente = cliente_partecipante.cliente
            
            # Controlla se esiste già la notifica
            notifica_esistente = Notifica.objects.filter(
                user=cliente.user,
                tipo=NotificaTipo.DOCUMENTI_DA_CARICARE,
                appuntamento=appuntamento
            ).exists()
            
            if notifica_esistente:
                self.stdout.write(f'  ℹ️  Appuntamento {appuntamento.id}: notifica già esistente')
                continue
            
            # Verifica se ci sono documenti richiesti
            documenti_richiesti = DocumentoAppuntamento.objects.filter(
                appuntamento=appuntamento
            )
            
            if not documenti_richiesti.exists():
                self.stdout.write(f'  ⚠️  Appuntamento {appuntamento.id}: nessun documento richiesto')
                continue
            
            # Conta documenti caricati
            documenti_caricati = documenti_richiesti.filter(
                file__isnull=False
            ).exclude(file='').count()
            
            totale_documenti = documenti_richiesti.count()
            
            # Se NON tutti i documenti sono caricati, crea la notifica
            if documenti_caricati < totale_documenti:
                Notifica.crea_notifica(
                    user=cliente.user,
                    tipo=NotificaTipo.DOCUMENTI_DA_CARICARE,
                    titolo='Documenti da Caricare',
                    messaggio=f'Per l\'appuntamento "{appuntamento.titolo}" devi caricare i documenti richiesti.',
                    link_url=f'/dashboard/appuntamenti/{appuntamento.id}/documenti',
                    appuntamento=appuntamento,
                    invia_email=False  # Non inviare email per notifiche ricreate
                )
                
                notifiche_create += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✅ Appuntamento {appuntamento.id}: notifica creata '
                        f'(documenti: {documenti_caricati}/{totale_documenti})'
                    )
                )
            else:
                self.stdout.write(
                    f'  ✔️  Appuntamento {appuntamento.id}: tutti i documenti caricati '
                    f'({documenti_caricati}/{totale_documenti})'
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Completato! Create {notifiche_create} notifiche'
            )
        )

