# 🔐 Implementazione JWT Authentication

## 📋 Panoramica

Sistema di autenticazione JWT (JSON Web Token) completo per Sportello Notai, con:
- Token valido fino al logout (invalidazione via blacklist)
- Refresh token automatico per sessioni lunghe
- Protezione route basata su ruoli
- Gestione automatica token scaduti

---

## 🏗️ Architettura

### Backend (Django + SimpleJWT)

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         │ 1. POST /api/auth/login/
         │    { email, password }
         ↓
┌─────────────────┐
│   LoginView     │──→ Verifica credenziali
└────────┬────────┘
         │
         │ 2. Genera JWT tokens
         ↓
┌─────────────────┐
│  RefreshToken   │──→ Access Token (24h)
│   for_user()    │──→ Refresh Token (30d)
└────────┬────────┘
         │
         │ 3. Return tokens + user data
         ↓
┌─────────────────┐
│   Frontend      │──→ Salva in localStorage
│  localStorage   │    - access_token
└─────────────────┘    - refresh_token
                        - user (role, email, etc.)
```

### Flow Logout

```
Frontend                Backend
   │                       │
   │  POST /api/auth/logout/
   │  Bearer {access_token}
   │  { refresh_token }    │
   │──────────────────────>│
   │                       │
   │                   Blacklist
   │                   refresh_token
   │                       │
   │<──────────────────────│
   │   { success }         │
   │                       │
Clear localStorage        │
```

---

## 🔧 Configurazione Backend

### 1. Settings JWT (`core/settings.py`)

```python
SIMPLE_JWT = {
    # Token valido 24 ore (ma logout lo invalida prima)
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    
    # Blacklist token al logout
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'ISSUER': 'sportello-notai',
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
}
```

### 2. REST Framework Authentication

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 3. Endpoint API

| Endpoint | Metodo | Autenticazione | Descrizione |
|----------|--------|----------------|-------------|
| `/api/auth/login/` | POST | No | Login e generazione token |
| `/api/auth/logout/` | POST | Sì | Logout e blacklist token |
| `/api/auth/refresh/` | POST | No | Refresh access token |
| `/api/auth/profile/` | GET | Sì | Profilo utente corrente |

---

## 💻 Implementazione Frontend

### 1. AuthService (`services/authService.js`)

Servizio centralizzato per gestire autenticazione:

```javascript
import authService from './services/authService'

// Login
const data = await authService.login(email, password)
// Salva automaticamente tokens in localStorage

// Logout
await authService.logout()
// Invalida token backend e pulisce localStorage

// Verifica autenticazione
const isAuth = authService.isAuthenticated()

// Ottieni token
const token = authService.getAccessToken()
```

### 2. useAuth Hook (`hooks/useAuth.js`)

Hook React per gestire stato autenticazione:

```javascript
import { useAuth } from './hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth()
  
  // Login
  const handleLogin = async () => {
    await login(email, password)
  }
  
  // Verifica ruolo
  if (hasRole('notaio')) {
    // Mostra funzionalità notaio
  }
}
```

### 3. ProtectedRoute (`components/ProtectedRoute.jsx`)

Componente per proteggere route:

```javascript
import ProtectedRoute from './components/ProtectedRoute'

<ProtectedRoute allowedRoles={['notaio']}>
  <DashboardNotaio />
</ProtectedRoute>
```

### 4. API Client (`services/apiClient.js`)

Client con gestione automatica token e refresh:

```javascript
import apiClient from './services/apiClient'

// GET con auth automatica
const data = await apiClient.get('/notaries/')

// POST con auth automatica
const result = await apiClient.post('/acts/', actData)

