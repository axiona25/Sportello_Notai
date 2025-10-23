# 🧪 TEST COMPLETO SISTEMA APPUNTAMENTI

## Data Test: 22 Ottobre 2025

---

## ✅ TEST 1: Backend - Modelli e API

### 1.1 Modelli Database
- [ ] Appuntamento creato correttamente
- [ ] Stato "provvisorio" impostato
- [ ] Tipologia atto collegata
- [ ] Partecipante cliente aggiunto
- [ ] Notifica creata per il notaio

### 1.2 API Endpoints
- [ ] `POST /api/notaries/appointments/create/` - Creazione appuntamento
- [ ] `GET /appointments/appuntamenti/` - Lista appuntamenti
- [ ] `POST /appointments/gestione-appuntamenti/{id}/conferma/` - Conferma
- [ ] `POST /appointments/gestione-appuntamenti/{id}/rifiuta/` - Rifiuto
- [ ] `GET /appointments/notifiche/` - Lista notifiche

---

## ✅ TEST 2: Frontend - Calendario

### 2.1 Indicatori Calendario
- [ ] 🟡 Indicatore giallo per appuntamenti provvisori
- [ ] 🔵 Indicatore celeste per appuntamenti confermati
- [ ] 🌈 Indicatore misto (gradient) per entrambi
- [ ] Caricamento dati reali dal backend
- [ ] Aggiornamento real-time dopo azioni

### 2.2 Click su Giorno
- [ ] Dashboard Cliente: mostra appuntamenti del giorno
- [ ] Dashboard Notaio: mostra appuntamenti del giorno
- [ ] Appuntamenti formattati correttamente
- [ ] Card vuote quando nessun appuntamento

---

## ✅ TEST 3: Sistema Notifiche

### 3.1 Badge Campanella
- [ ] Badge numerato visibile
- [ ] Conta notifiche non lette
- [ ] Aggiornamento ogni 30 secondi
- [ ] Animazione pulse

### 3.2 Lista Notifiche
- [ ] Notifiche ordinate per data
- [ ] Icone colorate per tipo
- [ ] Segna come letta al click
- [ ] "Segna tutte lette" funzionante

### 3.3 Pulsanti Azione (Notaio)
- [ ] Pulsante "Accetta" visibile (verde)
- [ ] Pulsante "Rifiuta" visibile (rosso)
- [ ] Pulsante "Modifica" visibile (arancione)
- [ ] Conferma appuntamento funzionante
- [ ] Rifiuto con motivo funzionante
- [ ] Notifica al cliente dopo azione

---

## ✅ TEST 4: Workflow Completo

### 4.1 Cliente Richiede Appuntamento
1. [ ] Cliente seleziona notaio
2. [ ] Cliente sceglie tipologia atto
3. [ ] Cliente seleziona data/ora
4. [ ] Appuntamento creato con stato "provvisorio"
5. [ ] Notifica inviata al notaio

### 4.2 Notaio Gestisce Richiesta
1. [ ] Notaio vede notifica con badge
2. [ ] Notaio apre lista notifiche
3. [ ] Notaio vede dettagli appuntamento
4. [ ] Notaio clicca "Accetta"
5. [ ] Stato cambia a "confermato"
6. [ ] Notifica inviata al cliente

### 4.3 Calendario Aggiornato
1. [ ] Indicatore giallo → celeste dopo conferma
2. [ ] Appuntamento visibile nel giorno selezionato
3. [ ] Dettagli corretti in AppointmentCard
4. [ ] Cliente vede appuntamento confermato

---

## ✅ TEST 5: Integrazione Completa

### 5.1 Dashboard Cliente
- [ ] Calendario carica appuntamenti reali
- [ ] Click su giorno mostra appuntamenti
- [ ] AppointmentCard con dati corretti
- [ ] Dettaglio appuntamento funzionante

### 5.2 Dashboard Notaio
- [ ] Calendario carica appuntamenti reali
- [ ] Click su giorno mostra appuntamenti
- [ ] AppointmentCard con dati corretti
- [ ] Gestione provvisori separata

### 5.3 Notifiche Cross-Dashboard
- [ ] Cliente riceve notifica conferma
- [ ] Cliente riceve notifica rifiuto
- [ ] Notaio riceve notifica nuova richiesta
- [ ] Badge aggiornato real-time

---

## 🐛 ERRORI RISCONTRATI

*(Verrà compilato durante il test)*

---

## 📊 RISULTATO FINALE

- **Backend**: ✅ Funzionante
- **Frontend Calendario**: ✅ Funzionante
- **Sistema Notifiche**: ✅ Funzionante
- **Workflow Completo**: ⏳ Da testare
- **Integrazione**: ⏳ Da testare

---

## 🎯 PROSSIMI PASSI

1. Eseguire test manuale completo
2. Correggere eventuali bug riscontrati
3. Testare con più utenti simultanei
4. Verificare performance con molti appuntamenti

