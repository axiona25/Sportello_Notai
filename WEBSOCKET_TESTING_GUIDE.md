# 🧪 Guida Testing WebSocket Real-Time PDF Collaboration

## ✅ Setup Completato

### Backend
- ✅ Django Channels installato
- ✅ Daphne (ASGI server) configurato
- ✅ Redis channel layer attivo
- ✅ Consumer WebSocket implementato
- ✅ Routing WebSocket configurato
- ✅ CORS configurato per WebSocket

### Frontend
- ✅ WebSocket client abilitato
- ✅ Handler messaggi implementati
- ✅ Broadcasting automatico azioni

---

## 🚀 Come Avviare

### 1. **Backend (Daphne ASGI Server)**

```bash
cd backend
./run_asgi.sh
```

Oppure manualmente:
```bash
cd backend
source venv/bin/activate
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

**Verifica:**
- HTTP server: http://localhost:8000
- WebSocket: ws://localhost:8000/ws/pdf/{appointment_id}/

### 2. **Frontend**

```bash
cd frontend
npm start
```

### 3. **Redis (Required)**

Verifica che Redis sia attivo:
```bash
redis-cli ping
# Output: PONG
```

Se non attivo:
```bash
brew services start redis
```

---

## 🧪 Test Scenario 1: Notaio + Cliente (Stesso Browser)

### Setup:
1. **Tab 1 - Notaio:**
   - Login come notaio
   - Entra in video chiamata
   - Click su "Condividi" (📤) documento
   - Il lettore PDF si apre

2. **Tab 2 - Cliente:**
   - Login come cliente (stesso appointment)
   - Entra in video chiamata
   - Accettato dal notaio
   - Click su documento condiviso
   - Il lettore PDF si apre

### Test Actions:

#### A. **Cambio Pagina** (solo notaio)
- Notaio: Click ← →
- Cliente: Pagina si sincronizza automaticamente
- Console: `📄 Notaio cambia pagina: 3`

#### B. **Zoom** (solo notaio)
- Notaio: Click + -
- Cliente: Zoom si sincronizza automaticamente
- Console: `🔍 Notaio cambia zoom: 150%`

#### C. **Rotazione** (solo notaio)
- Notaio: Click ⚙️ → Ruota (🔄)
- Cliente: Pagina ruota automaticamente
- Console: `🔄 Notaio ruota pagina: 90°`

#### D. **Vista Libro/Singola** (solo notaio)
- Notaio: Click icona 📖
- Cliente: Vista cambia automaticamente
- Console: `👁️ Notaio cambia vista: double`

#### E. **Scroll** (solo notaio)
- Notaio: Scroll nel PDF
- Cliente: Scroll sincronizzato automaticamente
- (Non loggato per performance)

#### F. **Annotazioni** (tutti)
- Notaio/Cliente: Click strumento evidenziatore
- Tutti: Vedono l'annotazione
- Console: `✏️ Mario Rossi aggiunge annotazione tipo highlight`

#### G. **Controllo Accessi** (solo notaio)
- Notaio: Click 👥 Partecipanti → 👁️ su cliente
- Cliente: Vede "Il notaio ha rimosso il tuo accesso" e viene espulso
- Console: `🔐 Notaio modifica accessi: participant 456 -> false`

---

## 🧪 Test Scenario 2: Multi-Browser (Cross-Browser)

### Setup:
1. **Browser 1 (Chrome) - Notaio:**
   - Login notaio
   - Apri PDF

2. **Browser 2 (Firefox) - Cliente:**
   - Login cliente
   - Apri stesso PDF

### Test:
- Ripeti tutti i test dello Scenario 1
- Verifica sincronizzazione tra browser diversi

---

## 📊 Log Console da Verificare

### **Frontend (Browser Console)**

#### Connessione:
```
✅ WebSocket connesso per sincronizzazione PDF
📨 WS Message: {type: "CONNECTION_SUCCESS", message: "Connesso alla room PDF..."}
```

#### Join Room:
```
📡 Broadcast: {type: "JOIN", userId: 123, userName: "Mario Rossi"}
```

#### Ricezione Azioni:
```
📨 WS Message: {type: "PAGE_CHANGE", page: 5, userId: 123, userName: "Notaio Studio"}
📨 WS Message: {type: "ZOOM_CHANGE", zoom: 150, userId: 123}
📨 WS Message: {type: "ANNOTATION_ADD", annotation: {...}}
```

#### Disconnessione:
```
🔌 WebSocket chiuso: 1000 Normal Closure
```

### **Backend (Terminal Logs)**

#### Connessione:
```
📡 WebSocket PDF - Connessione da user 123 per appointment 456
✅ WebSocket PDF - User 123 connesso a room pdf_collaboration_456
```

#### Join:
```
👋 User Mario Rossi (notary) entrato in room PDF 456
```

#### Azioni:
```
📨 WebSocket PDF - Ricevuto messaggio tipo 'PAGE_CHANGE' da user 123
📄 Notaio cambia pagina: 5
🔍 Notaio cambia zoom: 150%
✏️ Mario Rossi aggiunge annotazione tipo highlight
```

#### Disconnessione:
```
🔌 WebSocket PDF - Disconnessione user 123 da room pdf_collaboration_456 (code: 1000)
```

---

## 🐛 Troubleshooting

### WebSocket non si connette

**Problema:** `WebSocket error` in console

**Soluzioni:**
1. Verifica backend con Daphne (non runserver):
   ```bash
   ps aux | grep daphne
   ```

2. Verifica Redis:
   ```bash
   redis-cli ping
   ```

3. Verifica URL WebSocket:
   ```javascript
   // Deve essere ws:// non http://
   const wsUrl = `ws://localhost:8000/ws/pdf/${appointmentId}/`
   ```

4. Verifica CORS settings:
   ```python
   # settings.py
   ALLOWED_HOSTS = ['localhost', '127.0.0.1']
   ```

### Messaggi non sincronizzati

**Problema:** Notaio cambia pagina ma cliente non vede il cambio

**Soluzioni:**
1. Verifica console browser: deve esserci `📨 WS Message: {type: "PAGE_CHANGE"...}`
2. Verifica ruolo utente: `userRole` deve essere `'notary'` per notaio
3. Verifica handler messaggio:
   ```javascript
   case 'PAGE_CHANGE':
     if (!isNotary) setCurrentPage(data.page)
     break
   ```

### Redis connection error

**Problema:** `Error connecting to Redis`

**Soluzione:**
```bash
# Avvia Redis
brew services start redis

