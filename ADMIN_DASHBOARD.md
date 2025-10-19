# 🎛️ DASHBOARD AMMINISTRATORE - Guida Completa

> **Sistema di gestione Notai, Partners e Licenze per Digital Notary**
> 
> Data creazione: 19 Ottobre 2025
> Versione: 1.0.0

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Architettura](#architettura)
3. [Backend API](#backend-api)
4. [Frontend Components](#frontend-components)
5. [Gestione Licenze](#gestione-licenze)
6. [Permissions & Security](#permissions--security)
7. [Guida Utilizzo](#guida-utilizzo)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🌟 Panoramica Sistema

La **Dashboard Amministratore** consente la gestione centralizzata di:

### ✅ **Funzionalità Principali**

#### 1. **Gestione Notai**
- ✏️ Creazione, modifica ed eliminazione (soft delete) notai
- 📊 Visualizzazione completa dati notai
- 🔍 Filtri avanzati per stato licenza
- 📈 Statistiche aggregate

#### 2. **Gestione Licenze**
- ⚙️ Attivazione/disattivazione licenze notai
- 📅 Gestione date inizio/scadenza
- 💶 Configurazione canoni (mensile/annuale)
- 📝 Note amministrative
- ⏰ Alert per licenze in scadenza (< 30 giorni)

#### 3. **Gestione Partners**
- 📋 Visualizzazione lista partners
- 🗑️ Eliminazione partners
- 🔍 Ricerca e filtri

#### 4. **Dashboard & Analytics**
- 📊 Statistiche in tempo reale
- 💰 Proiezioni revenue
- 📅 Gestione appuntamenti
- 🚨 Alert e notifiche

---

## 🏗️ Architettura

### **Stack Tecnologico**

#### Backend
- **Framework**: Django REST Framework
- **Database**: PostgreSQL + PostGIS
- **Authentication**: JWT (SimpleJWT)
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)

#### Frontend
- **Framework**: React 18
- **Routing**: Conditional rendering based on `currentView` state
- **Icons**: lucide-react
- **Styling**: CSS Modules + CSS Variables
- **HTTP Client**: apiClient (custom fetch wrapper)

---

## 🔌 Backend API

### **Nuovi Campi Modello `Notary`**

```python
# notaries/models.py

# Gestione Licenza (Admin)
license_active = BooleanField(default=True)
license_start_date = DateField(blank=True, null=True)
license_expiry_date = DateField(blank=True, null=True)
license_payment_amount = DecimalField(max_digits=10, decimal_places=2, default=0.0)
license_payment_frequency = CharField(
    max_length=20,
    choices=[('monthly', 'Mensile'), ('annual', 'Annuale')],
    default='annual'
)
license_notes = TextField(blank=True)
```

### **Metodi Helper**

```python
def is_license_valid(self):
    """Verifica se la licenza è valida."""
    if not self.license_active:
        return False
    if self.license_expiry_date:
        from django.utils import timezone
        today = timezone.now().date()
        return today <= self.license_expiry_date
    return True

def can_accept_new_appointments(self):
    """Il notaio può accettare nuovi appuntamenti solo se la licenza è valida."""
    return self.is_license_valid()
```

### **API Endpoints**

#### **1. Gestione Notai**

```
GET    /api/notaries/admin/notaries/          Lista notai (con filtri)
POST   /api/notaries/admin/notaries/          Crea notaio
GET    /api/notaries/admin/notaries/{id}/     Dettaglio notaio
PUT    /api/notaries/admin/notaries/{id}/     Aggiorna notaio (completo)
PATCH  /api/notaries/admin/notaries/{id}/     Aggiorna notaio (parziale)
DELETE /api/notaries/admin/notaries/{id}/     Disabilita notaio (soft delete)
```

**Parametri Query (GET):**
- `search` - Ricerca per nome, email, città
- `license_status` - Filtro: `active`, `expired`, `expiring_soon`, `disabled`
- `license_active` - Filtro: `true` / `false`
- `ordering` - Ordinamento: `studio_name`, `created_at`, `license_expiry_date`, ecc.

#### **2. Gestione Licenze**

```
PATCH  /api/notaries/admin/notaries/{id}/license/   Aggiorna solo dati licenza
```

**Body (PATCH):**
```json
{
  "license_active": true,
  "license_start_date": "2025-01-01",
  "license_expiry_date": "2025-12-31",
  "license_payment_amount": 990.00,
  "license_payment_frequency": "annual",
  "license_notes": "Rinnovo confermato via email"
}
```

#### **3. Statistiche**

```
GET    /api/notaries/admin/stats/              Statistiche dashboard
```

**Response:**
```json
{
  "notaries": {
    "total": 25,
    "active_licenses": 20,
    "expired_licenses": 2,
    "expiring_soon": 3,
    "disabled": 0
  },
  "appointments": {
    "total": 150,
    "pending": 12,
    "completed": 130
  },
  "revenue": {
    "monthly": 500.00,
    "annual": 19800.00,
    "projected_annual": 25800.00
  },
  "timestamp": "2025-10-19T10:30:00Z"
}
```

#### **4. Gestione Partners**

```
GET    /api/accounts/partners/                 Lista partners (già esistente)
POST   /api/accounts/partners/                 Crea partner
GET    /api/accounts/partners/{id}/            Dettaglio partner
PATCH  /api/accounts/partners/{id}/            Aggiorna partner
DELETE /api/accounts/partners/{id}/            Elimina partner
```

### **Permissions**

Tutti gli endpoint admin richiedono:
- **Autenticazione**: JWT Token valido
- **Ruolo**: `user.role === 'ADMIN'`

```python
class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN
```

---

## 🎨 Frontend Components

### **Struttura File**

```
frontend/src/
├── components/
│   ├── DashboardAdmin.jsx          # Dashboard principale admin
│   ├── DashboardAdmin.css
│   ├── NotariesManagement.jsx      # Gestione notai + modal licenza
│   ├── NotariesManagement.css
│   ├── PartnersManagement.jsx      # Gestione partners
│   └── Sidebar.jsx                 # Aggiornato con nav admin
└── services/
    └── adminService.js             # API calls per admin
```

### **1. DashboardAdmin.jsx**

**Props:**
- `onLogout` - Callback per logout

**State:**
- `currentView` - Vista corrente: `'dashboard'`, `'notaries'`, `'partners'`
- `searchValue` - Valore ricerca (condiviso con Header)
- `stats` - Statistiche dashboard
- `loading` - Stato caricamento

**Features:**
- 📊 Cards statistiche (Notai, Revenue, Appuntamenti, Partners)
- 🚨 Alert per licenze in scadenza/scadute
- 🔄 Navigazione tra sezioni
- 📈 Real-time stats update

### **2. NotariesManagement.jsx**

**Features:**
- 📋 Tabella notai con filtri
- 🔍 Ricerca per nome, email, città
- 🏷️ Badge status licenza (Attiva, In scadenza, Scaduta, Disattivata)
- ⚙️ Modal "Gestisci Licenza"
- 🗑️ Soft delete notai

**Filtri:**
- Tutti
- Licenze Attive
- In Scadenza (< 30 giorni)
- Scadute
- Disattivate

**Modal Licenza:**
- Toggle attivazione licenza
- Date inizio/scadenza
- Importo e frequenza pagamento
- Note amministrative

### **3. PartnersManagement.jsx**

**Features:**
- 📋 Tabella partners
- 🔍 Ricerca per ragione sociale, email, città
- 🏷️ Badge status (Attivo/Disattivo)
- 🗑️ Eliminazione partners

### **4. Sidebar.jsx (Aggiornato)**

**Nav Admin:**
```jsx
{userRole === 'admin' && (
  <>
    <NavItem icon={Users} label="Notai" active={currentView === 'notaries'} />
    <NavItem icon={Building2} label="Partners" active={currentView === 'partners'} />
  </>
)}
```

### **5. App.jsx (Aggiornato)**

```jsx
if (isAuthenticated) {
  return (
    <ProtectedRoute>
      {user?.role === 'admin' ? (
        <DashboardAdmin onLogout={handleLogout} />
      ) : user?.role === 'notaio' ? (
        <DashboardNotaio onLogout={handleLogout} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </ProtectedRoute>
  )
}
```

---

## 🔐 Gestione Licenze

### **Stati Licenza**

| Stato | Condizioni | Effetto |
|-------|-----------|---------|
| **active** | `license_active=True` + scadenza futura o non impostata | Notaio può accettare nuovi appuntamenti |
| **expiring_soon** | `license_active=True` + scadenza < 30 giorni | Alert in dashboard admin |
| **expired** | `license_active=True` + scadenza passata | **Notaio NON può accettare nuovi appuntamenti** |
| **disabled** | `license_active=False` | **Notaio disabilitato** (soft delete) |

### **Verifica Licenza**

#### **1. Booking Appuntamenti**

```python
# notaries/views.py - AppointmentCreateView

# Verifica licenza prima di creare appuntamento
try:
    notary = Notary.objects.get(id=notary_id)
    if not notary.is_license_valid():
        return Response({
            'error': 'This notary cannot accept new appointments',
            'reason': 'license_expired'
        }, status=403)
except Notary.DoesNotExist:
    return Response({'error': 'Notary not found'}, status=404)
```

#### **2. Slot Disponibili**

```python
# notaries/views.py - AvailableSlotsView

if not notary.is_license_valid():
    return Response({
        'error': 'This notary cannot accept new appointments',
        'reason': 'license_expired',
        'slots': []
    }, status=403)
```

#### **3. Vetrina Pubblica**

```python
# notaries/views.py - NotaryShowcaseListView

def get_queryset(self):
    """Return only notaries with valid licenses."""
    from django.utils import timezone
    today = timezone.now().date()
    
    return Notary.objects.filter(
        license_active=True
    ).filter(
        Q(license_expiry_date__isnull=True) | 
        Q(license_expiry_date__gte=today)
    )
```

---

## 🔒 Permissions & Security

### **Backend**

1. **Authentication**: JWT Token obbligatorio per tutti gli endpoint admin
2. **Role Check**: Solo `user.role == 'ADMIN'` può accedere
3. **Audit Log**: Tutte le operazioni admin sono loggate (se audit middleware abilitato)

### **Frontend**

1. **Protected Routes**: `ProtectedRoute` component verifica autenticazione
2. **Conditional Rendering**: Dashboard admin visibile solo se `user.role === 'admin'`
3. **API Calls**: `apiClient` include automaticamente JWT token nell'header

### **Best Practices**

- ✅ Sempre verificare il ruolo utente lato backend
- ✅ Non affidarsi solo al frontend per sicurezza
- ✅ Loggare tutte le modifiche critiche (licenze, soft delete)
- ✅ Implementare rate limiting per endpoint admin

---

## 📖 Guida Utilizzo

### **1. Accesso Dashboard Admin**

1. Login con credenziali admin:
   ```
   Email: admin@example.com
   Password: (password admin)
   ```

2. Dopo login, sei reindirizzato alla **Dashboard Admin**

### **2. Gestione Licenze Notai**

#### **Scenario 1: Attivare una nuova licenza**

1. Vai su **Notai** dalla sidebar
2. Cerca il notaio (o applica filtri)
3. Clicca sull'icona 🛡️ **"Gestisci Licenza"**
4. Compila:
   - ☑️ Licenza Attiva: `✓`
   - 📅 Data Inizio: `2025-10-19`
   - 📅 Data Scadenza: `2026-10-19`
   - 💶 Importo: `990.00`
   - 🔄 Frequenza: `Annuale`
   - 📝 Note: `Prima attivazione`
5. Clicca **"Salva Licenza"**

#### **Scenario 2: Rinnovo licenza in scadenza**

1. La dashboard mostra alert: *"3 licenze in scadenza"*
2. Clicca **"Visualizza Dettagli"**
3. Filtra per **"In Scadenza"**
4. Per ogni notaio:
   - Apri modal licenza
   - Aggiorna **Data Scadenza** con nuovo anno
   - Aggiungi nota: `Rinnovo 2026 confermato`
   - Salva

#### **Scenario 3: Disabilitare un notaio**

1. Trova il notaio nella lista
2. Clicca sull'icona 🗑️ **"Disabilita"**
3. Conferma azione
4. Il notaio viene soft-deleted:
   - `license_active` → `False`
   - Non appare più nelle vetrine pubbliche
   - Non può accettare nuovi appuntamenti
   - Dati storici conservati

### **3. Gestione Partners**

1. Vai su **Partners** dalla sidebar
2. Visualizza lista partners
3. Cerca per nome, email, città
4. Elimina partners non più attivi (🗑️)

### **4. Monitoraggio Revenue**

Dashboard Admin mostra:
- 💰 **Revenue Mensile**: somma canoni mensili attivi
- 💰 **Revenue Annuale**: somma canoni annuali attivi
- 📈 **Proiezione Annuale**: `(mensile × 12) + annuale`

---

## 🚀 Deployment

### **1. Migration Database**

```bash
cd backend
python manage.py makemigrations notaries
python manage.py migrate
```

**Migration creata:**
```
notaries/migrations/0005_notary_license_active_notary_license_expiry_date_and_more.py
```

### **2. Creazione Utente Admin**

```bash
python manage.py createsuperuser
```

O usa lo script esistente:
```bash
python create_admin.py
```

### **3. Test Backend**

```bash
# Avvia server
python manage.py runserver 8001

# Test endpoint stats
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:8001/api/notaries/admin/stats/
```

### **4. Build Frontend**

```bash
cd frontend
npm install
npm run dev  # Dev mode (porta 3001)
# oppure
npm run build  # Production build
```

### **5. Variabili Ambiente**

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgres://...
SECRET_KEY=...
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8001/api
```

---

## 🔧 Troubleshooting

### **Problema 1: Licenze non si aggiornano**

**Sintomo**: Dopo salvare licenza, la tabella non si aggiorna.

**Soluzione**:
1. Verifica che il backend restituisca dati aggiornati
2. Controlla console browser per errori API
3. Forza reload: `loadNotaries()` dopo salvataggio

### **Problema 2: Notaio con licenza scaduta appare in vetrina**

**Sintomo**: Notaio con `license_expiry_date` passata è visibile nella lista pubblica.

**Soluzione**:
1. Verifica che `NotaryShowcaseListView.get_queryset()` filtri correttamente
2. Controlla timezone del server vs database
3. Forza re-fetch con `Ctrl+Shift+R` nel browser

### **Problema 3: Admin non riesce ad accedere alla dashboard**

**Sintomo**: Login effettuato ma viene mostrata dashboard cliente.

**Soluzione**:
1. Verifica che `user.role` sia esattamente `'ADMIN'` (uppercase)
2. Controlla `App.jsx` conditional rendering
3. Verifica JWT payload include `role`

### **Problema 4: Modal licenza non si apre**

**Sintomo**: Click su 🛡️ non mostra il modal.

**Soluzione**:
1. Verifica stato `showLicenseModal` in React DevTools
2. Controlla console per errori JavaScript
3. Verifica CSS `z-index` del modal

---

## 📊 Statistiche & Metriche

### **KPI Dashboard**

- **Tasso Attivazione Licenze**: `(active_licenses / total_notaries) × 100`
- **Churn Rate**: Notai disabilitati negli ultimi 30 giorni
- **Revenue per Notaio**: `total_revenue / active_licenses`
- **Conversion Rate Appuntamenti**: `(completed / total) × 100`

---

## 🎯 Prossimi Sviluppi

1. ✨ **Export CSV** per lista notai e partners
2. 📧 **Email Automatiche** per rinnovi licenza
3. 📈 **Grafici** trend revenue e appuntamenti
4. 🔔 **Notifiche Push** per admin
5. 💳 **Integrazione Pagamenti** automatici
6. 📝 **Audit Log UI** per tracciare modifiche
7. 🔍 **Ricerca Avanzata** con filtri multipli
8. 📱 **Mobile-friendly** admin dashboard

---

## 📞 Supporto

Per problemi o domande:
- **Email**: admin@digitalnotary.sm
- **Issue Tracker**: GitHub Issues

---

**Creato con ❤️ per Digital Notary**  
*Dashboard Admin v1.0.0 - Ottobre 2025*

