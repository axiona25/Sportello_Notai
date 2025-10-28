#!/usr/bin/env python
"""
Script per verificare l'appuntamento del 23/10 e il conteggio dei documenti
"""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from appointments.models import Appuntamento, DocumentoAppuntamento
from acts.models import DocumentType

# Cerca appuntamenti del 23/10/2024 o 23/10/2025
print("🔍 Ricerca appuntamenti del 23 ottobre:\n")

appuntamenti = Appuntamento.objects.filter(
    start_time__month=10,
    start_time__day=23
).order_by('-start_time')

for app in appuntamenti:
    print(f"📅 Appuntamento: {app.titolo}")
    print(f"   ID: {app.id}")
    print(f"   Data: {app.start_time}")
    print(f"   Status: {app.status}")
    print(f"   Tipologia: {app.tipologia_atto.name if app.tipologia_atto else 'N/A'}")
    
    # Documenti
    docs = DocumentoAppuntamento.objects.filter(appuntamento=app).select_related('document_type')
    
    print(f"\n   📄 Documenti ({docs.count()} totali):")
    
    # Conta per categoria
    cliente_docs = []
    notaio_docs = []
    
    for doc in docs:
        has_file = bool(doc.file)
        required_from = doc.document_type.required_from if doc.document_type else 'N/A'
        
        print(f"      - {doc.document_type.name if doc.document_type else 'N/A'}")
        print(f"        Required from: {required_from}")
        print(f"        Ha file: {'✅' if has_file else '❌'}")
        print(f"        File: {doc.file.name if has_file else 'N/A'}")
        
        if required_from == 'notaio':
            notaio_docs.append(doc)
        else:
            cliente_docs.append(doc)
    
    print(f"\n   📊 Riepilogo:")
    print(f"      • Documenti Cliente (da contare): {len(cliente_docs)}")
    print(f"      • Documenti Studio (NON contare): {len(notaio_docs)}")
    print(f"      • TOTALE per accesso: {len(cliente_docs)}/{len(cliente_docs)}")
    print("\n" + "="*80 + "\n")

if not appuntamenti.exists():
    print("❌ Nessun appuntamento trovato per il 23 ottobre")

