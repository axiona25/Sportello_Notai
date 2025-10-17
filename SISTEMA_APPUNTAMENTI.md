# Sistema di Gestione Appuntamenti - Sportello Notai

## 📋 Riepilogo

Sistema completo di gestione appuntamenti con **agende condivise** tra Clienti, Notai e Partners. Implementa tutto il flusso dal wizard di prenotazione del cliente fino alla conferma finale con tutti i partecipanti.

## 🔄 Flusso Completo

### 1. **Cliente sceglie il Notaio** 
   - Il cliente visualizza la lista dei notai disponibili
   - Seleziona un notaio per prenotare un appuntamento

### 2. **Wizard Modale - Visualizzazione Slot**
   ```
   POST /api/appointments/appuntamenti/slot-disponibili/
   ```
   - Il cliente vede **solo gli slot effettivamente disponibili** del notaio
   - Il sistema calcola automaticamente:
     - Disponibilità standard del notaio (es: Lun-Ven 9:00-18:00)
     - Eccezioni (ferie, chiusure)
     - Appuntamenti già prenotati
   - Mostra slot liberi per le prossime 2-4 settimane

### 3. **Cliente Richiede Appuntamento**
   ```
   POST /api/appointments/appuntamenti/
   ```
   - Seleziona uno slot disponibile
   - Compila i dettagli (titolo, descrizione, tipo)
   - L'appuntamento viene creato con status **RICHIESTO**
   - Il cliente viene aggiunto automaticamente come partecipante

### 4. **Notaio Riceve la Richiesta**
   - Il notaio visualizza la richiesta nella sua agenda
   - Può approvare o rifiutare:
   ```
   POST /api/appointments/appuntamenti/{id}/approva-rifiuta/
   Body: {approva: true/false, motivo: "..."}
   ```

### 5. **Appuntamento Approvato**
   - Status passa da **RICHIESTO** a **APPROVATO**
   - Lo slot viene bloccato nell'agenda del notaio
   - Il cliente riceve notifica di conferma

### 6. **Notaio Invita Partners** (opzionale)
   ```
   POST /api/appointments/appuntamenti/{id}/invita-partners/
   Body: {partner_ids: [uuid1, uuid2, ...]}
   ```
   - Il notaio può invitare geometri, agenzie immobiliari, etc.
   - I partners ricevono l'invito con status **IN_ATTESA**

### 7. **Partners Rispondono**
   ```
   POST /api/appointments/partecipanti/{id}/rispondi/
   Body: {accetta: true/false, note: "..."}
   ```
   - Ogni partner accetta o rifiuta
   - Il sistema verifica conflitti nella loro agenda

### 8. **Conferma Finale**
   - Quando **tutti i partecipanti** hanno accettato:
   - Status passa da **APPROVATO** a **CONFERMATO**
   - Tutti gli slot vengono bloccati nelle rispettive agende

## 🗄️ Struttura Database

### Tabelle Create:

1. **`disponibilita_notaio`**
   - Disponibilità standard del notaio per giorno della settimana
   - Es: "Lunedì 9:00-13:00, slot da 30 minuti"

2. **`eccezioni_disponibilita`**
   - Ferie, chiusure, disponibilità extra
   - Es: "Chiuso dal 1/08 al 31/08 per ferie"

3. **`appuntamenti`**
   - Appuntamento principale
   - Stati: RICHIESTO → APPROVATO → CONFERMATO
   - Tipi: consulenza, firma_atto, sopralluogo, etc.

4. **`partecipanti_appuntamento`**
   - Gestisce Clienti e Partners nell'appuntamento
   - Tracking di accettazione/rifiuto per ciascuno
   - Stati: IN_ATTESA → ACCETTATO / RIFIUTATO

## 🔌 API Endpoints

### 📅 Disponibilità Notaio

#### Gestione Disponibilità
```
GET    /api/appointments/disponibilita/              # Lista disponibilità
POST   /api/appointments/disponibilita/              # Crea disponibilità
GET    /api/appointments/disponibilita/{id}/         # Dettaglio
PUT    /api/appointments/disponibilita/{id}/         # Aggiorna
DELETE /api/appointments/disponibilita/{id}/         # Elimina
```

**Esempio Creazione Disponibilità:**
```json
POST /api/appointments/disponibilita/
{
  "giorno_settimana": "lunedi",
  "ora_inizio": "09:00",
  "ora_fine": "13:00",
  "data_inizio_validita": "2025-01-01",
  "durata_slot_minuti": 30,
  "is_active": true,
  "permetti_prenotazioni_online": true
}
```

#### Gestione Eccezioni (Ferie/Chiusure)
```
GET    /api/appointments/eccezioni/                  # Lista eccezioni
POST   /api/appointments/eccezioni/                  # Crea eccezione
GET    /api/appointments/eccezioni/{id}/             # Dettaglio
PUT    /api/appointments/eccezioni/{id}/             # Aggiorna
DELETE /api/appointments/eccezioni/{id}/             # Elimina
```

