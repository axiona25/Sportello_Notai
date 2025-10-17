"""
Management command to populate notarial act categories for Repubblica di San Marino.
Based on: "Breve Formulario degli Atti Notarili della Repubblica di San Marino" (2009)
"""
from django.core.management.base import BaseCommand
from acts.models import NotarialActMainCategory, NotarialActCategory


class Command(BaseCommand):
    help = 'Popola le categorie degli atti notarili della Repubblica di San Marino'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Popolamento categorie atti notarili...'))
        
        # Definizione delle categorie principali e sottocategorie
        categories_data = {
            'PROCURE': {
                'name': 'Procure',
                'code': 'PROCURE',
                'description': 'Procure generali e speciali',
                'order': 1,
                'subcategories': [
                    {'name': 'Procura generale', 'code': 'PROCURA_GENERALE', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Procura speciale a vendere immobile', 'code': 'PROCURA_SPECIALE_VENDITA', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Autenticazione di firma', 'code': 'AUTENTICAZIONE_FIRMA', 'requires_property': False, 'requires_bank': False},
                ]
            },
            'PERSONE_FAMIGLIA': {
                'name': 'Atti relativi alle persone e alla famiglia',
                'code': 'PERSONE_FAMIGLIA',
                'description': 'Atti di famiglia e regime patrimoniale',
                'order': 2,
                'subcategories': [
                    {'name': 'Atto di notorietà per contrarre matrimonio', 'code': 'NOTORIETA_MATRIMONIO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Opzione di regime patrimoniale', 'code': 'REGIME_PATRIMONIALE', 'requires_property': False, 'requires_bank': False},
                ]
            },
            'SUCCESSIONI_DONAZIONI': {
                'name': 'Successioni e donazioni',
                'code': 'SUCCESSIONI_DONAZIONI',
                'description': 'Testamenti, successioni, donazioni',
                'order': 3,
                'subcategories': [
                    {'name': 'Testamento pubblico', 'code': 'TESTAMENTO_PUBBLICO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Testamento segreto', 'code': 'TESTAMENTO_SEGRETO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Testamento olografo', 'code': 'TESTAMENTO_OLOGRAFO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Pubblicazione di testamento', 'code': 'PUBBLICAZIONE_TESTAMENTO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Revoca di testamento', 'code': 'REVOCA_TESTAMENTO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Accettazione di eredità', 'code': 'ACCETTAZIONE_EREDITA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Rinuncia all\'eredità', 'code': 'RINUNCIA_EREDITA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Inventario', 'code': 'INVENTARIO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Donazione di beni immobili', 'code': 'DONAZIONE_IMMOBILI', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Donazione di beni mobili', 'code': 'DONAZIONE_MOBILI', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Cessione a titolo di antiparte di quota di immobile', 'code': 'CESSIONE_ANTIPARTE', 'requires_property': True, 'requires_bank': False},
                ]
            },
            'PROPRIETA': {
                'name': 'Proprietà e compravendite immobiliari',
                'code': 'PROPRIETA',
                'description': 'Vendita, permuta, divisione di beni immobili',
                'order': 4,
                'subcategories': [
                    {'name': 'Compravendita di beni immobili', 'code': 'COMPRAVENDITA_IMMOBILI', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Compravendita immobiliare con benefici prima casa', 'code': 'COMPRAVENDITA_PRIMA_CASA', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Permuta', 'code': 'PERMUTA', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Cessione di quote ereditarie indivise di bene immobile', 'code': 'CESSIONE_QUOTE_EREDITARIE', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Divisione di bene immobile', 'code': 'DIVISIONE_IMMOBILE', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Locazione finanziaria (leasing)', 'code': 'LEASING', 'requires_property': True, 'requires_bank': True},
                    {'name': 'Riscatto di locazione finanziaria', 'code': 'RISCATTO_LEASING', 'requires_property': True, 'requires_bank': True},
                ]
            },
            'OBBLIGAZIONI_CONTRATTI': {
                'name': 'Obbligazioni e contratti',
                'code': 'OBBLIGAZIONI_CONTRATTI',
                'description': 'Contratti di locazione, mutuo, ipoteca',
                'order': 5,
                'subcategories': [
                    {'name': 'Contratto di locazione (affitto) di immobile', 'code': 'LOCAZIONE_IMMOBILE', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Contratto di comodato', 'code': 'COMODATO', 'requires_property': True, 'requires_bank': False},
                    {'name': 'Contratto di mutuo con iscrizione di ipoteca', 'code': 'MUTUO_CON_IPOTECA', 'requires_property': True, 'requires_bank': True},
                    {'name': 'Contratto di mutuo senza iscrizione di ipoteca', 'code': 'MUTUO_SENZA_IPOTECA', 'requires_property': False, 'requires_bank': True},
                    {'name': 'Cancellazione di ipoteca', 'code': 'CANCELLAZIONE_IPOTECA', 'requires_property': True, 'requires_bank': True},
                    {'name': 'Accollo di debito', 'code': 'ACCOLLO_DEBITO', 'requires_property': False, 'requires_bank': False},
                ]
            },
            'SOCIETA': {
                'name': 'Società',
                'code': 'SOCIETA',
                'description': 'Costituzione, gestione e liquidazione società',
                'order': 6,
                'subcategories': [
                    {'name': 'Atto costitutivo e statuto di società per azioni (S.p.A.)', 'code': 'COSTITUZIONE_SPA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Atto costitutivo e statuto di società a responsabilità limitata (S.r.l.)', 'code': 'COSTITUZIONE_SRL', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Verbale di assemblea di società', 'code': 'VERBALE_ASSEMBLEA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Cessione di quote di società a responsabilità limitata', 'code': 'CESSIONE_QUOTE_SRL', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Scioglimento e messa in liquidazione di società', 'code': 'LIQUIDAZIONE_SOCIETA', 'requires_property': False, 'requires_bank': False},
                ]
            },
            'FORMALITA_TUTELA': {
                'name': 'Formalità e tutela',
                'code': 'FORMALITA_TUTELA',
                'description': 'Trascrizioni, iscrizioni, certificazioni',
                'order': 7,
                'subcategories': [
                    {'name': 'Trascrizioni', 'code': 'TRASCRIZIONI', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Iscrizioni', 'code': 'ISCRIZIONI', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Dichiarazione giurata', 'code': 'DICHIARAZIONE_GIURATA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Rilascio di copie e certificazione di conformità', 'code': 'CERTIFICAZIONE_COPIE', 'requires_property': False, 'requires_bank': False},
                ]
            },
            'NORME_SPECIALI': {
                'name': 'Norme speciali',
                'code': 'NORME_SPECIALI',
                'description': 'Scritture private, veicoli, imbarcazioni',
                'order': 8,
                'subcategories': [
                    {'name': 'Scrittura privata autenticata', 'code': 'SCRITTURA_PRIVATA', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Vendita di autoveicolo', 'code': 'VENDITA_AUTOVEICOLO', 'requires_property': False, 'requires_bank': False},
                    {'name': 'Compravendita di imbarcazione', 'code': 'COMPRAVENDITA_IMBARCAZIONE', 'requires_property': False, 'requires_bank': False},
                ]
            },
        }
        
        created_main = 0
        created_sub = 0
        
        for main_key, main_data in categories_data.items():
            # Crea o aggiorna categoria principale
            main_category, created = NotarialActMainCategory.objects.update_or_create(
                code=main_data['code'],
                defaults={
                    'name': main_data['name'],
                    'description': main_data['description'],
                    'order': main_data['order'],
                    'is_active': True,
                }
            )
            
            if created:
                created_main += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Creata categoria principale: {main_category.name}'))
            else:
                self.stdout.write(f'  Aggiornata categoria principale: {main_category.name}')
            
            # Crea o aggiorna sottocategorie
            for order, sub_data in enumerate(main_data['subcategories'], start=1):
                sub_category, created = NotarialActCategory.objects.update_or_create(
                    code=sub_data['code'],
                    defaults={
                        'main_category': main_category,
                        'name': sub_data['name'],
                        'order': order,
                        'requires_property': sub_data['requires_property'],
                        'requires_bank': sub_data['requires_bank'],
                        'requires_parties': True,
                        'is_active': True,
                    }
                )
                
                if created:
                    created_sub += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Creata sottocategoria: {sub_category.name}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Popolamento completato!\n'
            f'   - Categorie principali create: {created_main}\n'
            f'   - Sottocategorie create: {created_sub}\n'
            f'   - Totale categorie principali: {NotarialActMainCategory.objects.count()}\n'
            f'   - Totale sottocategorie: {NotarialActCategory.objects.count()}'
        ))

