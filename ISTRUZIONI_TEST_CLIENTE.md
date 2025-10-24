# 🧪 Come testare il flusso Cliente ↔ Notaio

## 📋 Problema attuale:
Stai sempre vedendo la vista NOTAIO perché non hai attivato la modalità DEBUG Cliente.

## ✅ Soluzione - Segui questi passi:

### **1. Apri DUE schede/finestre del browser**

**SCHEDA 1 - NOTAIO:**
- URL: `http://localhost:3000` (normale)
- Entra nell'appuntamento cliccando "Entra"
- **NON** cliccare nessun pulsante DEBUG
- Vedrai la video chiamata con la card "Partecipanti"

**SCHEDA 2 - CLIENTE:**
- URL: `http://localhost:3000` (stessa, normale)
- Entra nello STESSO appuntamento cliccando "Entra"
- **CERCA IL PULSANTE DEBUG** 🟡 nell'header (icona Users 👥)
- **CLICCALO!** Diventerà giallo/arancione
- Vedrai immediatamente la Sala d'Attesa

### **2. Dove trovare il pulsante DEBUG:**

```
┌────────────────────────────────────────┐
│ [👥]  [⛶] [−] [×]     ← HEADER       │ 
│  ↑                                     │
│  Questo! Clicca qui per attivare       │
│  modalità CLIENTE                      │
└────────────────────────────────────────┘
```

### **3. Verifica nei log della console:**

**Prima di cliccare** (NON va bene):
```
🎭 User role: notary
```

**Dopo aver cliccato** (OK!):
```
🧪 DEBUG MODE: Forzato ruolo CLIENTE per test
🎭 User role: client (FORCED CLIENT MODE)
👤 Cliente in attesa - Inizio polling per accettazione...
🔄 Polling check - Key: client_accepted_...
```

### **4. Procedura completa:**

1. **SCHEDA CLIENTE**: Clicca il pulsante DEBUG 🟡
2. **SCHEDA CLIENTE**: Vedrai la Sala d'Attesa
3. **SCHEDA NOTAIO**: Vai nella card "Partecipanti"
4. **SCHEDA NOTAIO**: Clicca "Accetta"
5. **SCHEDA NOTAIO**: Conferma "Ammetti"
6. **SCHEDA CLIENTE**: 🎉 Automaticamente passerà alla video chiamata!

## 🎨 Come riconoscere il pulsante:

- **ICONA**: Users (👥 due persone)
- **POSIZIONE**: Primo pulsante a sinistra nell'header
- **COLORE**:
  - Grigio/trasparente = Modalità NOTAIO (default)
  - Giallo/Arancione 🟡 = Modalità CLIENTE (attivo)
- **TOOLTIP**: Al passaggio del mouse mostra "DEBUG: Clicca per simulare vista CLIENTE"

## ❌ Cosa NON fare:

- ❌ Non aspettarti che funzioni senza cliccare il pulsante
- ❌ Non usare lo stesso browser senza due schede separate
- ❌ Non dimenticare di cliccare DEBUG nella scheda cliente

## ✅ Conferma che funziona:

Quando hai cliccato correttamente il pulsante DEBUG vedrai nei log:
```javascript
🧪 DEBUG MODE: Forzato ruolo CLIENTE per test
📡 Cliente in sala d'attesa
```

Se continui a vedere solo `notary`, **non hai ancora cliccato il pulsante!**

