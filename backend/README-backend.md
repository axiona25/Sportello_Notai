# Sportello Notai - Backend Django

Backend completo per la piattaforma Sportello Notai con API REST, autenticazione avanzata, e integrazione con servizi esterni.

## 🏗️ Architettura

### Stack Tecnologico
- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL con PostGIS (supporto geospaziale)
- **Autenticazione**: JWT con SimpleJWT + MFA/OTP
- **Password Hashing**: Argon2
- **Cache**: Redis
- **Task Queue**: Celery
- **Storage**: AWS S3 (documenti cifrati)
- **API Docs**: DRF Spectacular (OpenAPI/Swagger)

### Moduli Principali

1. **Accounts** - Gestione utenti e autenticazione
   - Registrazione, Login, MFA
   - RBAC (Notaio, Collaboratore, Cliente, Partner, Admin)
   - Session management con JWT

2. **Notaries** - Profili notai
   - Vetrina notai con servizi e tariffe
   - Geolocalizzazione (PostGIS)
   - Disponibilità e orari di lavoro

3. **Acts** - Atti notarili
   - CRUD atti con categorizzazione
   - Workflow completo (bozza → firmato → archiviato)
   - Survey obbligatoria post-chiusura

4. **Documents** - Gestione documenti
   - **Cifratura E2E** (AES-256-GCM)
   - Key wrapping con RSA-4096
   - Versioning documenti
   - Permessi granulari

5. **Appointments** - Appuntamenti
   - Prenotazione e conferma
   - Reminder automatici

6. **Reviews** - Recensioni
   - Rating 1-5 stelle
   - Moderazione

7. **PEC** - Posta Elettronica Certificata
   - Template messaggi
   - Tracking invio e consegna
   - Integrazione provider PEC

8. **RTC** - Real-Time Communication
   - Sessioni audio/video
   - Co-authoring documenti
   - WebRTC integration

9. **Signatures** - Firma Digitale
   - Integrazione provider eIDAS
   - PAdES/XAdES/CAdES
   - Marca temporale (RFC 3161)
   - Timbro digitale

10. **Conservation** - Conservazione Sostitutiva
    - Pacchetti conservazione AgID compliant
    - Export verso conservatore accreditato

11. **Audit** - Audit & Security
    - Log completo di tutte le azioni
    - Security events
    - Compliance tracking

## 🔐 Sicurezza

### Cifratura End-to-End
- **Algoritmo**: AES-256-GCM
- **Key Management**: AWS KMS
- **Key Wrapping**: RSA-OAEP (4096-bit)
- **Hash**: SHA-256 per ciphertext

### Autenticazione
- **Password**: Argon2 (min 12 caratteri)
- **JWT**: Access token (30 min) + Refresh token (7 giorni)
- **MFA**: TOTP con pyotp
- **Rate Limiting**: Max 5 tentativi login falliti

### Headers di Sicurezza
- HSTS, CSP, X-Frame-Options
- Secure cookies (HttpOnly, SameSite)
- CSRF protection

## 📦 Setup

### 1. Prerequisiti
```bash
# PostgreSQL con PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Redis
sudo apt-get install redis-server

# Python 3.11+
python --version
```

### 2. Installazione
```bash
# Virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# Dipendenze
pip install -r requirements.txt
```

### 3. Configurazione
```bash
# Copia env.example in .env
cp env.example .env

# Modifica .env con le tue credenziali
nano .env
```

### 4. Database
```bash
# Crea database
createdb sportello_notai

# Oppure con psql
psql -U postgres
CREATE DATABASE sportello_notai;
\q

# Applica migrations
python manage.py makemigrations
python manage.py migrate

# Crea superuser
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
# Django dev server (porta 8001)
python manage.py runserver 0.0.0.0:8001

# Celery worker (in un altro terminale)
celery -A core worker -l info

# Celery beat (scheduler)
celery -A core beat -l info
```

## 📡 API Endpoints

### Autenticazione
```
POST   /api/auth/register/          # Registrazione
POST   /api/auth/login/             # Login
POST   /api/auth/logout/            # Logout
POST   /api/auth/refresh/           # Refresh token
POST   /api/auth/mfa/setup/         # Setup MFA
POST   /api/auth/mfa/enable/        # Abilita MFA
POST   /api/auth/mfa/verify/        # Verifica MFA
GET    /api/auth/profile/           # Profilo utente
POST   /api/auth/change-password/   # Cambia password
```

### Notai
```
GET    /api/notaries/                    # Lista notai (con filtri)
GET    /api/notaries/{id}/               # Dettaglio notaio
GET    /api/notaries/me/                 # Profilo notaio corrente
PUT    /api/notaries/me/                 # Aggiorna profilo
POST   /api/notaries/{id}/services/      # Gestione servizi
GET    /api/notaries/{id}/availability/  # Disponibilità
```

