"""
Signals per sincronizzare i modelli Notary e Notaio.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date, time
from .models import Notary
from accounts.models import Notaio
from appointments.models import DisponibilitaNotaio


@receiver(post_save, sender=Notary)
def create_or_update_notaio_profile(sender, instance, created, **kwargs):
    """
    Quando viene creato/aggiornato un Notary, crea/aggiorna automaticamente
    il corrispondente profilo Notaio (per gli appuntamenti).
    """
    try:
        # Controlla se esiste già il profilo Notaio
        notaio = Notaio.objects.filter(user=instance.user).first()
        
        if not notaio and created:
            # Crea il profilo Notaio solo se non esiste
            # Estrai nome e cognome dal studio_name
            name_parts = instance.studio_name.replace('Studio Notarile ', '').split()
            nome = name_parts[0] if len(name_parts) > 0 else 'Nome'
            cognome = ' '.join(name_parts[1:]) if len(name_parts) > 1 else 'Cognome'
            
            # Genera un codice fiscale fittizio basato sul nome
            cf_base = (cognome[:3].upper() + nome[:3].upper() + '80A01Z130').ljust(16, 'X')[:16]
            
            # Controlla se il codice fiscale esiste già
            cf_counter = 0
            codice_fiscale = cf_base
            while Notaio.objects.filter(codice_fiscale=codice_fiscale).exists():
                cf_counter += 1
                codice_fiscale = cf_base[:-2] + str(cf_counter).zfill(2)
            
            # Genera numero iscrizione albo unico
            albo_counter = Notaio.objects.count() + 1
            numero_albo = f'NOT{albo_counter:04d}SM'
            while Notaio.objects.filter(numero_iscrizione_albo=numero_albo).exists():
                albo_counter += 1
                numero_albo = f'NOT{albo_counter:04d}SM'
            
            notaio = Notaio.objects.create(
                user=instance.user,
                nome=nome,
                cognome=cognome,
                sesso='M',  # Default, può essere modificato dopo
                data_nascita=date(1980, 1, 1),  # Default
                luogo_nascita='San Marino',
                codice_fiscale=codice_fiscale,
                numero_iscrizione_albo=numero_albo,
                distretto_notarile='San Marino',
                data_iscrizione_albo=date(2020, 1, 1),
                sede_notarile=instance.address_city or 'Dogana',
                tipologia='notaio_singolo',
                denominazione_studio=instance.studio_name,
                partita_iva=None,  # Da compilare manualmente dopo
                indirizzo_studio=instance.address_street or 'Via Principale',
                civico='1',
                cap=instance.address_cap or '47890',
                citta=instance.address_city or 'Dogana',
                provincia=instance.address_province or 'SM',
                nazione=instance.address_country or 'San Marino',
                telefono_studio=instance.phone or '+378 0549 000000',
                cellulare=instance.phone or '+378 000000000',
                email_studio=instance.user.email,
                pec=instance.pec_address or f'{instance.user.email.split("@")[0]}@pec.sm',
                sito_web=instance.website or '',
                is_active=True,
                is_verified=True  # Auto-verificato se viene da registrazione
            )
            
            print(f'✅ Profilo Notaio creato automaticamente per {instance.studio_name}')
            
        elif notaio and not created:
            # Aggiorna alcuni campi sincronizzati
            updated = False
            
            if notaio.denominazione_studio != instance.studio_name:
                notaio.denominazione_studio = instance.studio_name
                updated = True
            
            if notaio.citta != instance.address_city and instance.address_city:
                notaio.citta = instance.address_city
                notaio.sede_notarile = instance.address_city
                updated = True
            
            if notaio.telefono_studio != instance.phone and instance.phone:
                notaio.telefono_studio = instance.phone
                updated = True
            
            if notaio.email_studio != instance.user.email:
                notaio.email_studio = instance.user.email
                updated = True
            
            if updated:
                notaio.save()
                print(f'✅ Profilo Notaio aggiornato per {instance.studio_name}')
    
    except Exception as e:
        print(f'❌ Errore nella sincronizzazione Notary -> Notaio: {e}')