**Esempio Creazione Ferie:**
```json
POST /api/appointments/eccezioni/
{
  "data_inizio": "2025-08-01T00:00:00Z",
  "data_fine": "2025-08-31T23:59:59Z",
  "motivo": "Ferie estive",
  "descrizione": "Chiusura per ferie agosto",
  "is_chiusura": true
}
```

### 📆 Appuntamenti

#### CRUD Appuntamenti
```
GET    /api/appointments/appuntamenti/               # Lista appuntamenti
POST   /api/appointments/appuntamenti/               # Crea richiesta
GET    /api/appointments/appuntamenti/{id}/          # Dettaglio
PATCH  /api/appointments/appuntamenti/{id}/          # Aggiorna
DELETE /api/appointments/appuntamenti/{id}/          # Elimina
```

#### Azioni Speciali

**🔍 Visualizza Slot Disponibili (WIZARD):**
```
POST /api/appointments/appuntamenti/slot-disponibili/

Request:
{
  "notaio_id": "uuid-notaio",
  "data_inizio": "2025-01-15",
  "data_fine": "2025-01-31",
  "durata_minuti": 60
}

Response:
{
  "notaio_id": "...",
  "notaio_nome": "Dr. Mario Rossi",
  "periodo": {
    "data_inizio": "2025-01-15",
    "data_fine": "2025-01-31"
  },
  "durata_minuti": 60,
  "slots_disponibili": [
    {
      "start": "2025-01-15T09:00:00Z",
      "end": "2025-01-15T10:00:00Z",
      "duration_minutes": 60,
      "notaio_id": "...",
      "notaio_nome": "Dr. Mario Rossi"
    },
    // ... altri slot
  ],
  "totale_slots": 45
}
```

**✅ Approva/Rifiuta Appuntamento (NOTAIO):**
```
POST /api/appointments/appuntamenti/{id}/approva-rifiuta/

Request (Approva):
{
  "approva": true,
  "confermato_da": "Dr. Mario Rossi"
}

Request (Rifiuta):
{
  "approva": false,
  "motivo": "Conflitto con altro impegno"
}
```

**👥 Invita Partners (NOTAIO):**
```
POST /api/appointments/appuntamenti/{id}/invita-partners/

Request:
{
  "partner_ids": [
    "uuid-partner-1",
    "uuid-partner-2"
  ],
  "ruolo": "invitato"
}
```

**❌ Annulla Appuntamento:**
```
POST /api/appointments/appuntamenti/{id}/annulla/

Request:
{
  "motivo": "Impossibilitato a partecipare"
}
```

**📅 Visualizza Mia Agenda:**
```
GET /api/appointments/appuntamenti/mia-agenda/
    ?data_inizio=2025-01-01T00:00:00Z
    &data_fine=2025-01-31T23:59:59Z

Response:
{
  "data_inizio": "2025-01-01T00:00:00Z",
  "data_fine": "2025-01-31T23:59:59Z",
  "appuntamenti": [
    {
      "id": "...",
      "titolo": "Consulenza acquisto immobile",
      "start_time": "2025-01-15T10:00:00Z",
      "end_time": "2025-01-15T11:00:00Z",
      "status": "confermato",
      "partecipanti": [...],
      // ... altri dati
    }
  ],
  "totale": 12
}
```

### 👥 Partecipanti

```
GET  /api/appointments/partecipanti/                 # Lista partecipazioni
GET  /api/appointments/partecipanti/{id}/            # Dettaglio
POST /api/appointments/partecipanti/{id}/rispondi/   # Accetta/Rifiuta invito
```

**Rispondi a Invito (PARTNER):**
```
POST /api/appointments/partecipanti/{id}/rispondi/

Request (Accetta):
{
  "accetta": true,
  "note": "Sarò presente"
}

Request (Rifiuta):
{
  "accetta": false,
  "note": "Impegno precedente"
}
```

## 🔐 Controlli Accesso

### Per Ruolo:

**Cliente:**
- ✅ Visualizza slot disponibili dei notai
- ✅ Crea richieste di appuntamento
- ✅ Visualizza i propri appuntamenti
- ✅ Annulla appuntamenti che ha richiesto
- ❌ Non vede appuntamenti di altri clienti

**Notaio:**
- ✅ Gestisce la propria disponibilità
- ✅ Crea eccezioni (ferie, chiusure)
- ✅ Visualizza tutte le richieste di appuntamento
- ✅ Approva/rifiuta richieste
- ✅ Invita partners agli appuntamenti
- ✅ Visualizza la propria agenda completa

**Partner:**
- ✅ Visualizza inviti ricevuti
- ✅ Accetta/rifiuta inviti
- ✅ Visualizza appuntamenti dove partecipa
- ❌ Non può vedere appuntamenti dove non è invitato

**Admin:**
- ✅ Accesso completo a tutto

## 🔄 Sincronizzazione Agende

### Come Funziona:

1. **Controllo Conflitti Automatico**
   - Prima di accettare, il sistema verifica conflitti
   - Per Notaio: verifica se ha già appuntamenti nello stesso orario
   - Per Partners: verifica se hanno già altri impegni

