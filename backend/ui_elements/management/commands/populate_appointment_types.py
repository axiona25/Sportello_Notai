"""
Management command to populate default appointment types.
"""
from django.core.management.base import BaseCommand
from ui_elements.models import AppointmentTypeTemplate


class Command(BaseCommand):
    help = 'Popola le tipologie di appuntamento di default'
    
    def handle(self, *args, **options):
        self.stdout.write('🚀 Popolamento tipologie appuntamento...')
        self.stdout.write('=' * 60)
        
        appointment_types = [
            {
                'code': 'rogito',
                'name': 'Rogito Notarile',
                'description': 'Atto pubblico compravendita immobiliare',
                'default_duration_minutes': 90,
                'icon': 'FileSignature',
                'color': '#4FADFF',
                'order': 1
            },
            {
                'code': 'consulenza',
                'name': 'Consulenza Legale',
                'description': 'Supporto e consulenza notarile',
                'default_duration_minutes': 45,
                'icon': 'Users',
                'color': '#10B981',
                'order': 2
            },
            {
                'code': 'revisione',
                'name': 'Revisione Documenti',
                'description': 'Verifica e revisione documentale',
                'default_duration_minutes': 30,
                'icon': 'FileText',
                'color': '#F59E0B',
                'order': 3
            },
            {
                'code': 'firma',
                'name': 'Firma Digitale',
                'description': 'Apposizione firma digitale su atti',
                'default_duration_minutes': 20,
                'icon': 'FileSignature',
                'color': '#8B5CF6',
                'order': 4
            },
            {
                'code': 'procura',
                'name': 'Procura',
                'description': 'Redazione e stipula atto di procura',
                'default_duration_minutes': 30,
                'icon': 'Users',
                'color': '#EC4899',
                'order': 5
            },
            {
                'code': 'testamento',
                'name': 'Testamento',
                'description': 'Redazione testamento pubblico o olografo',
                'default_duration_minutes': 60,
                'icon': 'FileText',
                'color': '#6366F1',
                'order': 6
            },
            {
                'code': 'donazione',
                'name': 'Donazione',
                'description': 'Atto di donazione beni mobili o immobili',
                'default_duration_minutes': 60,
                'icon': 'FileSignature',
                'color': '#EF4444',
                'order': 7
            },
            {
                'code': 'mutuo',
                'name': 'Mutuo',
                'description': 'Stipula contratto di mutuo ipotecario',
                'default_duration_minutes': 45,
                'icon': 'FileText',
                'color': '#14B8A6',
                'order': 8
            },
            {
                'code': 'costituzione',
                'name': 'Costituzione Società',
                'description': 'Costituzione di società di capitali o persone',
                'default_duration_minutes': 90,
                'icon': 'Users',
                'color': '#F97316',
                'order': 9
            },
            {
                'code': 'certificazione',
                'name': 'Certificazione',
                'description': 'Certificati e autentiche di firme',
                'default_duration_minutes': 20,
                'icon': 'FileSignature',
                'color': '#06B6D4',
                'order': 10
            },
            {
                'code': 'vidimazione',
                'name': 'Vidimazione',
                'description': 'Vidimazione libri sociali e registri',
                'default_duration_minutes': 15,
                'icon': 'FileText',
                'color': '#84CC16',
                'order': 11
            },
            {
                'code': 'altro',
                'name': 'Altro',
                'description': 'Altri servizi notarili',
                'default_duration_minutes': 30,
                'icon': 'Calendar',
                'color': '#64748B',
                'order': 12
            }
        ]
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for apt_data in appointment_types:
            code = apt_data['code']
            
            try:
                apt, created = AppointmentTypeTemplate.objects.update_or_create(
                    code=code,
                    defaults=apt_data
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Creato: {apt.name}')
                    )
                    created_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'🔄 Aggiornato: {apt.name}')
                    )
                    updated_count += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Errore con {code}: {e}')
                )
                skipped_count += 1
        
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write(f'📊 RIEPILOGO:')
        self.stdout.write(f'   ✅ Creati: {created_count}')
        self.stdout.write(f'   🔄 Aggiornati: {updated_count}')
        self.stdout.write(f'   ❌ Errori: {skipped_count}')
        self.stdout.write(f'   📦 Totale: {AppointmentTypeTemplate.objects.count()}')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✨ Popolamento completato!'))

