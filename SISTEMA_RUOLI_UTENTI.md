# Sistema di Gestione Ruoli Utenti - Sportello Notai

## 📋 Riepilogo

È stato implementato un sistema completo di gestione dei ruoli utente con tre tipologie di profili dettagliati: **Clienti**, **Notai** e **Partners**.

## 🏗️ Struttura del Sistema

### Ruoli Utente
Il sistema supporta i seguenti ruoli:
- **NOTAIO** - Professionisti notarili
- **CLIENTE** - Utenti che richiedono servizi notarili
- **PARTNER** - Partner commerciali (Agenzie Immobiliari, Geometri, Architetti, etc.)
- **COLLABORATORE** - Collaboratori degli studi notarili
- **ADMIN** - Amministratori di sistema

## 📊 Modelli Implementati

### 1. Cliente (`clienti` table)

**Dati Anagrafici:**
- Nome, Cognome
- Sesso (M/F/A)
- Data di nascita
- Luogo di nascita
- Codice fiscale (univoco)

**Residenza:**
- Indirizzo completo (via, civico, CAP, città, nazione)

**Stato Civile e Patrimoniale:**
- Stato civile (Celibe/Nubile, Coniugato, Divorziato, Vedovo, Separato, Unione Civile)
- Regime patrimoniale (Comunione dei beni, Separazione dei beni, Fondo patrimoniale)

**Contatti:**
- Cellulare
- Email

**Documenti Allegati:**
- Carta d'identità
- Codice fiscale
- Carta sanitaria
- Passaporto

### 2. Notaio (`notai` table)

**Dati Anagrafici:**
- Nome, Cognome
- Sesso (M/F/A)
- Data di nascita
- Luogo di nascita
- Codice fiscale (univoco)

**Dati Professionali:**
- Numero iscrizione albo (univoco)
- Distretto notarile
- Data iscrizione albo
- Sede notarile
- Tipologia (Notaio Singolo, Studio Associato, Società Notarile)

**Studio Notarile:**
- Denominazione studio
- Partita IVA (univoco)
- Indirizzo completo studio
- Coordinate geografiche (latitudine, longitudine)

**Contatti:**
- Telefono studio
- Cellulare
- Email studio
- PEC (univoco)
- Sito web

**Altri Dati:**
- Orari di ricevimento (JSON)
- Documenti (identità, certificato albo, visura camerale)
- Status (attivo, verificato)

### 3. Partner (`partners` table)

**Tipologia Partner:**
- Agenzia Immobiliare
- Geometra
- Architetto
- Consulente del Lavoro
- Commercialista
- Perito

**Dati Aziendali:**
- Ragione sociale
- Partita IVA (univoco)
- Codice fiscale
- Indirizzo completo

**Referente:**
- Nome e cognome referente

**Contatti:**
- Cellulare
- Telefono
- Email
- PEC
- Sito web

**Documenti:**
- Visura Camera di Commercio
- Certificato iscrizione albo
- Documento identità referente
- Altri documenti

**Status:**
- Attivo
- Verificato

## 🔌 API Endpoints

Tutti gli endpoint sono accessibili tramite autenticazione JWT.

### Clienti
- `GET /api/accounts/clienti/` - Lista tutti i clienti (filtrata per ruolo)
- `GET /api/accounts/clienti/{id}/` - Dettaglio cliente
- `POST /api/accounts/clienti/` - Crea nuovo cliente (con utente)
- `PUT /api/accounts/clienti/{id}/` - Aggiorna cliente
- `PATCH /api/accounts/clienti/{id}/` - Aggiorna parzialmente cliente
- `DELETE /api/accounts/clienti/{id}/` - Elimina cliente

### Notai
- `GET /api/accounts/notai/` - Lista tutti i notai (filtrata per ruolo)
- `GET /api/accounts/notai/{id}/` - Dettaglio notaio
- `POST /api/accounts/notai/` - Crea nuovo notaio (con utente)
- `PUT /api/accounts/notai/{id}/` - Aggiorna notaio
- `PATCH /api/accounts/notai/{id}/` - Aggiorna parzialmente notaio
- `DELETE /api/accounts/notai/{id}/` - Elimina notaio

### Partners
- `GET /api/accounts/partners/` - Lista tutti i partners (filtrata per ruolo)
- `GET /api/accounts/partners/{id}/` - Dettaglio partner
- `POST /api/accounts/partners/` - Crea nuovo partner (con utente)
- `PUT /api/accounts/partners/{id}/` - Aggiorna partner
- `PATCH /api/accounts/partners/{id}/` - Aggiorna parzialmente partner
- `DELETE /api/accounts/partners/{id}/` - Elimina partner

