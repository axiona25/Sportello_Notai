#!/usr/bin/env python
"""
Script per eliminare i documenti duplicati dalla cartella Altri Documenti
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from appointments.models import DocumentoAppuntamento

# Cerca documenti con nomi che contengono "Contratto Preliminare" o "Atto Principale"
docs_to_delete = DocumentoAppuntamento.objects.filter(
    document_type__name__icontains='Contratto Preliminare'
) | DocumentoAppuntamento.objects.filter(
    document_type__name__icontains='Atto Principale'
)

print(f"🗑️ Trovati {docs_to_delete.count()} documenti da eliminare:\n")

for doc in docs_to_delete:
    print(f"   • {doc.document_type.name}")
    print(f"     ID: {doc.id}")
    print(f"     File: {doc.file.name if doc.file else 'N/A'}")
    print(f"     Appuntamento: {doc.appuntamento.id}")
    
    # Elimina il documento
    doc.delete()
    print(f"     ❌ ELIMINATO\n")

print(f"✅ Pulizia completata! Eliminati {docs_to_delete.count()} documenti")