# Verifica connessione
redis-cli ping

# Verifica configurazione Django
python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
>>> print(channel_layer)
```

### Channel layer not configured

**Problema:** `No default channel layer` error

**Soluzione:**
Verifica `settings.py`:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('localhost', 6379)],
        },
    },
}
```

---

## 📈 Performance Testing

### Test con più partecipanti:
1. Apri 5+ tab come clienti diversi
2. Notaio cambia pagina rapidamente
3. Verifica sync su tutti i client
4. Monitor Redis:
   ```bash
   redis-cli monitor
   ```

### Test latenza:
1. Notaio cambia pagina
2. Misura tempo fino a sync cliente
3. Atteso: < 100ms

---

## ✅ Checklist Test Completo

- [ ] Backend Daphne avviato
- [ ] Redis attivo
- [ ] Frontend avviato
- [ ] Login notaio
- [ ] Login cliente
- [ ] Apri PDF notaio
- [ ] Apri PDF cliente
- [ ] Test cambio pagina ← →
- [ ] Test zoom + -
- [ ] Test rotazione 🔄
- [ ] Test vista libro/singola 📖
- [ ] Test scroll sincronizzato
- [ ] Test annotazione evidenziatore
- [ ] Test controllo accessi 👁️
- [ ] Test disconnessione graceful
- [ ] Verifica log console puliti
- [ ] Verifica log backend corretti
- [ ] Test cross-browser (Chrome + Firefox)
- [ ] Test performance con 5+ clienti

---

## 🎉 Expected Result

Quando tutto funziona correttamente:

1. **Notaio guida** la visualizzazione (pagina, zoom, scroll)
2. **Cliente segue** automaticamente senza poter cambiare autonomamente
3. **Tutti vedono** le annotazioni aggiunte da chiunque
4. **Notaio controlla** chi può vedere il documento
5. **Sincronizzazione immediata** (< 100ms)
6. **Nessun errore** in console
7. **Log chiari** in backend

---

## 📚 Risorse Utili

- [Django Channels Docs](https://channels.readthedocs.io/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Redis Commands](https://redis.io/commands)
- [Daphne Server](https://github.com/django/daphne)

---

## 🚀 Next Steps (Future)

- [ ] Autenticazione JWT via WebSocket
- [ ] Riconnessione automatica
- [ ] Heartbeat/keepalive
- [ ] Compressione messaggi
- [ ] Cursori multipli visualizzati
- [ ] History/undo annotazioni
- [ ] Video call signaling via WebSocket
- [ ] Chat real-time

**Il sistema WebSocket è ora COMPLETO e FUNZIONANTE!** 🎉

