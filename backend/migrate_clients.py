#!/usr/bin/env python
"""
Script per migrare i clienti dal modello Cliente (accounts) al modello Client (notaries).
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import Cliente as ClienteOld, User
from notaries.models import Client as ClientNew
from django.db import transaction

def migrate_clients():
    """Migra tutti i clienti dal modello vecchio al nuovo."""
    
    print("🔄 Inizio migrazione clienti...")
    
    # Conta clienti vecchi
    old_clients = ClienteOld.objects.all()
    total = old_clients.count()
    print(f"📊 Trovati {total} clienti da migrare")
    
    migrated = 0
    skipped = 0
    errors = 0
    
    with transaction.atomic():
        for old_client in old_clients:
            try:
                # Verifica se esiste già un client nuovo per questo utente
                if ClientNew.objects.filter(user=old_client.user).exists():
                    print(f"⏭️  Cliente {old_client.user.email} già migrato, skip")
                    skipped += 1
                    continue
                
                # Crea nuovo client con i dati del vecchio
                new_client = ClientNew(
                    user=old_client.user,
                    first_name=old_client.nome or '',
                    last_name=old_client.cognome or '',
                    fiscal_code=old_client.codice_fiscale or '',
                    birth_date=old_client.data_nascita,
                    birth_place=old_client.luogo_nascita or '',
                    phone=old_client.cellulare or '',
                    residence_street=f"{old_client.indirizzo or ''} {old_client.civico or ''}".strip(),
                    residence_city=old_client.citta or '',
                    residence_cap=old_client.cap or '',
                    residence_country=old_client.nazione or 'San Marino'
                )
                new_client.save()
                
                print(f"✅ Migrato: {old_client.nome} {old_client.cognome} ({old_client.user.email})")
                migrated += 1
                
            except Exception as e:
                print(f"❌ Errore migrazione {old_client.user.email}: {e}")
                errors += 1
    
    print("\n" + "="*60)
    print(f"✅ Migrazione completata!")
    print(f"📊 Statistiche:")
    print(f"   - Totale clienti vecchi: {total}")
    print(f"   - Migrati: {migrated}")
    print(f"   - Già esistenti (skip): {skipped}")
    print(f"   - Errori: {errors}")
    print("="*60)
    
    return migrated, skipped, errors

if __name__ == '__main__':
    migrate_clients()

