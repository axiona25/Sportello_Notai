# Integrazione LibreOffice Collabora Online ✅

## 📋 RIEPILOGO

Integrazione completa di **LibreOffice Collabora Online** per visualizzare documenti Word (.doc/.docx) con **pagine A4 separate** identiche a Microsoft Word/OnlyOffice.

---

## 🎯 COSA È STATO IMPLEMENTATO

### 1. **Frontend React**
- ✅ `LibreOfficeViewer.jsx` - Componente React per iframe Collabora
- ✅ `LibreOfficeViewer.css` - Styling del viewer
- ✅ `OfficeViewer.jsx` - Aggiornato per usare LibreOfficeViewer
- ✅ Rimosso `DocxPreviewViewer.jsx` (deprecato)
- ✅ Rimossa dipendenza `docx-preview` da package.json

### 2. **Backend Django**
- ✅ `views_wopi.py` - Implementazione protocollo WOPI completo:
  - `WOPICheckFileInfo` - Metadata documento
  - `WOPIGetFile` - Download documento
  - `WOPIPutFile` - Salva modifiche
  - `WOPILock` - Gestione lock collaborativo
- ✅ `documents/urls.py` - Routes WOPI aggiunte

### 3. **Docker Infrastructure**
- ✅ `docker-compose.yml` - Aggiunto servizio Collabora Online
  - Porta: 9980
  - Container: `sportello-notai-collabora`

---

## 🚀 AVVIO SISTEMA

### **STEP 1: Avvia Docker Compose (Backend + Collabora)**

```bash
cd backend
docker-compose up -d
```

**Verifica che Collabora sia in esecuzione:**
```bash
docker ps | grep collabora
# Output atteso: sportello-notai-collabora (porta 9980)

curl http://localhost:9980/
# Output atteso: OK o pagina HTML Collabora
```

### **STEP 2: Aggiorna dipendenze Frontend**

```bash
cd ../frontend
npm install  # Rimuove docx-preview, mantiene altre dipendenze
```

### **STEP 3: Configura variabili ambiente Frontend**

Crea file `.env` nel frontend (se non esiste):

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_COLLABORA_URL=http://localhost:9980
VITE_WS_BASE_URL=ws://localhost:8000
```

### **STEP 4: Avvia Frontend**

```bash
npm run dev
```

---

## 📄 TEST VISUALIZZAZIONE WORD

### **Scenario di test:**

1. **Login** come notaio (es. `f.spada@digitalnotary.sm`)
2. **Apri appuntamento** esistente
3. **Seleziona documento Word** (.doc o .docx) dalla lista
4. **Verifica**:
   - ✅ Visualizzazione con **pagine A4 separate**
   - ✅ Bordi pagina visibili
   - ✅ Margini corretti (25mm stile Word)
   - ✅ Scroll tra pagine
   - ✅ Zoom e navigazione
   - ✅ Toolbar Collabora visibile

### **Console logs attesi:**

**Frontend:**
```
📄 LibreOffice Viewer - Document ID: <uuid>
📄 Collabora Host: http://localhost:9980
📄 WOPI Source: http://localhost:8000/api/documents/wopi/files/<uuid>
✅ LibreOffice iframe caricato
```

**Backend:**
```
✅ WOPI CheckFileInfo: documento.docx (Size: 45678 bytes)
✅ WOPI GetFile: documento.docx
```

---

## 🔧 TROUBLESHOOTING

### ❌ **Errore: "Impossibile caricare il documento"**

**Cause possibili:**
1. Collabora non è in esecuzione
2. URL Collabora errato
3. Backend WOPI non risponde

**Soluzioni:**
```bash
# Verifica Collabora
docker logs sportello-notai-collabora

# Riavvia Collabora
docker-compose restart collabora

