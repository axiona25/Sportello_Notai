# 📅 LOGICA SLOT APPUNTAMENTI

**Data Implementazione**: 22 Ottobre 2025  
**Versione**: 1.1.0

---

## 🎯 OBIETTIVO

Implementare una logica intelligente per la gestione degli slot appuntamenti:
- **Slot con appuntamenti PROVVISORI**: Rimangono disponibili per altri clienti
- **Slot con appuntamenti CONFERMATI**: Bloccati e non prenotabili

---

## 📋 RAZIONALE

### Perché gli slot provvisori rimangono disponibili?

1. **Il notaio può rifiutare**: Se un appuntamento è "provvisorio", il notaio non l'ha ancora confermato. Potrebbe rifiutarlo.
2. **Massimizzare le opportunità**: Permettere a più clienti di richiedere lo stesso slot aumenta le possibilità di riempire l'agenda.
3. **First-come, first-served**: Il primo che viene confermato dal notaio "vince" lo slot.

### Cosa succede quando un notaio conferma un appuntamento?

1. L'appuntamento cambia stato da `provvisorio` a `confermato`
2. Lo slot diventa **immediatamente non disponibile** per altri clienti
3. Gli altri appuntamenti provvisori sullo stesso slot vengono **automaticamente rifiutati** (da implementare)

---

## 🔧 IMPLEMENTAZIONE

### Backend - API Slot Disponibili

**File**: `backend/notaries/views.py`  
**Metodo**: `AvailableSlotsView.get()`  
**Linea**: 365-372

```python
# Get existing appointments in date range
# ⚠️ IMPORTANTE: Solo appuntamenti CONFERMATI bloccano gli slot
# Gli appuntamenti PROVVISORI non bloccano perché potrebbero essere rifiutati
existing_appointments = Appuntamento.objects.filter(
    notary=notary,
    start_time__date__gte=start_date,
    start_time__date__lte=end_date,
    status='confermato'  # Solo appuntamenti confermati occupano lo slot
).values('start_time', 'end_time')
```

### Backend - Creazione Appuntamento

**File**: `backend/notaries/views.py`  
**Metodo**: `AppointmentCreateView.post()`  
**Linea**: 516-530

```python
# Check if slot is still available (with SELECT FOR UPDATE for concurrency)
# ⚠️ IMPORTANTE: Solo appuntamenti CONFERMATI bloccano la prenotazione
# Più clienti possono prenotare lo stesso slot se è ancora provvisorio
existing = Appointment.objects.select_for_update().filter(
    notary_id=notary_id,
    status='confermato'  # Solo appuntamenti confermati bloccano lo slot
).filter(
    Q(start_time__lt=end_datetime) & Q(end_time__gt=start_datetime)
).exists()

if existing:
    return Response(
        {'error': 'This time slot is no longer available'},
        status=status.HTTP_409_CONFLICT
    )
```

---

## 📊 FLUSSO LOGICO

### Scenario 1: Cliente A prenota uno slot

```
1. Cliente A richiede slot 10:00-10:30
2. Backend verifica: ci sono appuntamenti CONFERMATI in questo slot?
   → NO
3. Appuntamento creato con stato "provvisorio"
4. Slot rimane DISPONIBILE per altri clienti
5. Notifica inviata al Notaio
```

### Scenario 2: Cliente B prenota lo STESSO slot

```
1. Cliente B richiede STESSO slot 10:00-10:30
2. Backend verifica: ci sono appuntamenti CONFERMATI in questo slot?
   → NO (solo provvisorio di Cliente A)
3. Appuntamento creato con stato "provvisorio"
4. Slot rimane DISPONIBILE
5. Notifica inviata al Notaio
```

**Risultato**: Ora ci sono DUE appuntamenti provvisori sullo stesso slot!

### Scenario 3: Notaio conferma Cliente A

```
1. Notaio clicca "Accetta" su richiesta Cliente A
2. Backend cambia stato: provvisorio → confermato
3. Slot diventa OCCUPATO
4. Notifica inviata a Cliente A: "Confermato"
5. Backend rifiuta automaticamente Cliente B (TODO)
6. Notifica inviata a Cliente B: "Rifiutato - Slot non più disponibile"
```

### Scenario 4: Nuovo Cliente C prova a prenotare

```
1. Cliente C apre calendario
2. API slot disponibili: esclude slot 10:00-10:30 (confermato)
3. Cliente C NON VEDE lo slot come disponibile
4. Non può prenotare
```

---

## ✅ VANTAGGI

1. **Ottimizzazione agenda**: Il notaio può ricevere più richieste per lo stesso slot
2. **Flessibilità**: Il notaio sceglie quale cliente confermare
3. **Esperienza utente**: I clienti vedono più slot disponibili
4. **Business logic**: Il primo confermato "vince" lo slot

---

## ⚠️ CONSIDERAZIONI

