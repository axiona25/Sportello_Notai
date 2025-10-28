#!/usr/bin/env python
"""
Script per vedere tutti i documenti di un appuntamento
Esegui con: python list_documents.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from appointments.models import DocumentoAppuntamento, Appuntamento

def list_all_documents():
    """Lista tutti i documenti per ogni appuntamento"""
    
    print("📋 Elenco documenti per appuntamento:\n")
    
    appointments = Appuntamento.objects.all()
    
    for appointment in appointments:
        docs = DocumentoAppuntamento.objects.filter(appuntamento=appointment).order_by('document_type__name', '-updated_at')
        
        if docs.exists():
            print(f"📅 Appuntamento: {appointment.id}")
            print(f"   Tipologia: {appointment.tipologia_atto.name if appointment.tipologia_atto else 'N/A'}")
            print(f"   Documenti ({docs.count()}):")
            
            for doc in docs:
                print(f"      • {doc.document_type.name}")
                print(f"        ID: {doc.id}")
                print(f"        File: {doc.file.name if doc.file else 'N/A'}")
                print(f"        Aggiornato: {doc.updated_at}")
            print()

if __name__ == '__main__':
    list_all_documents()