# Test WOPI endpoint manuale
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/documents/wopi/files/<document-uuid>
```

### ❌ **Errore: "CORS policy blocked"**

**Soluzione:** Aggiungi Collabora ai CORS_ALLOWED_ORIGINS in Django `settings.py`:

```python
# backend/core/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:9980',  # ✅ Aggiungi Collabora
]
```

### ❌ **Documento non si carica (spinner infinito)**

**Verifica:**
1. Token JWT valido
2. Documento esiste nel database
3. File fisico esiste su disco
4. Permessi lettura file corretti

```bash
# Test backend WOPI
python manage.py shell
>>> from documents.models import ActDocument
>>> doc = ActDocument.objects.first()
>>> print(doc.file.path)
>>> import os
>>> os.path.exists(doc.file.path)  # Deve essere True
```

---

## 📊 ARCHITETTURA

```
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         v                                 v
┌─────────────────┐              ┌──────────────────┐
│ Django Backend  │◄─────WOPI───►│ Collabora Online │
│  (Port 8000)    │              │   (Port 9980)    │
└─────────┬───────┘              └──────────────────┘
          │
          v
    ┌──────────┐
    │PostgreSQL│
    │  + Files │
    └──────────┘
```

**Flow:**
1. Frontend richiede documento Word
2. `LibreOfficeViewer.jsx` costruisce URL iframe Collabora
3. Collabora chiama backend via **WOPI protocol**:
   - `CheckFileInfo` → Metadata
   - `GetFile` → Download contenuto
4. Collabora renderizza documento con pagine A4
5. Utente visualizza/edita
6. Salvataggio → `PutFile` (solo notaio)

---

## 🎨 FEATURES COLLABORA

- ✅ **Pagine A4 separate** (layout identico a Word)
- ✅ **Zoom e navigazione**
- ✅ **Toolbar editing completa**
- ✅ **Collaborazione real-time** (multi-user)
- ✅ **Commenti e revisioni**
- ✅ **Export PDF/ODT**
- ✅ **Supporto .doc (legacy) e .docx**

---

## 🔐 SICUREZZA

### **Autenticazione WOPI:**
- JWT token passato nell'URL iframe
- Backend valida token in ogni request WOPI
- Solo utenti autenticati possono accedere

### **Permessi:**
- **Notaio**: Read + Write
- **Cliente**: Read-only
- Controllato in `WOPICheckFileInfo` → `UserCanWrite`

### **Lock collaborativo:**
- Implementato in `WOPILock`
- Previene editing simultaneo conflittuale

---

## 📚 DOCUMENTAZIONE WOPI

- [Microsoft WOPI Protocol](https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/)
- [Collabora Online Docs](https://sdk.collaboraonline.com/docs/index.html)
- [WOPI CheckFileInfo Spec](https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/files/checkfileinfo)

---

## 🎉 RISULTATO FINALE

**Prima (docx-preview):**
- ❌ Pagina unica continua
- ❌ Layout non fedele a Word
- ❌ No editing

**Dopo (Collabora Online):**
- ✅ **Pagine A4 separate visivamente**
- ✅ **Layout identico a Microsoft Word**
- ✅ **Editing completo**
- ✅ **Collaborazione real-time**

---

## 📝 MANUTENZIONE

### **Aggiornamento Collabora:**
```bash
docker-compose pull collabora
docker-compose up -d collabora
```

### **Monitoraggio logs:**
```bash
# Collabora
docker logs -f sportello-notai-collabora

# Django WOPI
docker logs -f sportello-notai-backend | grep WOPI
```

### **Backup documenti:**
I documenti Word sono salvati in:
- Development: `backend/media/templates/acts/`
- Production: Volume Docker `media_volume`

---

## ✅ CHECKLIST DEPLOYMENT PRODUZIONE

- [ ] Aggiorna `domain` in docker-compose.yml (da `localhost` a dominio reale)
- [ ] Abilita SSL per Collabora (`--o:ssl.enable=true`)
- [ ] Configura certificati SSL (Let's Encrypt)
- [ ] Aggiungi dominio ai CORS Django
- [ ] Configura reverse proxy Nginx per Collabora
- [ ] Test carico Collabora (limite connessioni)
- [ ] Backup automatico file `.docx`
- [ ] Monitoring Collabora (healthcheck)

---

**Data implementazione:** 27 Ottobre 2025
**Autore:** AI Assistant + Developer
**Status:** ✅ COMPLETO E FUNZIONANTE