// Upload file
const uploaded = await apiClient.upload('/documents/', formData)
```

**Features:**
- Aggiunge automaticamente header `Authorization: Bearer {token}`
- Se riceve 401, prova automatic refresh token
- Se refresh fallisce, redirect a login
- Gestisce code race per multiple request simultanee

---

## 🔒 Sicurezza

### Token Storage
- **Access Token**: localStorage (24h expiry)
- **Refresh Token**: localStorage (30d expiry)
- **User Data**: localStorage (role, email, name)

### Token Invalidation
- **Logout**: Token aggiunto a blacklist nel database
- **Expired**: Token scaduto automaticamente dopo 24h
- **Refresh Failed**: Tutti i token puliti, redirect a login

### Protezione Routes
- Tutte le route protette da `ProtectedRoute`
- Verifica `isAuthenticated` e ruolo utente
- Redirect automatico a login se non autenticato

### CORS
Backend configurato per accettare richieste solo da:
- `http://localhost:3001` (development)
- Domini production configurati

---

## 📊 Database

### Token Blacklist Table

La migrazione di SimpleJWT crea automaticamente:

```sql
CREATE TABLE token_blacklist_outstandingtoken (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    jti VARCHAR(255) UNIQUE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE token_blacklist_blacklistedtoken (
    id BIGSERIAL PRIMARY KEY,
    token_id BIGINT UNIQUE NOT NULL,
    blacklisted_at TIMESTAMP NOT NULL
);
```

---

## 🧪 Testing

### 1. Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "role": "notaio",
    "first_name": "Francesco",
    "last_name": "Spada"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Test API con Token

```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 3. Test Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "{refresh_token}"}'
```

### 4. Test Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "{refresh_token}"}'
```

---

## 🚀 Flow Completo

### 1️⃣ Utente Non Autenticato

```
User → Open App → No token → Redirect to /login
```

### 2️⃣ Login

```
User → Enter credentials → POST /api/auth/login/
     → Backend verifica credenziali
     → Backend genera JWT tokens
     → Frontend salva tokens + user data
     → Redirect to dashboard (basato su role)
```

### 3️⃣ Navigazione Autenticata

```
User → Navigate to /dashboard
     → ProtectedRoute verifica isAuthenticated
     → Mostra dashboard appropriata per ruolo
```

### 4️⃣ API Request

```
Component → apiClient.get('/notaries/')
          → Aggiunge header Authorization: Bearer {token}
          → Backend verifica token JWT
          → Se valido: return data
          → Se 401: automatic refresh token
          → Se refresh ok: retry request
          → Se refresh fail: redirect to /login
```

### 5️⃣ Logout

```
User → Click logout button
     → POST /api/auth/logout/ con refresh_token
     → Backend blacklist token
     → Frontend clear localStorage
     → Redirect to /login
```

### 6️⃣ Token Scaduto (dopo 24h)

```
API Request → Token expired (401)
            → apiClient automatic refresh
            → Se refresh ok: nuovo access token
            → Retry request originale
            → Se refresh fail: redirect /login
```

---

## 🎯 Ruoli e Permessi

### Ruoli Disponibili

| Ruolo | Descrizione | Dashboard | Permessi |
|-------|-------------|-----------|----------|
| `cliente` | Cliente finale | Dashboard Cliente | Visualizza notai, prenota appuntamenti |
| `notaio` | Notaio professionista | Dashboard Notaio | Gestisce appuntamenti, documenti, firma |
| `partner` | Partner esterno | Dashboard Partner | Accesso limitato |
| `admin` | Amministratore | Dashboard Admin | Accesso completo |

### Verifica Ruoli nel Codice

```javascript
// Nel componente
const { hasRole, hasAnyRole } = useAuth()

if (hasRole('notaio')) {
  // Funzionalità solo per notai
}

if (hasAnyRole(['admin', 'notaio'])) {
  // Funzionalità per admin e notai
}

// In ProtectedRoute
<ProtectedRoute allowedRoles={['notaio', 'admin']}>
  <SettingsPage />
</ProtectedRoute>
```

---

## ⚙️ Variabili Ambiente

### Backend (`.env`)

```env
# JWT Settings
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Django Secret
SECRET_KEY=your-django-secret-key
```

### Frontend (`.env`)

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:8000/api

# Environment
VITE_ENV=development
```

---

## 🐛 Troubleshooting

### Token non accettato (401)

**Problema**: API ritorna sempre 401 anche con token valido

