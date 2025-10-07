# Backend (Django)

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv cryptography pyjwt argon2-cffi
django-admin startproject core .
python manage.py startapp accounts
python manage.py startapp notaries
python manage.py startapp acts
python manage.py startapp documents
python manage.py startapp pec
python manage.py startapp rtc
```

## Sicurezza
- Password: Argon2
- JWT per sessioni API
- E2E per documenti (chiavi lato client; lato server solo ciphertext)
