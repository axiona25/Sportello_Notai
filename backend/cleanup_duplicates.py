#!/usr/bin/env python
"""
Script per eliminare documenti duplicati e mantenere solo l'ultimo aggiornato
Esegui con: python manage.py shell < cleanup_duplicates.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from appointments.models import DocumentoAppuntamento
from django.db.models import Count, Max

def cleanup_duplicate_documents():
    """Elimina documenti duplicati mantenendo solo l'ultimo aggiornato per ogni tipo"""
    
    print("🧹 Inizio pulizia documenti duplicati...\n")
    
    # Trova tutti gli appuntamenti con documenti
    appointments = DocumentoAppuntamento.objects.values('appuntamento', 'document_type').annotate(
        count=Count('id'),
        latest_update=Max('updated_at')
    ).filter(count__gt=1)
    
    total_deleted = 0
    
    for item in appointments:
        appuntamento_id = item['appuntamento']
        document_type_id = item['document_type']
        count = item['count']
        latest_update = item['latest_update']
        
        # Trova tutti i documenti di questo tipo per questo appuntamento
        docs = DocumentoAppuntamento.objects.filter(
            appuntamento_id=appuntamento_id,
            document_type_id=document_type_id
        ).order_by('-updated_at')
        
        # Mantieni solo il più recente
        latest_doc = docs.first()
        older_docs = docs[1:]
        
        if older_docs:
            doc_type_name = latest_doc.document_type.name
            print(f"📋 Appuntamento: {appuntamento_id}")
            print(f"   Tipo documento: {doc_type_name}")
            print(f"   Trovati {count} duplicati")
            print(f"   Mantengo: {latest_doc.id} (aggiornato: {latest_doc.updated_at})")
            
            for old_doc in older_docs:
                print(f"   ❌ Elimino: {old_doc.id} (aggiornato: {old_doc.updated_at})")
                old_doc.delete()
                total_deleted += 1
            
            print()
    
    print(f"✅ Pulizia completata!")
    print(f"📊 Documenti eliminati: {total_deleted}")
    
    if total_deleted == 0:
        print("ℹ️  Nessun duplicato trovato")

if __name__ == '__main__':
    cleanup_duplicate_documents()

