#!/usr/bin/env python
"""
Script per aggiornare i riferimenti FK da Cliente (vecchio) a Client (nuovo).
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import Cliente as ClienteOld
from notaries.models import Client as ClientNew
from appointments.models import PartecipanteAppuntamento
from django.db import transaction, connection

def update_foreign_keys():
    """Aggiorna le FK che puntano a Cliente vecchio per puntare a Client nuovo."""
    
    print("🔄 Inizio aggiornamento FK...")
    
    updated = 0
    errors = 0
    
    # Ottieni la corrispondenza Cliente vecchio → Client nuovo
    mapping = {}
    for old_client in ClienteOld.objects.all():
        try:
            new_client = ClientNew.objects.get(user=old_client.user)
            mapping[old_client.id] = new_client.id
            print(f"📌 Mapping: {old_client.nome} {old_client.cognome} → {new_client.id}")
        except ClientNew.DoesNotExist:
            print(f"⚠️  Cliente nuovo non trovato per {old_client.user.email}")
    
    print(f"\n📊 Trovati {len(mapping)} mapping")
    
    # Aggiorna PartecipanteAppuntamento
    print("\n🔄 Aggiornamento PartecipanteAppuntamento...")
    
    with connection.cursor() as cursor:
        for old_id, new_id in mapping.items():
            try:
                # Aggiorna direttamente nel DB per bypassare la FK constraint temporanea
                cursor.execute(
                    "UPDATE partecipanti_appuntamento SET cliente_id = %s WHERE cliente_id = %s",
                    [new_id, old_id]
                )
                rows = cursor.rowcount
                if rows > 0:
                    print(f"✅ Aggiornati {rows} record per cliente {old_id} → {new_id}")
                    updated += rows
            except Exception as e:
                print(f"❌ Errore aggiornamento {old_id}: {e}")
                errors += 1
    
    print("\n" + "="*60)
    print(f"✅ Aggiornamento FK completato!")
    print(f"📊 Statistiche:")
    print(f"   - Record aggiornati: {updated}")
    print(f"   - Errori: {errors}")
    print("="*60)
    
    return updated, errors

if __name__ == '__main__':
    update_foreign_keys()

