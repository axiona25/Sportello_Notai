# 📅 Sistema di Prenotazione Appuntamenti

## ✅ Implementazione Completata

Sistema completo di prenotazione appuntamenti tra clienti e notai con gestione in tempo reale e protezione concorrente.

---

## 🎯 Funzionalità Implementate

### 📦 Backend (Django REST Framework)

#### 1. **Modello Appointment** (`backend/notaries/models.py`)
- **Stati**: `pending`, `accepted`, `rejected`, `cancelled`, `completed`
- **Tipi**: `rogito`, `consulenza`, `revisione`, `altro`
- **Campi principali**:
  - Notaio (ForeignKey)
  - Cliente (ForeignKey)
  - Data e orari (date, start_time, end_time)
  - Durata (duration_minutes)
  - Note e motivi di rifiuto

#### 2. **API Endpoints** (`backend/notaries/views.py` e `urls.py`)

| Endpoint | Metodo | Descrizione | Permessi |
|----------|--------|-------------|----------|
| `/notaries/<uuid>/slots/` | GET | Calcola slot disponibili | AllowAny |
| `/notaries/appointments/` | GET | Lista appuntamenti | Authenticated |
| `/notaries/appointments/create/` | POST | Prenota appuntamento | Cliente |
| `/notaries/appointments/<uuid>/` | GET/PATCH | Dettagli e modifica | Owner |
| `/notaries/appointments/<uuid>/action/` | POST | Accetta/Rifiuta | Notaio |

#### 3. **Logica di Business**
- ✅ Calcolo slot disponibili basato su:
  - Orari di lavoro del notaio (`NotaryAvailability`)
  - Appuntamenti già prenotati
  - Durata slot configurabile
- ✅ **Protezione concorrente** con `SELECT FOR UPDATE`
- ✅ Prevenzione doppia prenotazione stesso slot
- ✅ Filtri per stato e tipo appuntamento

---

### 🎨 Frontend (React)

#### 1. **Servizio API** (`frontend/src/services/appointmentService.js`)
```javascript
- getAvailableSlots(notaryId, startDate, endDate, duration)
- createAppointment(appointmentData)
- getAppointments(filters)
- getAppointment(appointmentId)
- acceptAppointment(appointmentId)
- rejectAppointment(appointmentId, reason)
- cancelAppointment(appointmentId)
```

#### 2. **Componenti Cliente**

**AppointmentCalendar** (`AppointmentCalendar.jsx`)
- 📅 Calendario mensile interattivo
- 🟢 Indicatori di disponibilità
- 🕐 Slot orari disponibili
- ✨ Selezione data e ora
- 📱 Responsive design

**AppointmentBooking** (`AppointmentBooking.jsx`)
- 📝 Form completo di prenotazione
- 🎯 Selezione tipo appuntamento
- 📅 Integrazione con calendario
- 💬 Note aggiuntive
- ✅ Conferma prenotazione

#### 3. **Componente Notaio**

**NotaryAppointments** (`NotaryAppointments.jsx`)
- 📋 Lista appuntamenti con filtri
- 🔔 Badge di stato visivi
- ✅ Azione: Accetta appuntamento
- ❌ Azione: Rifiuta con motivazione
- 🔄 Aggiornamento in tempo reale

---

## 🔄 Flusso di Utilizzo

### Cliente:
1. Naviga nella dashboard cliente
2. Clicca su card notaio → "Prenota appuntamento"
3. Visualizza calendario con slot disponibili
4. Seleziona data, ora e tipo appuntamento
5. Aggiunge note (opzionale)
6. Conferma prenotazione → Stato: **PENDING**

### Notaio:
1. Accede alla sezione "Gestione Appuntamenti"
2. Visualizza appuntamenti in attesa
3. Vede dettagli cliente e note
4. **Accetta** → Stato: **ACCEPTED** ✅
5. **Rifiuta** (con motivazione) → Stato: **REJECTED** ❌

---

## 🛠️ Configurazione Necessaria

### 1. **Impostare Orari di Lavoro** (Tab Agenda in Settings)

Il notaio deve configurare:
- ✅ Orari di lavoro per giorno della settimana
- ✅ Durata slot (es: 30 minuti)
- ✅ Festività e chiusure personalizzate
- ✅ Tipologie di appuntamento

### 2. **Integrare i Componenti**

