#!/usr/bin/env python
"""
Script per aggiornare il prefisso protocolli da TEST a TST
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from acts.models_protocollo import ProtocolloAttoNotarile
from acts.models_templates import ActTemplate

def update_protocol_prefix():
    """Aggiorna i protocolli testamento da TEST a TST"""
    
    # Aggiorna i template
    templates = ActTemplate.objects.filter(act_type_code__iexact='testamento', code_prefix='TEST')
    print(f"\n🔍 Template trovati con prefisso TEST: {templates.count()}")
    
    for template in templates:
        old_prefix = template.code_prefix
        template.code_prefix = 'TST'
        template.save(update_fields=['code_prefix', 'updated_at'])
        print(f"✅ Template {template.act_type_name}: {old_prefix} → TST")
    
    # Aggiorna i protocolli esistenti
    protocolli = ProtocolloAttoNotarile.objects.filter(code_prefix='TEST')
    print(f"\n🔍 Protocolli trovati con prefisso TEST: {protocolli.count()}")
    
    for protocollo in protocolli:
        old_number = protocollo.numero_protocollo
        # Sostituisci TEST con TST nel numero protocollo
        new_number = old_number.replace('TEST-', 'TST-')
        protocollo.numero_protocollo = new_number
        protocollo.code_prefix = 'TST'
        protocollo.save(update_fields=['numero_protocollo', 'code_prefix', 'updated_at'])
        print(f"✅ Protocollo: {old_number} → {new_number}")
    
    print(f"\n✅ Aggiornamento completato!")
    print(f"   - {templates.count()} template aggiornati")
    print(f"   - {protocolli.count()} protocolli aggiornati")

if __name__ == '__main__':
    print("=" * 60)
    print("🔄 Aggiornamento Prefisso Protocolli: TEST → TST")
    print("=" * 60)
    
    update_protocol_prefix()

