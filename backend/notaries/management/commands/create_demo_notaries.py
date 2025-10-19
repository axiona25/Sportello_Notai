"""
Management command to create demo notary profiles with showcase data
"""
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from accounts.models import User, UserRole
from notaries.models import Notary


class Command(BaseCommand):
    help = 'Create demo notary profiles with showcase data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🏗️ Creating demo notary profiles...'))
        
        # Notaio 1: Francesco Spada
        try:
            user1 = User.objects.get(email='notaio@digitalnotary.sm')
            
            # Crea o aggiorna il profilo notaio
            notary1, created = Notary.objects.update_or_create(
                user=user1,
                defaults={
                    'studio_name': 'Studio Notarile Francesco Spada',
                    'bio': 'Specializzato in compravendite immobiliari e diritto societario',
                    'specializations': ['Diritto Immobiliare', 'Diritto Societario'],
                    'phone': '+378 0549 987654',
                    'pec_address': 'notaio@pec.digitalnotary.sm',
                    'website': 'https://www.studionotarilespada.sm',
                    'address_street': 'Piazza Cavour n.19',
                    'address_city': 'Dogana',
                    'address_province': '',
                    'address_cap': '47891',
                    'address_country': 'San Marino',
                    'coordinates': Point(12.4564, 43.9320, srid=4326),  # Coordinate di San Marino
                    
                    # Vetrina Pubblica
                    'showcase_photo': '',  # Sarà caricato dall'utente
                    'showcase_experience': 15,
                    'showcase_languages': 'Italiano, Inglese',
                    'showcase_description': 'Consulenza notarile specializzata in compravendite immobiliari e diritto societario.',
                    'showcase_services': {
                        'documents': True,
                        'agenda': True,
                        'chat': True,
                        'acts': True,
                        'signature': True,
                        'pec': True,
                        'conservation': True
                    },
                    'showcase_availability_enabled': True,
                    'showcase_availability_hours': 'Lun-Ven 9:00-18:00',
                    
                    # Stats
                    'average_rating': 4.7,
                    'total_reviews': 24,
                    'total_acts': 150
                }
            )
            
            action = 'created' if created else 'updated'
            self.stdout.write(self.style.SUCCESS(f'✅ Notaio 1 (Francesco Spada) {action}'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ User notaio@digitalnotary.sm not found'))
        
        # Notaio 2: Chiara Benedettini
        try:
            # Crea utente se non esiste
            user2, _ = User.objects.get_or_create(
                email='chiara.benedettini@digitalnotary.sm',
                defaults={
                    'role': UserRole.NOTAIO,
                    'email_verified': True,
                    'status': 'active'
                }
            )
            user2.set_password('Notaio2024')
            user2.save()
            
            notary2, created = Notary.objects.update_or_create(
                user=user2,
                defaults={
                    'studio_name': 'Studio Notarile Chiara Benedettini',
                    'bio': 'Specializzata in successioni, donazioni e diritto di famiglia',
                    'specializations': ['Diritto Successorio', 'Diritto di Famiglia'],
                    'phone': '+378 0549 888111',
                    'pec_address': 'benedettini@pec.digitalnotary.sm',
                    'website': '',
                    'address_street': 'Via 28 Luglio n.212',
                    'address_city': 'Borgo Maggiore',
                    'address_province': '',
                    'address_cap': '47893',
                    'address_country': 'San Marino',
                    'coordinates': Point(12.4486, 43.9444, srid=4326),
                    
                    # Vetrina Pubblica
                    'showcase_photo': '',
                    'showcase_experience': 12,
                    'showcase_languages': 'Italiano, Francese',
                    'showcase_description': 'Specializzata in successioni, donazioni e diritto di famiglia.',
                    'showcase_services': {
                        'documents': True,
                        'agenda': True,
                        'chat': False,
                        'acts': True,
                        'signature': True,
                        'pec': False,
                        'conservation': True
                    },
                    'showcase_availability_enabled': True,
                    'showcase_availability_hours': 'Lun-Ven 9:00-17:00',
                    
                    # Stats
                    'average_rating': 4.6,
                    'total_reviews': 18,
                    'total_acts': 98
                }
            )
            
            action = 'created' if created else 'updated'
            self.stdout.write(self.style.SUCCESS(f'✅ Notaio 2 (Chiara Benedettini) {action}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error creating Notaio 2: {e}'))
        
        # Notaio 3: Dennis Beccari
        try:
            user3, _ = User.objects.get_or_create(
                email='dennis.beccari@digitalnotary.sm',
                defaults={
                    'role': UserRole.NOTAIO,
                    'email_verified': True,
                    'status': 'active'
                }
            )
            user3.set_password('Notaio2024')
            user3.save()
            
            notary3, created = Notary.objects.update_or_create(
                user=user3,
                defaults={
                    'studio_name': 'Studio Notarile Dennis Beccari',
                    'bio': 'Esperto in costituzioni societarie, fusioni e acquisizioni',
                    'specializations': ['Diritto Societario', 'M&A'],
                    'phone': '+378 0549 777333',
                    'pec_address': 'beccari@pec.digitalnotary.sm',
                    'website': 'https://www.studiobeccari.sm',
                    'address_street': 'Via 28 Luglio n.212',
                    'address_city': 'Borgo Maggiore',
                    'address_province': '',
                    'address_cap': '47893',
                    'address_country': 'San Marino',
                    'coordinates': Point(12.4486, 43.9444, srid=4326),
                    
                    # Vetrina Pubblica
                    'showcase_photo': '',
                    'showcase_experience': 20,
                    'showcase_languages': 'Italiano, Inglese, Tedesco',
                    'showcase_description': 'Esperto in costituzioni societarie, fusioni e acquisizioni.',
                    'showcase_services': {
                        'documents': True,
                        'agenda': True,
                        'chat': True,
                        'acts': True,
                        'signature': False,
                        'pec': True,
                        'conservation': False
                    },
                    'showcase_availability_enabled': True,
                    'showcase_availability_hours': 'Lun-Ven 8:30-19:00',
                    
                    # Stats
                    'average_rating': 4.8,
                    'total_reviews': 32,
                    'total_acts': 215
                }
            )
            
            action = 'created' if created else 'updated'
            self.stdout.write(self.style.SUCCESS(f'✅ Notaio 3 (Dennis Beccari) {action}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error creating Notaio 3: {e}'))
        
        self.stdout.write(self.style.SUCCESS('\n🎉 Demo notary profiles created successfully!'))

