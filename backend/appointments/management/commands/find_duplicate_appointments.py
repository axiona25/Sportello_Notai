from django.core.management.base import BaseCommand
from appointments.models import Appuntamento
from django.db.models import Q

class Command(BaseCommand):
    help = 'Trova appuntamenti sovrapposti per lo stesso notaio'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-provisionals',
            action='store_true',
            help='Elimina automaticamente gli appuntamenti PROVVISORI duplicati (mantiene il più recente)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🔍 Ricerca appuntamenti sovrapposti...\n'))
        
        appointments = Appuntamento.objects.exclude(
            status='RIFIUTATO'
        ).order_by('notary', 'start_time')
        
        duplicates = []
        checked = set()
        to_delete = []
        
        for apt1 in appointments:
            if apt1.id in checked:
                continue
                
            # Trova appuntamenti sovrapposti
            overlapping = Appuntamento.objects.filter(
                notary=apt1.notary
            ).exclude(
                id=apt1.id
            ).exclude(
                status='RIFIUTATO'
            ).filter(
                Q(start_time__lt=apt1.end_time) & Q(end_time__gt=apt1.start_time)
            )
            
            if overlapping.exists():
                for apt2 in overlapping:
                    if apt2.id not in checked:
                        duplicates.append((apt1, apt2))
                        
                        self.stdout.write(
                            self.style.WARNING(
                                f'\n⚠️  SOVRAPPOSIZIONE TROVATA:'
                                f'\n   📍 Appuntamento 1:'
                                f'\n      ID: {apt1.id}'
                                f'\n      Status: {apt1.status}'
                                f'\n      Data/Ora: {apt1.start_time.strftime("%Y-%m-%d %H:%M")} - {apt1.end_time.strftime("%H:%M")}'
                                f'\n      Creato: {apt1.created_at.strftime("%Y-%m-%d %H:%M:%S") if apt1.created_at else "N/A"}'
                                f'\n   📍 Appuntamento 2:'
                                f'\n      ID: {apt2.id}'
                                f'\n      Status: {apt2.status}'
                                f'\n      Data/Ora: {apt2.start_time.strftime("%Y-%m-%d %H:%M")} - {apt2.end_time.strftime("%H:%M")}'
                                f'\n      Creato: {apt2.created_at.strftime("%Y-%m-%d %H:%M:%S") if apt2.created_at else "N/A"}'
                                f'\n   🏢 Notaio: {apt1.notary.studio_name if apt1.notary else "N/A"}'
                            )
                        )
                        
                        # Se richiesto, segna per eliminazione i provvisori meno recenti
                        if options['delete_provisionals']:
                            if apt1.status == 'PROVVISORIO' and apt2.status == 'PROVVISORIO':
                                # Elimina il più vecchio
                                if apt1.created_at and apt2.created_at:
                                    if apt1.created_at < apt2.created_at:
                                        to_delete.append(apt1)
                                        self.stdout.write(self.style.ERROR(f'      ❌ Verrà eliminato: {apt1.id} (più vecchio)'))
                                    else:
                                        to_delete.append(apt2)
                                        self.stdout.write(self.style.ERROR(f'      ❌ Verrà eliminato: {apt2.id} (più vecchio)'))
                            elif apt1.status == 'PROVVISORIO':
                                to_delete.append(apt1)
                                self.stdout.write(self.style.ERROR(f'      ❌ Verrà eliminato: {apt1.id} (provvisorio)'))
                            elif apt2.status == 'PROVVISORIO':
                                to_delete.append(apt2)
                                self.stdout.write(self.style.ERROR(f'      ❌ Verrà eliminato: {apt2.id} (provvisorio)'))
                        
                checked.add(apt1.id)
                checked.add(apt2.id)
        
        if not duplicates:
            self.stdout.write(self.style.SUCCESS('\n✅ Nessun appuntamento sovrapposto trovato!\n'))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'\n\n📊 Trovate {len(duplicates)} sovrapposizioni\n'
                )
            )
            
            if options['delete_provisionals'] and to_delete:
                self.stdout.write(self.style.WARNING(f'\n🗑️  Eliminazione di {len(to_delete)} appuntamenti provvisori duplicati...\n'))
                for apt in to_delete:
                    self.stdout.write(f'   Eliminando: {apt.id} - {apt.start_time.strftime("%Y-%m-%d %H:%M")}')
                    apt.delete()
                self.stdout.write(self.style.SUCCESS(f'\n✅ Eliminati {len(to_delete)} appuntamenti!\n'))
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'\n💡 Per eliminare automaticamente i provvisori duplicati, esegui:'
                        f'\n   python manage.py find_duplicate_appointments --delete-provisionals'
                        f'\n\n💡 Per eliminare manualmente, usa:'
                        f'\n   python manage.py shell'
                        f'\n   >>> from appointments.models import Appuntamento'
                        f'\n   >>> Appuntamento.objects.get(id="<ID>").delete()\n'
                    )
                )