2. **Blocco Slot**
   - Quando un appuntamento è APPROVATO, lo slot viene bloccato
   - Altri clienti non vedranno più quello slot come disponibile
   - I partners invitati vedono se possono partecipare

3. **Conferma Totale**
   - L'appuntamento passa a CONFERMATO solo quando TUTTI accettano
   - Se qualcuno rifiuta, l'appuntamento resta APPROVATO ma incompleto

## 📊 Stati Appuntamento

```
RICHIESTO ──────────────► APPROVATO ──────────► CONFERMATO
   │                           │                      │
   │                           │                      │
   └──► RIFIUTATO              └──► ANNULLATO        └──► COMPLETATO
```

- **RICHIESTO**: Cliente ha fatto richiesta, notaio deve decidere
- **APPROVATO**: Notaio ha approvato, può invitare partners
- **CONFERMATO**: Tutti i partecipanti hanno accettato
- **RIFIUTATO**: Notaio ha rifiutato la richiesta
- **ANNULLATO**: Qualcuno ha annullato dopo l'approvazione
- **COMPLETATO**: Appuntamento concluso con successo

## 💡 Funzionalità Avanzate

### 1. **Slot Dinamici**
Il sistema calcola automaticamente gli slot in base a:
- Orari di apertura del notaio
- Durata slot configurabile (15, 30, 60 minuti)
- Pause pranzo e chiusure
- Appuntamenti già prenotati

### 2. **Gestione Eccezioni**
- Ferie: blocca tutto il periodo
- Chiusure occasionali: blocca giorni specifici
- Disponibilità extra: aggiunge slot fuori orario standard

### 3. **Notifiche** (da implementare)
- Reminder automatici prima dell'appuntamento
- Notifica al notaio per nuove richieste
- Notifica ai partners per inviti
- Conferme di accettazione/rifiuto

### 4. **Audit Completo**
Ogni azione viene tracciata:
- Creazione richieste
- Approvazioni/rifiuti
- Inviti partners
- Risposte agli inviti

## 🛠️ File Implementati

### Backend:
- ✅ `/backend/appointments/models.py` - Modelli completi
- ✅ `/backend/appointments/services.py` - Logica di business
- ✅ `/backend/appointments/serializers.py` - Serializers API
- ✅ `/backend/appointments/views.py` - ViewSets e API
- ✅ `/backend/appointments/urls.py` - Routing
- ✅ `/backend/appointments/admin.py` - Pannello admin
- ✅ `/backend/appointments/migrations/0002_*.py` - Database schema

## 🚀 Come Usare

### 1. **Notaio: Configura Disponibilità**
```bash
# Crea disponibilità standard
POST /api/appointments/disponibilita/
{
  "giorno_settimana": "lunedi",
  "ora_inizio": "09:00",
  "ora_fine": "18:00",
  "data_inizio_validita": "2025-01-01",
  "durata_slot_minuti": 60
}

# Aggiungi ferie
POST /api/appointments/eccezioni/
{
  "data_inizio": "2025-08-01T00:00:00Z",
  "data_fine": "2025-08-31T23:59:59Z",
  "motivo": "Ferie estive",
  "is_chiusura": true
}
```

### 2. **Cliente: Prenota Appuntamento**
```bash
# Step 1: Visualizza slot disponibili
POST /api/appointments/appuntamenti/slot-disponibili/
{
  "notaio_id": "uuid-notaio",
  "data_inizio": "2025-01-15",
  "durata_minuti": 60
}

# Step 2: Prenota uno slot
POST /api/appointments/appuntamenti/
{
  "notaio_id": "uuid-notaio",
  "cliente_id": "uuid-cliente",
  "start_time": "2025-01-15T10:00:00Z",
  "end_time": "2025-01-15T11:00:00Z",
  "titolo": "Consulenza acquisto immobile",
  "descrizione": "Prima casa",
  "tipo": "consulenza"
}
```

### 3. **Notaio: Gestisce Richieste**
```bash
# Approva
POST /api/appointments/appuntamenti/{id}/approva-rifiuta/
{"approva": true}

# Invita partners
POST /api/appointments/appuntamenti/{id}/invita-partners/
{"partner_ids": ["uuid-geometra"]}
```

### 4. **Partner: Risponde a Invito**
```bash
POST /api/appointments/partecipanti/{id}/rispondi/
{"accetta": true, "note": "Sarò presente"}
```

## ✨ Caratteristiche Implementate

- ✅ Calcolo automatico slot disponibili
- ✅ Controllo conflitti multi-utente
- ✅ Sincronizzazione agende
- ✅ Flusso completo richiesta → conferma
- ✅ Inviti multipli a partners
- ✅ Validazione disponibilità real-time
- ✅ Stati appuntamento completi
- ✅ Audit logging
- ✅ Permessi basati su ruoli
- ✅ API RESTful complete
- ✅ Pannello admin configurato

## 📝 Prossimi Passi (Opzionali)

1. Sistema di notifiche email/push
2. Export calendario (iCal/Google Calendar)
3. Ricorrenze appuntamenti
4. Videoconferenza integrata
5. Statistiche e analytics
6. Template messaggi personalizzabili

Il sistema è completo e pronto per l'uso! 🎉

