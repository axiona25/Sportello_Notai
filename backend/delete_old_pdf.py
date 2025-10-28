#!/usr/bin/env python
"""
Script per eliminare il vecchio "Atto Principale (PDF)"
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from appointments.models import DocumentoAppuntamento
from acts.models import DocumentType

# Elimina documenti con il vecchio tipo "Atto Principale (PDF)"
old_doc_type = DocumentType.objects.filter(code='ATTO_PDF').first()
if old_doc_type:
    old_docs = DocumentoAppuntamento.objects.filter(document_type=old_doc_type)
    count = old_docs.count()
    print(f"🗑️  Elimino {count} documenti vecchi 'Atto Principale (PDF)'")
    
    for doc in old_docs:
        print(f"   ❌ Elimino: {doc.id} - {doc.file.name if doc.file else 'N/A'}")
        doc.delete()
    
    # Elimina anche il DocumentType vecchio
    print(f"🗑️  Elimino DocumentType vecchio: {old_doc_type.name}")
    old_doc_type.delete()
    
    print("✅ Pulizia completata!")
else:
    print("ℹ️  Nessun documento vecchio trovato")

