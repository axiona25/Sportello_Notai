# 🚀 Test Sistema Accettazione Cliente con API Django

## ✅ Implementazione completata:

### **Backend Django:**
1. ✅ Aggiunto campo `metadata` al modello `Appuntamento`
2. ✅ Migrazione creata e applicata
3. ✅ Endpoint `POST /api/appuntamenti/{id}/accept-client/` (Notaio accetta)
4. ✅ Endpoint `GET /api/appuntamenti/{id}/check-acceptance/` (Cliente controlla)

### **Frontend React:**
1. ✅ Chiamata API quando il notaio clicca "Ammetti"
2. ✅ Polling API ogni 2 secondi per il cliente
3. ✅ Fallback localStorage per tab stesso browser
4. ✅ BroadcastChannel per comunicazione tra tab

---

## 🧪 Come testare con Chrome Incognito:

### **1. Avvia il backend Django** (se non è già attivo):
```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend
source venv/bin/activate
python manage.py runserver
```

### **2. Avvia il frontend React** (se non è già attivo):
```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend
npm start
```

### **3. Apri DUE finestre Chrome Incognito:**

**Finestra 1 - NOTAIO:**
```
http://localhost:3000
```
- Fai login come notaio
- Entra nell'appuntamento cliccando "Entra"
- Vedrai la video chiamata con la card "Partecipanti"
- **NON** cliccare il pulsante DEBUG (resta grigio)

**Finestra 2 - CLIENTE:**
```
http://localhost:3000
```
- Fai login come cliente (oppure usa il pulsante DEBUG)
- Entra nello STESSO appuntamento
- **Opzione A**: Se hai accesso cliente reale, usa quello
- **Opzione B**: Clicca il pulsante DEBUG 👥 (diventa giallo)
- Vedrai la Sala d'Attesa

---

## 📊 Flusso di test:

### **Passo 1: Cliente in attesa**
**Finestra Cliente** - Console:
```javascript
👤 Cliente in attesa - Inizio polling per accettazione...
📻 BroadcastChannel listener attivo
🔄 Polling API - Response: {
  appointment_id: "5f3e522e-7d95-40d9-824c-108d445e6a23",
  is_accepted: false,
  accepted_at: null
}
```

### **Passo 2: Notaio accetta**
**Finestra Notaio**:
1. Vai nella card "Partecipanti"
2. Clicca "Accetta" accanto al nome del cliente
3. Conferma "Ammetti" nella modale

**Console Notaio:**
```javascript
✅ Notaio conferma accettazione cliente dalla sala d'attesa
📊 ActiveAppointment: {...}
🆔 AppointmentID: 5f3e522e-7d95-40d9-824c-108d445e6a23
✅ Cliente accettato tramite API: {
  success: true,
  message: "Cliente accettato nella video chiamata",
  appointment_id: "5f3e522e-7d95-40d9-824c-108d445e6a23",
  accepted_at: "2025-10-24T19:45:00.123456Z"
}
```

### **Passo 3: Cliente ammesso**
**Finestra Cliente** - Console:
```javascript
🔄 Polling API - Response: {
  appointment_id: "5f3e522e-7d95-40d9-824c-108d445e6a23",
  is_accepted: true,  // ← ORA È TRUE!
  accepted_at: "2025-10-24T19:45:00.123456Z"
}
✅✅✅ Cliente ACCETTATO dal notaio (via API) - Ingresso in video chiamata!
📹 Cliente ammesso - Attivo camera e microfono automaticamente
```

**Finestra Cliente** - UI:
- 🎉 La sala d'attesa si chiude automaticamente
- Si apre la video chiamata
- Webcam e microfono si attivano
- Vedi il video del notaio (placeholder) + il tuo video

---

## 🔍 Debug e troubleshooting:

### **Se il cliente non entra:**

1. **Verifica che il backend sia attivo:**
   ```bash
   curl http://localhost:8000/api/appuntamenti/
   ```

2. **Controlla i log della console cliente:**
   - Se vedi errori 401 → Token scaduto, rifai login
   - Se vedi errori 404 → Controlla l'ID appuntamento
   - Se vedi errori CORS → Verifica le impostazioni Django

3. **Controlla il database:**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py shell
   ```
   ```python
   from appointments.models import Appuntamento
   app = Appuntamento.objects.first()
   print(app.metadata)  # Deve contenere 'client_accepted': True
   ```

### **Se vedi sempre "notary" invece di "client":**
- Hai dimenticato di cliccare il pulsante DEBUG 👥!
- Il pulsante deve diventare giallo/arancione
- Controlla la console: deve mostrare `🧪 DEBUG MODE: Forzato ruolo CLIENTE`

---

## 🎯 Endpoint API implementati:

### **1. Accetta cliente** (Notaio)
```http
POST /api/appuntamenti/{appointment_id}/accept-client/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Cliente accettato nella video chiamata",
  "appointment_id": "...",
  "accepted_at": "2025-10-24T19:45:00.123456Z"
}
```

### **2. Controlla accettazione** (Cliente)
```http
GET /api/appuntamenti/{appointment_id}/check-acceptance/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "appointment_id": "...",
  "is_accepted": true,
  "accepted_at": "2025-10-24T19:45:00.123456Z"
}
```

---

## ✨ Funzionalità aggiuntive:

- **BroadcastChannel**: Comunicazione istantanea tra tab stesso browser
- **localStorage fallback**: Per tab stesso browser senza API
- **Polling intelligente**: API + fallback localStorage
- **Error handling**: Alert in caso di errori API
- **Audit logging**: Tutte le accettazioni sono registrate nel database

---

## 📝 Note:

- Il sistema ora funziona con **Chrome Incognito** perché usa API centrali
- Le finestre incognito comunicano tramite il **backend Django**
- Il polling è ogni **2 secondi** (bilanciamento tra reattività e carico server)
- Il campo `metadata` nel database salva `client_accepted` e `client_accepted_at`

---

## 🎉 Pronto per il test!

Segui i passi sopra e vedrai il cliente entrare automaticamente nella video chiamata quando il notaio lo accetta!

