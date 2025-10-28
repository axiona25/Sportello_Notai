#!/usr/bin/env python
"""
Script per assicurarsi che il Template Word sia categorizzato come documento del notaio
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from acts.models import DocumentType

# Trova tutti i DocumentType che dovrebbero essere "del notaio"
notaio_docs = ['TEMPLATE_WORD', 'TEMPLATE_ATTO']

print("🔧 Aggiornamento DocumentType per documenti notaio:\n")

for code in notaio_docs:
    doc_type = DocumentType.objects.filter(code=code).first()
    if doc_type:
        print(f"📋 {doc_type.name}")
        print(f"   Code: {code}")
        print(f"   Required from: {doc_type.required_from}")
        
        if doc_type.required_from != 'notaio':
            doc_type.required_from = 'notaio'
            doc_type.category = 'altro'
            doc_type.save()
            print(f"   ✅ Aggiornato required_from='notaio'\n")
        else:
            print(f"   ✅ Già corretto\n")
    else:
        print(f"⚠️  DocumentType {code} non trovato\n")

print("✅ Aggiornamento completato!")