### Atti
```
GET    /api/acts/              # Lista atti
POST   /api/acts/              # Crea atto
GET    /api/acts/{id}/         # Dettaglio atto
PUT    /api/acts/{id}/         # Aggiorna atto
DELETE /api/acts/{id}/         # Elimina atto
POST   /api/acts/{id}/close/   # Chiudi atto (con survey)
```

### Documenti
```
GET    /api/documents/acts/{act_id}/documents/     # Lista documenti atto
POST   /api/documents/upload/                      # Upload documento cifrato
GET    /api/documents/{id}/                        # Download documento
DELETE /api/documents/{id}/                        # Elimina documento
GET    /api/documents/{id}/permissions/            # Permessi documento
POST   /api/documents/{id}/permissions/            # Gestione permessi
```

### Appuntamenti
```
GET    /api/appointments/          # Lista appuntamenti
POST   /api/appointments/          # Crea appuntamento
GET    /api/appointments/{id}/     # Dettaglio
PUT    /api/appointments/{id}/     # Aggiorna
```

### Reviews
```
GET    /api/reviews/               # Lista recensioni
POST   /api/reviews/               # Crea recensione
GET    /api/reviews/{id}/          # Dettaglio
```

### PEC
```
GET    /api/pec/templates/         # Template PEC
POST   /api/pec/templates/         # Crea template
GET    /api/pec/messages/          # Messaggi PEC
POST   /api/pec/messages/          # Invia PEC
GET    /api/pec/messages/{id}/     # Dettaglio messaggio
```

### RTC
```
GET    /api/rtc/sessions/          # Sessioni RTC
POST   /api/rtc/sessions/          # Crea sessione
GET    /api/rtc/sessions/{id}/     # Dettaglio sessione
```

### Firma Digitale
```
POST   /api/signatures/requests/   # Richiesta firma
GET    /api/signatures/requests/   # Lista richieste firma
POST   /api/signatures/timestamps/ # Richiesta marca temporale
```

### Conservazione
```
GET    /api/conservation/packages/ # Pacchetti conservazione
POST   /api/conservation/packages/ # Crea pacchetto
```

### Audit
```
GET    /api/audit/logs/            # Log audit (personali)
GET    /api/audit/security/        # Security events (admin)
```

## 📚 API Documentation

### Swagger UI
```
http://localhost:8001/api/docs/
```

### ReDoc
```
http://localhost:8001/api/redoc/
```

### OpenAPI Schema
```
http://localhost:8001/api/schema/
```

## 🔧 Configurazione Avanzata

### Storage S3
```python
# settings.py
USE_S3 = True
AWS_STORAGE_BUCKET_NAME = 'sportello-notai-docs'
AWS_S3_REGION_NAME = 'eu-west-1'
```

### Celery Tasks
```python
# Esempio task asincrono
from celery import shared_task

@shared_task
def send_pec_async(message_id):
    # Invio PEC asincrono
    pass
```

### Rate Limiting
```python
# settings.py
API_RATE_LIMIT_AUTH = '10/min'
API_RATE_LIMIT_DEFAULT = '60/min'
```

## 🧪 Testing
```bash
# Run all tests
pytest

# Run specific app tests
pytest accounts/tests/

# With coverage
pytest --cov=.
```

## 🚀 Deployment

### Production Checklist
- [ ] `DEBUG = False`
- [ ] Configurare `ALLOWED_HOSTS`
- [ ] Setup HTTPS (SSL/TLS)
- [ ] Configurare variabili d'ambiente sicure
- [ ] Setup Redis production
- [ ] Setup PostgreSQL production
- [ ] Configurare Celery con supervisor
- [ ] Setup monitoring (Sentry)
- [ ] Backup automatici database
- [ ] Setup CDN per media files

### Docker (opzionale)
```bash
docker-compose up -d
```

## 📝 Note Sviluppo

### Database Schema
Vedi `database_schema.sql` per lo schema completo PostgreSQL.

### Servizi Esterni
- **KMS**: AWS KMS per key management
- **Firma Digitale**: Infocert/Aruba/Namirial
- **PEC**: Provider PEC certificato
- **Conservazione**: Conservatore accreditato AgID
- **RTC**: LiveKit/Janus/Mediasoup

## 🤝 Contributing

Vedi `CONTRIBUTING.md` nel repository principale.

## 📄 License

Proprietario - Sportello Notai 2025

---

**Ultimo aggiornamento**: 2025-10-07
**Versione Backend**: 1.0.0