#### Dashboard Cliente:
```jsx
import AppointmentBooking from './components/AppointmentBooking'

// Nell'azione "Prenota" della card notaio:
<button onClick={() => setShowBooking(true)}>
  Prenota appuntamento
</button>

{showBooking && (
  <AppointmentBooking
    notary={selectedNotary}
    onClose={() => setShowBooking(false)}
    onSuccess={(appointment) => {
      console.log('Appuntamento prenotato:', appointment)
      setShowBooking(false)
    }}
  />
)}
```

#### Dashboard Notaio:
```jsx
import NotaryAppointments from './components/NotaryAppointments'

// Aggiungere una sezione nella dashboard:
<NotaryAppointments />
```

---

## 🔐 Sicurezza Implementata

✅ **Autenticazione JWT**: Tutte le API richiedono token valido  
✅ **Autorizzazione**: Clienti possono prenotare, notai possono gestire  
✅ **Protezione Concorrente**: `SELECT FOR UPDATE` previene race conditions  
✅ **Validazione**: Controlli su date, orari e disponibilità  
✅ **Separazione Ruoli**: Clienti vedono solo i propri, notai vedono i loro

---

## 📊 Stati Appuntamento

| Stato | Descrizione | Chi può settarlo |
|-------|-------------|------------------|
| `pending` | In attesa di conferma | Sistema (alla creazione) |
| `accepted` | Confermato dal notaio | Notaio |
| `rejected` | Rifiutato dal notaio | Notaio |
| `cancelled` | Annullato dal cliente | Cliente |
| `completed` | Completato | Notaio (futuro) |

---

## 🎨 Design System

### Colori Stati:
- 🟡 **Pending**: Giallo (#FFF3E0)
- 🟢 **Accepted**: Verde (#E8F5E9)
- 🔴 **Rejected**: Rosso (#FFEBEE)
- ⚪ **Cancelled**: Grigio (#F5F5F5)
- 🔵 **Completed**: Blu (#E3F2FD)

### Icone:
- 📅 `Calendar`: Calendario/Date
- 🕐 `Clock`: Orari
- 👤 `User`: Cliente
- 📝 `FileText`: Note/Dettagli
- ✅ `CheckCircle`: Accetta
- ❌ `XCircle`: Rifiuta/Annulla
- ⚠️ `AlertCircle`: In attesa

---

## 🚀 Prossimi Sviluppi

### Funzionalità Avanzate:
- [ ] **Notifiche Email**: Conferma, accettazione, rifiuto
- [ ] **Notifiche Push**: Real-time per nuovi appuntamenti
- [ ] **Calendario Sincronizzazione**: Google Calendar, Outlook
- [ ] **Pagamento Online**: Pagamento caparra per appuntamenti
- [ ] **Video Chiamata**: Link per appuntamenti online
- [ ] **Reminder**: Promemoria automatici 24h prima
- [ ] **Rescheduling**: Richiesta modifica orario
- [ ] **Recurring Appointments**: Appuntamenti ricorrenti
- [ ] **Statistiche**: Analytics per notai

### Integrazioni:
- [ ] SMS con Twilio
- [ ] Email con SendGrid
- [ ] WebSocket per aggiornamenti real-time
- [ ] Export iCal/Google Calendar

---

## 📝 Note Tecniche

### Performance:
- ✅ Query ottimizzate con `select_related()`
- ✅ Indicizzazione su `notary + date + status`
- ✅ Caching per slot disponibili (future)

### Testing:
- Backend: Testare con `pytest`
- Frontend: Testare con Jest/React Testing Library

### Database:
- Tabella: `appointments`
- Migrazione: `0004_appointment.py`

---

## 📖 Documentazione API

Accedi alla documentazione interattiva:
```
http://localhost:8000/api/schema/swagger-ui/
```

---

## ✅ Checklist Implementazione

- [x] Modello Django Appointment
- [x] API calcolo slot disponibili
- [x] API prenotazione con lock concorrente
- [x] API gestione appuntamenti (accept/reject)
- [x] Servizio JavaScript appointmentService
- [x] Componente Calendario (AppointmentCalendar)
- [x] Componente Form Prenotazione (AppointmentBooking)
- [x] Componente Dashboard Notaio (NotaryAppointments)
- [x] CSS responsive per tutti i componenti
- [ ] Integrazione in Dashboard Cliente
- [ ] Integrazione in Dashboard Notaio
- [ ] Testing End-to-End

---

**🎉 Sistema pronto per l'integrazione finale nelle dashboard!**
