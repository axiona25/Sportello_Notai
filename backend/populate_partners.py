#!/usr/bin/env python
"""Script per popolare il database con partner di esempio."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User, Partner, UserRole, TipologiaPartner

def create_sample_partners():
    """Crea partner di esempio per testing."""
    
    partners_data = [
        {
            'email': 'partner1@example.com',
            'password': 'Partner123!@#',
            'ragione_sociale': 'Studio Commercialista Rossi',
            'tipologia': TipologiaPartner.COMMERCIALISTA,
            'partita_iva': '12345678901',
            'codice_fiscale': 'RSSMRA80A01F205K',
            'nome_referente': 'Mario',
            'cognome_referente': 'Rossi',
            'citta': 'Città di San Marino',
            'provincia': 'SM',
            'mail': 'mario.rossi@studiorossi.sm',
            'cellulare': '+378 0549 123456',
            'is_active': True,
        },
        {
            'email': 'partner2@example.com',
            'password': 'Partner123!@#',
            'ragione_sociale': 'Agenzia Immobiliare Verdi',
            'tipologia': TipologiaPartner.AGENZIA_IMMOBILIARE,
            'partita_iva': '23456789012',
            'codice_fiscale': 'VRDLGI75B15F205X',
            'nome_referente': 'Luigi',
            'cognome_referente': 'Verdi',
            'citta': 'Serravalle',
            'provincia': 'SM',
            'mail': 'luigi.verdi@agenziaverdi.sm',
            'cellulare': '+378 0549 234567',
            'is_active': True,
        },
        {
            'email': 'partner3@example.com',
            'password': 'Partner123!@#',
            'ragione_sociale': 'Studio Geometra Bianchi',
            'tipologia': TipologiaPartner.GEOMETRA,
            'partita_iva': '34567890123',
            'codice_fiscale': '34567890123',
            'nome_referente': 'Anna',
            'cognome_referente': 'Bianchi',
            'citta': 'Borgo Maggiore',
            'provincia': 'SM',
            'mail': 'anna.bianchi@studiobianchi.sm',
            'cellulare': '+378 0549 345678',
            'is_active': True,
        },
        {
            'email': 'partner4@example.com',
            'password': 'Partner123!@#',
            'ragione_sociale': 'Studio Architetto Neri',
            'tipologia': TipologiaPartner.ARCHITETTO,
            'partita_iva': '45678901234',
            'codice_fiscale': '45678901234',
            'nome_referente': 'Carlo',
            'cognome_referente': 'Neri',
            'citta': 'Domagnano',
            'provincia': 'SM',
            'mail': 'carlo.neri@studioneri.sm',
            'cellulare': '+378 0549 456789',
            'is_active': False,  # Partner disattivato
        },
    ]
    
    created_count = 0
    
    for partner_data in partners_data:
        email = partner_data.pop('email')
        password = partner_data.pop('password')
        
        # Controlla se esiste già un partner con questa email
        existing_user = User.objects.filter(email=email).first()
        if existing_user and hasattr(existing_user, 'partner_profile'):
            print(f"⏭️  Partner {email} già esistente, skip...")
            continue
        
        # Se l'utente esiste ma non ha profilo partner, eliminalo
        if existing_user:
            print(f"🗑️  Rimuovo utente {email} senza profilo partner...")
            existing_user.delete()
        
        try:
            # Crea utente
            user = User.objects.create_user(
                email=email,
                password=password,
                role=UserRole.PARTNER
            )
            
            # Crea profilo partner
            partner = Partner.objects.create(
                user=user,
                **partner_data
            )
            
            print(f"✅ Partner creato: {partner.ragione_sociale} ({email})")
            created_count += 1
            
        except Exception as e:
            print(f"❌ Errore nella creazione del partner {email}: {e}")
    
    print(f"\n{'='*50}")
    print(f"✅ {created_count} partner creati con successo!")
    print(f"📊 Totale partner nel database: {Partner.objects.count()}")
    print(f"{'='*50}")

if __name__ == '__main__':
    create_sample_partners()

