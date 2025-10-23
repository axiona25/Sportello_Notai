# Implementazione Menu Azioni Appuntamenti

## Panoramica

Implementato un sistema completo di gestione appuntamenti con menu azioni per il notaio. Il menu permette di **Modificare**, **Annullare** o **Eliminare** gli appuntamenti direttamente dalle mini card del calendario.

## Componenti Creati

### 1. **AppointmentCard** (Modificato)
- ✅ Aggiunto menu verticale con icona `MoreVertical` in alto a destra
- ✅ Dropdown menu con 3 azioni:
  - **Modifica** (icona Edit2, colore blu)
  - **Annulla** (icona XCircle, colore arancione)
  - **Elimina** (icona Trash2, colore rosso)
- ✅ Menu si chiude automaticamente quando si clicca fuori
- ✅ Props aggiunte: `showActions`, `onEdit`, `onCancel`, `onDelete`, `appointmentData`

### 2. **EditAppointmentModal** (Nuovo)
**Path:** `frontend/src/components/EditAppointmentModal.jsx`

Funzionalità:
- ✅ Mostra data appuntamento corrente
- ✅ Integra `AppointmentCalendar` per selezionare nuova data/slot
- ✅ Visualizza slot selezionato con conferma visiva
- ✅ Salva modifiche e invia notifica al cliente
- ✅ Aggiorna automaticamente il calendario
- ✅ UI moderna con feedback visivo

### 3. **ConfirmCancelModal** (Nuovo)
**Path:** `frontend/src/components/ConfirmCancelModal.jsx`

Funzionalità:
- ✅ Richiede motivo dell'annullamento (obbligatorio)
- ✅ Warning box con spiegazione delle conseguenze:
  - Cliente riceve notifica
  - Appuntamento rimosso dal calendario cliente
  - Slot rimane nel calendario notaio come annullato (barrato)
  - Slot non più prenotabile
- ✅ Caratteri rimanenti (max 500)
- ✅ UI con gradienti arancioni per "attenzione"

### 4. **ConfirmDeleteModal** (Nuovo)
**Path:** `frontend/src/components/ConfirmDeleteModal.jsx`

Funzionalità:
- ✅ Richiede conferma esplicita (digitare "ELIMINA")
- ✅ Danger box con warning critico:
  - Azione irreversibile
  - Rimozione da entrambi i calendari
  - Slot torna disponibile
  - Dati eliminati definitivamente
  - Cliente NON riceve notifica
- ✅ UI con gradienti rossi per "pericolo"

## Servizi API Implementati

**File:** `frontend/src/services/appointmentExtendedService.js`

```javascript
// Aggiornamento appuntamento (modifica data/ora)
async aggiornaAppuntamento(appuntamentoId, dati)

// Annullamento appuntamento
async annullaAppuntamento(appuntamentoId, motivo)

// Eliminazione completa appuntamento  
async eliminaAppuntamento(appuntamentoId)
```

### Endpoint Backend
- `PATCH /api/appointments/appuntamenti/{id}/` - Aggiorna appuntamento
- `POST /api/appointments/appuntamenti/{id}/annulla/` - Annulla appuntamento
- `DELETE /api/appointments/appuntamenti/{id}/` - Elimina appuntamento

## Integrazione Dashboard Notaio

**File:** `frontend/src/components/DashboardNotaio.jsx`

Stati aggiunti:
```javascript
const [showEditModal, setShowEditModal] = useState(false)
const [showCancelModal, setShowCancelModal] = useState(false)
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [appointmentToAction, setAppointmentToAction] = useState(null)
```

Gestori:
```javascript
handleEditAppointment(appointmentData)
handleCancelAppointment(appointmentData)
handleDeleteAppointment(appointmentData)
handleActionSuccess()
closeAllModals()
```

Props passate alle AppointmentCard:
```javascript
<AppointmentCard
  showActions={true}
  onEdit={handleEditAppointment}
  onCancel={handleCancelAppointment}
  onDelete={handleDeleteAppointment}
  appointmentData={appointment.rawData}
  // ... altre props
/>
```

## Flussi Operativi

### 🔵 MODIFICA Appuntamento

1. Notaio clicca su menu azioni → **Modifica**
2. Si apre modale con:
   - Info appuntamento corrente (data/ora)
   - Calendario interattivo per selezione
3. Notaio seleziona nuova data e slot
4. Conferma → API `aggiornaAppuntamento()`
5. **Risultato**:
   - ✅ Appuntamento aggiornato nel database
   - ✅ Cliente riceve notifica con nuova data
   - ✅ Calendari aggiornati automaticamente (evento `appointment-updated`)
   - ✅ Toast di successo

### 🟠 ANNULLA Appuntamento

1. Notaio clicca su menu azioni → **Annulla**
2. Si apre modale di conferma con:
   - Warning delle conseguenze
   - Campo motivo (obbligatorio, max 500 caratteri)
3. Notaio inserisce motivo e conferma
4. API `annullaAppuntamento()`
5. **Risultato Backend previsto**:
   - ✅ Appuntamento con status = `annullato`
   - ✅ Slot visibile nel calendario notaio come "barrato/spento"
   - ✅ Slot NON più prenotabile
   - ✅ Appuntamento rimosso dal calendario cliente
   - ✅ Cliente riceve notifica con motivo
   - ✅ Toast di successo

### 🔴 ELIMINA Appuntamento

