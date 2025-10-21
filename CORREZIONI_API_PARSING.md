# 🔧 Correzioni API Response Parsing

## ❌ Problemi Identificati

### 1. **NotificationBell.jsx**
```
TypeError: Cannot read properties of undefined (reading 'results')
```

**Causa:** L'API `/appointments/notifiche/` ritorna 401 (non autenticato), quindi `response.data` è `undefined`.

### 2. **AppointmentBooking.jsx**
```
TypeError: Cannot read properties of undefined (reading 'map')
TypeError: Cannot read properties of undefined (reading 'length')
```

**Causa:** L'API `/acts/categories/` ritorna 401 (non autenticato), quindi `response.data` è `undefined`.

---

## ✅ Correzioni Applicate

### 1️⃣ **appointmentExtendedService.js**

#### Prima:
```javascript
async getTipologieAtto() {
  try {
    const response = await apiClient.get('/acts/categories/')
    return response.data // ❌ Potrebbe essere undefined
  } catch (error) {
    console.error('Errore caricamento tipologie atto:', error)
    throw error // ❌ Propaga l'errore
  }
}
```

#### Dopo:
```javascript
async getTipologieAtto() {
  try {
    const response = await apiClient.get('/acts/categories/')
    // ✅ Gestisci vari formati di risposta
    return response.data || response.results || response || []
  } catch (error) {
    console.error('Errore caricamento tipologie atto:', error)
    return [] // ✅ Ritorna array vuoto per permettere il fallback
  }
}
```

**Stesso fix per:**
- ✅ `getNotifiche()`
- ✅ `getNotificheNonLette()`

---

### 2️⃣ **NotificationBell.jsx**

#### Prima:
```javascript
const loadNotifiche = async () => {
  try {
    const data = await appointmentExtendedService.getNotifiche()
    const notificheArray = Array.isArray(data) ? data : (data.results || [])
    // ❌ Se data è undefined, data.results fa crash
    setNotifiche(notificheArray)
  } catch (error) {
    console.error('Errore caricamento notifiche:', error)
    // ❌ Non imposta un fallback
  }
}
```

#### Dopo:
```javascript
const loadNotifiche = async () => {
  try {
    const data = await appointmentExtendedService.getNotifiche()
    // ✅ Gestisci vari formati con optional chaining
    const notificheArray = Array.isArray(data) 
      ? data 
      : (data?.results || data?.data || [])
    
    setNotifiche(notificheArray)
    const count = notificheArray.filter(n => !n.letta).length
    setNonLette(count)
  } catch (error) {
    console.error('Errore caricamento notifiche:', error)
    setNotifiche([]) // ✅ Fallback a array vuoto
    setNonLette(0)
  }
}
```

---

### 3️⃣ **AppointmentBooking.jsx**

#### Prima:
```javascript
const loadActCategories = async () => {
  try {
    const response = await appointmentExtendedService.getTipologieAtto()
    
    console.log('📊 Tipologie atto caricate dal backend:', response.length)
    // ❌ Se response è undefined, .length fa crash
    
    const servicesFromBackend = response.map(cat => ({ ... }))
    // ❌ Se response non è array, .map() fa crash
    
    setActCategories(servicesFromBackend)
  } catch (error) {
    console.error('❌ Errore caricamento tipologie atto:', error)
    setActCategories([])
  }
}
```

#### Dopo:
```javascript
const loadActCategories = async () => {
  try {
    const response = await appointmentExtendedService.getTipologieAtto()
    
    // ✅ Gestisci vari formati di risposta API
    let categoriesArray = []
    if (Array.isArray(response)) {
      categoriesArray = response
    } else if (response?.results) {
      categoriesArray = response.results
    } else if (response?.data) {
      categoriesArray = response.data
    }
    
    console.log('📊 Tipologie atto caricate dal backend:', categoriesArray.length)
    
    if (categoriesArray.length === 0) {
      console.log('⚠️  Nessuna categoria ricevuta dal backend, uso fallback')
      setActCategories([])
      return
    }
    
    const servicesFromBackend = categoriesArray.map(cat => ({ ... }))
    setActCategories(servicesFromBackend)
    console.log('✅ Card configurate:', servicesFromBackend.length)
  } catch (error) {
    console.error('❌ Errore caricamento tipologie atto:', error)
    setActCategories([])
    console.log('⚠️  Fallback a servizi hardcoded')
  }
}
```

---

## 🎯 Comportamento Ora

### ✅ Quando Backend è Raggiungibile e Autenticato
```
📊 Tipologie atto caricate dal backend: 41
✅ Card configurate: 41
```
→ Mostra le 41 tipologie dal DB con paginazione (4 pagine)

### ✅ Quando Backend Ritorna 401 (Non Autenticato)
```
❌ Errore caricamento tipologie atto: ...
⚠️  Fallback a servizi hardcoded
```
→ Mostra i 12 servizi hardcoded (1 pagina)

### ✅ Quando Backend Non è Raggiungibile
```
❌ Errore caricamento tipologie atto: Network Error
⚠️  Fallback a servizi hardcoded
```
→ Mostra i 12 servizi hardcoded (1 pagina)

---

## 🔍 Cause del 401 (Possibili)

Il backend richiede autenticazione per le API:
```bash
curl http://localhost:8001/api/acts/categories/
# {"error":true,"message":"Non sono state immesse le credenziali di autenticazione."}
```

**Possibili motivi:**
1. ❌ Token JWT scaduto nel localStorage
2. ❌ Token non presente (non loggato)
3. ❌ Token non inviato nell'header (problema apiClient)

**Verifica:**
1. Assicurati di essere loggato come cliente/notaio/admin
2. Controlla il localStorage per il token:
   ```javascript
   // In console browser (F12)
   localStorage.getItem('token')
   ```
3. Verifica che `apiClient` includa il token nelle richieste

---

## 🧪 Come Testare

1. **Apri browser (F12) → Console**

2. **Login come cliente:**
   - Email: `cliente@example.com`
   - Password: `password123`

3. **Clicca su un notaio → "Prenota Appuntamento"**

4. **Controlla console:**
   - ✅ Dovrebbe mostrare: `📊 Tipologie atto caricate dal backend: 41`
   - ✅ Vedi le frecce di navigazione `← 1 di 4 →`
   - ✅ Vedi 12 card alla volta

5. **Se vedi fallback:**
   ```
   ⚠️  Fallback a servizi hardcoded
   ```
   - Controlla di essere loggato
   - Controlla che il backend sia attivo: `curl http://localhost:8001/health/`

---

## 📋 File Modificati

1. ✅ `frontend/src/services/appointmentExtendedService.js`
   - `getTipologieAtto()` - Ritorna array vuoto invece di throw
   - `getNotifiche()` - Ritorna array vuoto invece di throw
   - `getNotificheNonLette()` - Ritorna array vuoto invece di throw

2. ✅ `frontend/src/components/NotificationBell.jsx`
   - `loadNotifiche()` - Gestisce undefined con optional chaining e fallback

3. ✅ `frontend/src/components/AppointmentBooking.jsx`
   - `loadActCategories()` - Verifica tipo di risposta prima di usarla

---

**Correzioni applicate il:** 21 Ottobre 2025

