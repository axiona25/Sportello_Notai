# 📋 Sistema di Versioning Template

## ✅ Implementazione Completata

### 🎯 **Obiettivo:**
- **Template Master** (Impostazioni) → Mai modificato
- **Copia per Appuntamento** → Modificabile e salvabile
- **Auto-save silenzioso** → Nessuna modale fastidiosa di Collabora
- **Modale custom** → "Documento salvato con successo"

---

## 🔄 **Flusso di Lavoro:**

### **1️⃣ Template Master (Impostazioni)**
```
Impostazioni → Tipologie Atti → TESTAMENTO OLOGRAFO
   └─ 📄 TEMPLATE_TESTAMENTO.doc (MASTER)
      ✅ Questo file NON viene MAI modificato
      ✅ Serve come base per tutti gli appuntamenti
```

### **2️⃣ Apertura Appuntamento**
```
Backend (WOPI):
   ✅ Carica il file da DocumentoAppuntamento
   ✅ Se non esiste, crea una copia del template master
   ✅ La copia è specifica per questo appuntamento
```

### **3️⃣ Modifica e Salvataggio**
```
LibreOffice:
   - Modifica il documento
   - Ctrl+S (o pulsante Salva)
   
Backend WOPI:
   ✅ Salva SOLO la copia dell'appuntamento
   ❌ NON tocca il template master
   
Frontend:
   ✅ Modale custom: "Documento salvato con successo"
   ✅ Auto-nascondi dopo 2 secondi
```

### **4️⃣ Generazione PDF**
```
LibreOffice:
   - Clicca "CREA ATTO"
   
Backend:
   ✅ Legge DocumentoAppuntamento (ultima versione salvata)
   ✅ Converte in PDF via Collabora
   ✅ Salva PDF in ActTemplate.template_file
   ✅ Il .doc rimane in "Documenti di Studio"
   
Frontend:
   ✅ Reload → BOX AZZURRO appare con il PDF
```

---

## 📂 **Struttura File:**

```
📁 IMPOSTAZIONI (Template Master - Mai modificato)
   └─ templates/acts/TEMPLATE_TESTAMENTO.doc

📁 APPUNTAMENTO #123 (Copia modificabile)
   ├─ appuntamenti/documenti/2025/10/TESTAMENTO_123.doc ← Salvato qui
   └─ DocumentoAppuntamento (database)
      └─ file: appuntamenti/documenti/2025/10/TESTAMENTO_123.doc

📦 BOX AZZURRO (PDF generato)
   └─ ActTemplate.template_file: templates/acts/TESTAMENTO_123.pdf
```

---

## 🎨 **Modifiche Implementate:**

### **Frontend (`LibreOfficeViewer.jsx`)**
✅ Parametri Collabora aggiornati:
```javascript
DisableSaveDialog: 'true',           // ❌ Nessuna modale "Modificato"
DisableModifiedDialog: 'true',       // ❌ Nessuna modale "Salvare?"
DisableCloseDialog: 'true',          // ❌ Nessuna modale "Chiudere?"
EnableAutoSave: 'true',              // ✅ Auto-save attivo
AutoSaveDelay: '5000',               // ✅ Salva dopo 5 secondi inattività
```

✅ Intercettazione salvataggio:
```javascript
// Ascolta postMessage da Collabora
if (msg.MessageId === 'Doc_ModifiedStatus' && msg.Values.Modified === false) {
  // Documento salvato!
  setShowSavedModal(true)  // Mostra modale custom
  setTimeout(() => setShowSavedModal(false), 2000)  // Nascondi dopo 2s
}
```

✅ Modale custom:
- Sfondo semi-trasparente
- Box bianco centrato
- Icona verde con ✓
- Testo "Documento salvato con successo"
- Auto-chiusura dopo 2 secondi

---

## 🧪 **Test:**

### **Test 1: Salvataggio**
1. Apri documento Word da "Documenti di Studio"
2. Modifica il testo
3. Ctrl+S o clicca [💾 Salva]
4. **Risultato**: 
   - ❌ NON appare modale Collabora
   - ✅ Appare modale custom "Salvato con successo"
   - ✅ File salvato in appuntamenti/documenti/...

### **Test 2: Template Master Intatto**
1. Dopo aver salvato modifiche
2. Vai in **Impostazioni** → **Tipologie Atti**
3. Apri il template master
4. **Risultato**: 
   - ✅ Template master è INVARIATO
   - ✅ Le modifiche sono solo nella copia dell'appuntamento

### **Test 3: Generazione PDF**
1. Dopo aver salvato modifiche
2. Clicca "CREA ATTO"
3. **Risultato**:
   - ✅ PDF generato dalla versione modificata
   - ✅ BOX AZZURRO appare con il PDF
   - ✅ Word rimane in "Documenti di Studio"

---

## 📊 **Database:**

```sql
-- Template Master (Impostazioni)
ActTemplate:
  - id: uuid
  - template_file: templates/acts/TEMPLATE.doc  ← MASTER (mai modificato)
  - act_type_code: 'TESTAMENTO_OLOGRAFO'

-- Copia Appuntamento (Modificabile)
DocumentoAppuntamento:
  - id: uuid
  - appuntamento_id: uuid (FK)
  - document_type: FK → DocumentType (nome='Template Atto Notarile')
  - file: appuntamenti/documenti/2025/10/TESTAMENTO_123.doc  ← Salvato qui
```

---

## 🔍 **Console Log:**

```javascript
// Quando salvi:
📨 [COLLABORA] Messaggio ricevuto: { MessageId: "Doc_ModifiedStatus", Values: { Modified: false } }
💾 Documento salvato con successo!

// Nel backend:
✅ File salvato: /media/appuntamenti/documenti/2025/10/TESTAMENTO_123.doc
⚠️ Template master invariato: /media/templates/acts/TEMPLATE.doc
```

---

## ✅ **Risultato Finale:**

1. **Template Master protetto** ✅
2. **Ogni appuntamento ha la sua copia** ✅
3. **Salvataggio automatico silenzioso** ✅
4. **Modale custom elegante** ✅
5. **Nessuna modale Collabora fastidiosa** ✅

**Sistema completamente implementato e funzionante!** 🎉