1. Notaio clicca su menu azioni → **Elimina**
2. Si apre modale di conferma critica con:
   - Danger box con warning forte
   - Richiesta di digitare "ELIMINA" per confermare
3. Notaio digita "ELIMINA" e conferma
4. API `eliminaAppuntamento()`
5. **Risultato Backend previsto**:
   - ✅ Appuntamento eliminato completamente dal database
   - ✅ Rimosso da calendario notaio
   - ✅ Rimosso da calendario cliente
   - ✅ Slot torna disponibile per nuove prenotazioni
   - ⚠️ Cliente NON riceve notifica (eliminazione silente)
   - ✅ Toast di successo

## Stili CSS

### AppointmentCard.css
- Menu actions posizionato `absolute` top-right
- Dropdown con animazione `slideDown`
- Colori differenziati per azione:
  - Modifica: blu (#1668B0)
  - Annulla: arancione (#F59E0B)
  - Elimina: rosso (#EF4444)

### EditAppointmentModal.css
- Modale responsive (max-width: 800px)
- Badge info giallo per data corrente
- Badge successo verde per slot selezionato
- Animazione `modalSlideIn`

### ConfirmModal.css
- Header con gradienti differenziati:
  - Annulla: giallo-arancione
  - Elimina: rosso chiaro
- Icone grandi circolari (72px)
- Box di warning/danger con bordi colorati
- Bottoni con gradienti e hover effects

## Aggiornamento Calendari

Sistema di eventi per sincronizzazione automatica:

```javascript
// Dopo ogni azione di successo
window.dispatchEvent(new Event('appointment-updated'))
```

I calendari (Calendar.jsx) ascoltano questo evento e ricaricano i dati:

```javascript
useEffect(() => {
  const handleAppointmentUpdate = () => {
    loadAppointmentsForMonth()
  }
  window.addEventListener('appointment-updated', handleAppointmentUpdate)
  return () => window.removeEventListener('appointment-updated', handleAppointmentUpdate)
}, [currentMonth, currentYear])
```

## File Modificati/Creati

### Modificati
- ✅ `frontend/src/components/AppointmentCard.jsx`
- ✅ `frontend/src/components/AppointmentCard.css`
- ✅ `frontend/src/components/DashboardNotaio.jsx`
- ✅ `frontend/src/services/appointmentExtendedService.js`

### Creati
- ✅ `frontend/src/components/EditAppointmentModal.jsx`
- ✅ `frontend/src/components/EditAppointmentModal.css`
- ✅ `frontend/src/components/ConfirmCancelModal.jsx`
- ✅ `frontend/src/components/ConfirmDeleteModal.jsx`
- ✅ `frontend/src/components/ConfirmModal.css`

## Testing Suggerito

### Test Modifica
1. Login come notaio
2. Visualizza calendario con appuntamenti
3. Click su menu azioni (3 puntini) di un appuntamento
4. Click su "Modifica"
5. Seleziona nuova data e slot
6. Conferma
7. **Verifica**:
   - Modale si chiude
   - Toast di successo
   - Calendario aggiornato
   - Cliente riceve notifica (controllare backend/notifiche)

### Test Annullamento
1. Click su menu azioni → "Annulla"
2. Inserire motivo (es: "Imprevisto personale")
3. Conferma
4. **Verifica**:
   - Appuntamento rimosso dal calendario cliente
   - Slot visibile come annullato nel calendario notaio
   - Cliente riceve notifica con motivo
   - Slot non più prenotabile da altri

### Test Eliminazione
1. Click su menu azioni → "Elimina"
2. Digitare "ELIMINA"
3. Conferma
4. **Verifica**:
   - Appuntamento sparisce completamente
   - Slot torna disponibile per nuove prenotazioni
   - Nessuna notifica al cliente

## Note Backend

Il backend dovrebbe gestire:

1. **Annullamento** (`/annulla/`):
   ```python
   - Imposta status = 'annullato'
   - Crea notifica per cliente con motivo
   - Mantiene record nel DB
   ```

2. **Eliminazione** (`DELETE`):
   ```python
   - Rimuove record dal database
   - Cascade delete su relazioni (partecipanti, documenti, etc.)
   - NON invia notifiche
   ```

3. **Aggiornamento** (`PATCH`):
   ```python
   - Aggiorna start_time e end_time
   - Verifica disponibilità nuovo slot
   - Crea notifica per cliente con nuova data
   ```

## UX Highlights

- ✨ Menu animato con slideDown
- ✨ Icone intuitive con colori semantici
- ✨ Feedback immediato con toast
- ✨ Modali bloccanti per azioni critiche
- ✨ Conferme esplicite per azioni irreversibili
- ✨ Chiusura automatica menu al click esterno
- ✨ Loading states durante le operazioni
- ✨ Disabilitazione bottoni durante operazioni
- ✨ Caratteri rimanenti visibili nei form
- ✨ Badge colorati per stati diversi

## Implementazione Completata ✅

Tutte le funzionalità richieste sono state implementate:
- ✅ Menu azioni verticale in alto a destra
- ✅ Modale modifica con calendario e slot
- ✅ Modale conferma annullamento
- ✅ Modale conferma eliminazione
- ✅ Invio notifiche al cliente (API chiamate)
- ✅ Aggiornamento automatico calendari
- ✅ Gestione slot annullati/eliminati
- ✅ UI/UX completa e professionale