## 🔍 Funzionalità di Ricerca e Filtri

### Clienti
- **Ricerca:** nome, cognome, codice fiscale, email, cellulare
- **Filtri:** sesso, stato civile, regime patrimoniale, città
- **Ordinamento:** cognome, nome, data nascita, data creazione

### Notai
- **Ricerca:** nome, cognome, codice fiscale, numero albo, denominazione studio, P.IVA, email, PEC
- **Filtri:** sesso, distretto notarile, sede, tipologia, città, provincia, attivo, verificato
- **Ordinamento:** cognome, nome, distretto notarile, data creazione

### Partners
- **Ricerca:** ragione sociale, P.IVA, codice fiscale, referente, email, PEC, cellulare
- **Filtri:** tipologia, città, provincia, attivo, verificato
- **Ordinamento:** ragione sociale, tipologia, data creazione

## 🔐 Controlli di Accesso

Il sistema implementa controlli di accesso basati sui ruoli:

### Clienti
- **Admin/Notaio:** Vedono tutti i clienti
- **Cliente:** Vede solo il proprio profilo
- **Altri ruoli:** Nessun accesso

### Notai
- **Admin:** Vede tutti i notai
- **Notaio:** Vede solo il proprio profilo
- **Cliente/Partner:** Vedono solo notai attivi e verificati

### Partners
- **Admin/Notaio:** Vedono tutti i partners
- **Partner:** Vede solo il proprio profilo
- **Cliente:** Vede solo partners attivi e verificati

## 📝 Audit Log

Tutte le operazioni CRUD sui profili vengono registrate nel sistema di audit:
- Creazione profilo
- Aggiornamento profilo
- Eliminazione profilo

## 💾 Database

### Tabelle Create:
- `clienti` - Profili clienti
- `notai` - Profili notai
- `partners` - Profili partner

### Migration:
- File: `accounts/migrations/0002_cliente_notaio_partner.py`
- Status: ✅ Applicata con successo

## 🎨 Pannello Admin

Tutti i modelli sono stati registrati nel pannello admin Django con:
- Liste filtrabili e ordinabili
- Campi di ricerca avanzata
- Fieldsets organizzati per categoria
- Campi readonly per timestamp

## 📤 Creazione Profili

### Creazione Cliente
```json
POST /api/accounts/clienti/
{
  "email": "cliente@example.com",
  "password": "password123456",
  "nome": "Mario",
  "cognome": "Rossi",
  "sesso": "M",
  "data_nascita": "1990-01-01",
  "luogo_nascita": "Roma",
  "codice_fiscale": "RSSMRA90A01H501X",
  "indirizzo": "Via Roma",
  "civico": "1",
  "cap": "00100",
  "citta": "Roma",
  "nazione": "Italia",
  "stato_civile": "celibe_nubile",
  "cellulare": "+39 333 1234567",
  "mail": "mario.rossi@example.com"
}
```

Il sistema:
1. Crea automaticamente l'utente con ruolo CLIENTE
2. Crea il profilo cliente collegato
3. Registra l'operazione nell'audit log

Lo stesso processo vale per Notai e Partners.

## 🔄 Prossimi Passi

1. **Dashboard Cliente:** La dashboard che hai creato può ora essere assegnata agli utenti con ruolo "Cliente"
2. **Integrazione Frontend:** Creare le interfacce per la gestione dei profili
3. **Validazione Documenti:** Implementare la verifica dei documenti caricati
4. **Notifiche:** Sistema di notifiche per verifica profili

## 🛠️ File Modificati

- ✅ `backend/accounts/models.py` - Modelli Cliente, Notaio, Partner
- ✅ `backend/accounts/serializers.py` - Serializers per API
- ✅ `backend/accounts/views.py` - ViewSets per CRUD
- ✅ `backend/accounts/urls.py` - Routing API
- ✅ `backend/accounts/admin.py` - Configurazione admin panel
- ✅ `backend/accounts/migrations/0002_cliente_notaio_partner.py` - Migration database

## ✨ Caratteristiche Implementate

- ✅ Modelli completi con tutti i campi richiesti
- ✅ Validazione dati (codice fiscale, P.IVA, etc.)
- ✅ Gestione file allegati
- ✅ Sistema di permessi basato su ruoli
- ✅ Audit logging completo
- ✅ API RESTful complete
- ✅ Ricerca e filtri avanzati
- ✅ Pannello admin configurato
- ✅ Database migrations applicate

Il sistema è pronto per essere testato e integrato con il frontend!