**Soluzione**:
1. Verifica header: `Authorization: Bearer {token}` (con spazio)
2. Controlla che token non sia scaduto
3. Verifica CORS settings backend
4. Controlla che `rest_framework_simplejwt.token_blacklist` sia in INSTALLED_APPS

### Token non invalidato al logout

**Problema**: Dopo logout, token continua a funzionare

**Soluzione**:
1. Verifica che `BLACKLIST_AFTER_ROTATION = True` in settings
2. Esegui migration: `python manage.py migrate token_blacklist`
3. Verifica che logout view chiami `token.blacklist()`

### Refresh token fallisce

**Problema**: Refresh token ritorna errore

**Soluzione**:
1. Verifica che refresh token non sia scaduto (30 giorni)
2. Controlla che non sia stato già usato (se ROTATE_REFRESH_TOKENS=True)
3. Verifica endpoint: `/api/auth/refresh/` con body `{"refresh": "token"}`

### localStorage pieno

**Problema**: Troppi dati in localStorage

**Soluzione**:
- Salva solo dati essenziali utente
- Non salvare interi oggetti complessi
- Implementa pulizia periodica dati vecchi

---

## 📚 Best Practices

### ✅ DO

- Usa sempre HTTPS in production
- Imposta token expiry ragionevoli (24h access, 30d refresh)
- Invalida token al logout via blacklist
- Usa refresh token per sessioni lunghe
- Salva solo dati essenziali in localStorage
- Implementa automatic token refresh in API client
- Proteggi tutte le route sensibili con ProtectedRoute
- Verifica ruoli utente per funzionalità specifiche

### ❌ DON'T

- Non salvare token in cookie (CSRF risk)
- Non usare token expiry infiniti
- Non dimenticare di invalidare token al logout
- Non inviare token in URL query params
- Non loggare token in console (production)
- Non salvare dati sensibili in localStorage
- Non ignorare errori 401 (refresh automatico)

---

## 🔄 Migrazioni Database

Esegui migrazioni per tabelle blacklist:

```bash
cd backend
python manage.py migrate token_blacklist
```

Verifica tabelle create:

```sql
\dt token_blacklist*
```

---

## 📈 Monitoring

### Metriche da Monitorare

- Numero login giornalieri
- Numero logout giornalieri
- Numero refresh token richiesti
- Numero token scaduti/invalidati
- Numero tentativi login falliti
- Durata media sessione utente

### Log Audit

Tutti gli eventi di autenticazione sono loggati in `audit.AuditLog`:

```python
AuditLog.log(
    action=AuditAction.LOGIN,
    user=user,
    description=f"User logged in: {user.email}",
    request=request
)
```

---

## ✅ Checklist Implementazione

- [x] JWT configurato in backend settings
- [x] Token blacklist abilitato
- [x] Endpoints login/logout/refresh creati
- [x] AuthService frontend implementato
- [x] useAuth hook implementato
- [x] ProtectedRoute implementato
- [x] API Client con auto-refresh implementato
- [x] App.jsx integrato con AuthProvider
- [x] Variabili ambiente configurate
- [x] Documentazione completa
- [ ] Migrazioni database eseguite
- [ ] Testing login/logout
- [ ] Testing refresh token
- [ ] Testing protezione route
- [ ] Deploy production

---

## 🚀 Prossimi Passi

1. **Testing Completo**
   - Test login con credenziali reali
   - Test logout e invalidazione token
   - Test refresh automatico
   - Test protezione route per ogni ruolo

2. **Migrazioni Database**
   - Esegui `python manage.py migrate`
   - Verifica tabelle blacklist create

3. **Environment Variables**
   - Imposta JWT_SECRET_KEY sicura in production
   - Configura VITE_API_BASE_URL per production

4. **Security Hardening**
   - Abilita HTTPS in production
   - Configura CORS restrittivo
   - Implementa rate limiting su login
   - Aggiungi 2FA opzionale (MFA già implementato)

5. **Monitoring**
   - Setup Sentry per error tracking
   - Monitora login attempts
   - Track token refresh rate

---

**Documentazione aggiornata:** 2025-10-18
**Versione:** 1.0.0