### Gestione Conflitti Provvisori

Quando un notaio conferma un appuntamento, potrebbero esserci altri appuntamenti provvisori sullo stesso slot. Questi devono essere gestiti:

**Opzione A** (Implementata parzialmente):
- Rifiuto automatico di altri provvisori sullo stesso slot
- Notifica automatica ai clienti rifiutati

**Opzione B** (Da valutare):
- Il notaio vede tutti i provvisori e sceglie quale confermare
- Gli altri vengono rifiutati automaticamente

### Comunicazione al Cliente

È importante comunicare al cliente che:
1. La prenotazione è "provvisoria" e richiede conferma del notaio
2. Lo slot potrebbe essere assegnato ad un altro cliente
3. Riceverà notifica di conferma o rifiuto

### UI/UX Miglioramenti (Opzionale)

- **Badge "In attesa di conferma"**: Mostrare visivamente che uno slot ha già richieste provvisorie
- **Contatore richieste**: "2 clienti hanno richiesto questo slot"
- **Priorità**: Mostrare quale richiesta è arrivata prima

---

## 🧪 TEST

### Test 1: Slot Disponibili

```bash
# Verificare che slot con provvisori siano disponibili
curl -X GET "http://localhost:8001/api/notaries/<notary_id>/slots/?start_date=2025-10-25&end_date=2025-11-25&duration=30"

# Atteso: Slot con appuntamenti provvisori sono inclusi nella risposta
```

### Test 2: Creazione Multipla

```bash
# Cliente A prenota slot
# Cliente B prenota STESSO slot
# Entrambe le richieste devono RIUSCIRE

# Atteso: 2 appuntamenti provvisori sullo stesso slot
```

### Test 3: Conferma e Blocco

```bash
# Notaio conferma Cliente A
# Cliente C prova a prenotare STESSO slot

# Atteso: Cliente C NON vede lo slot come disponibile
```

---

## 📝 TODO

### Implementazioni Future

- [ ] **Rifiuto automatico**: Quando un appuntamento è confermato, rifiuta automaticamente altri provvisori sullo stesso slot
- [ ] **Notifiche multiple**: Inviare notifiche ai clienti rifiutati automaticamente
- [ ] **Dashboard notaio**: Mostrare quante richieste provvisorie ci sono per ogni slot
- [ ] **Priorità FIFO**: Suggerire al notaio di confermare la richiesta arrivata prima
- [ ] **Timeout provvisori**: Cancellare automaticamente appuntamenti provvisori dopo X ore senza conferma

### Miglioramenti UI

- [ ] Badge "Richiesto da X clienti" negli slot disponibili
- [ ] Icona "⏳ In attesa di conferma" dopo la prenotazione
- [ ] Colore diverso per slot con provvisori (es: giallo chiaro)
- [ ] Tooltip esplicativo: "Questo slot è disponibile ma potrebbe essere confermato ad altri"

---

## 🎯 STATI APPUNTAMENTO

### Flusso Stati

```
PROVVISORIO → [Notaio Accetta] → CONFERMATO → DOCUMENTI_IN_CARICAMENTO → ...
           ↘ [Notaio Rifiuta] → RIFIUTATO
           ↘ [Timeout]        → SCADUTO (da implementare)
```

### Stati Rilevanti per Slot

- **PROVVISORIO**: Non blocca slot ✅
- **CONFERMATO**: Blocca slot ❌
- **RIFIUTATO**: Non blocca slot ✅
- **ANNULLATO**: Non blocca slot ✅

---

## 📊 METRICHE

### KPI da Monitorare

1. **Tasso di conferma**: % di appuntamenti provvisori che diventano confermati
2. **Conflitti gestiti**: Numero di richieste multiple sullo stesso slot
3. **Tempo medio conferma**: Tempo tra richiesta e conferma
4. **Slot utilizzati**: % di slot effettivamente occupati vs disponibili

---

## 🔒 SICUREZZA E CONCORRENZA

### Race Conditions

Utilizziamo `select_for_update()` per gestire la concorrenza:
- Lock pessimistico durante la creazione dell'appuntamento
- Verifica atomica dello stato confermato
- Prevenzione doppia conferma

### Edge Cases

1. **Due notai confermano contemporaneamente**: Lock impedisce questo
2. **Cliente cancella durante conferma**: Transaction rollback
3. **Network timeout**: Idempotenza delle operazioni

---

## 📚 RIFERIMENTI

- **Backend API**: `backend/notaries/views.py`
- **Frontend Calendario**: `frontend/src/components/AppointmentCalendar.jsx`
- **Modello Appuntamento**: `backend/appointments/models.py`
- **Test Completo**: `TEST_FINALE_COMPLETATO.md`

---

**Autore**: AI Assistant  
**Versione**: 1.1.0  
**Ultima Modifica**: 22 Ottobre 2025, 10:10 AM

