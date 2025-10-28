#!/usr/bin/env python
"""
Script per verificare lo stato del template
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from acts.models_templates import ActTemplate

# Lista tutti i template
templates = ActTemplate.objects.all()

print("📋 Template esistenti:\n")
for template in templates:
    print(f"   ID: {template.id}")
    print(f"   Act Type: {template.act_type_name}")
    print(f"   File: {template.template_file.name if template.template_file else 'N/A'}")
    print(f"   File path: {template.template_file.path if template.template_file else 'N/A'}")
    print(f"   Original filename: {template.original_filename}")
    print(f"   Aggiornato: {template.updated_at}")
    print()

