#!/usr/bin/env python
"""Script per creare un superuser admin."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User, UserRole

# Crea superuser
email = 'admin@sportellonotai.sm'
if not User.objects.filter(email=email).exists():
    user = User.objects.create_superuser(
        email=email,
        password='admin123',  # Cambia in produzione!
        role=UserRole.ADMIN
    )
    print(f"✅ Superuser creato: {email}")
    print(f"   Password: admin123")
    print(f"   ⚠️  CAMBIA LA PASSWORD IN PRODUZIONE!")
else:
    print(f"ℹ️  Superuser {email} già esistente")

