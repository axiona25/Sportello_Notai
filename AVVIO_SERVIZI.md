# 🚀 Guida Avvio e Gestione Servizi

## 📋 Panoramica

Questa guida contiene tutti i comandi necessari per avviare, verificare e terminare i servizi frontend e backend del progetto Sportello Notai.

### Porte Utilizzate
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`

---

## 🟢 AVVIO SERVIZI

### 1️⃣ Avvio Frontend (Porta 3000)

```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend && npm run dev
```

**Output atteso**:
```
VITE v5.4.20  ready in 150 ms
➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Verifica frontend attivo**:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
✅ Se ritorna `200` → Frontend OK

---

### 2️⃣ Avvio Backend (Porta 8000)

```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend && source venv/bin/activate && python manage.py runserver 8000
```

**Output atteso**:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
[data]
Django version X.X, using settings 'core.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**Verifica backend attivo**:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/
```
✅ Se ritorna `200` → Backend OK

---

### 3️⃣ Avvio Entrambi i Servizi (Consigliato)

**Opzione A - Due Terminali separati**:

Terminal 1 - Frontend:
```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend
npm run dev
```

Terminal 2 - Backend:
```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend
source venv/bin/activate
python manage.py runserver 8000
```

**Opzione B - Background (sconsigliato per debug)**:
```bash
# Frontend in background
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend && npm run dev &

# Backend in background
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend && source venv/bin/activate && python manage.py runserver 8000 &
```

---

## 🔴 TERMINARE SERVIZI

### 1️⃣ Kill Frontend (Porta 3000)

**Opzione A - Trova e termina processo sulla porta**:
```bash
lsof -ti:3000 | xargs kill -9
```

**Opzione B - Kill per nome processo**:
```bash
pkill -f "vite"
```

**Verifica frontend terminato**:
```bash
lsof -i :3000
```
✅ Se non ritorna nulla → Frontend terminato

---

### 2️⃣ Kill Backend (Porta 8000)

**Opzione A - Trova e termina processo sulla porta**:
```bash
lsof -ti:8000 | xargs kill -9
```

**Opzione B - Kill per nome processo**:
```bash
pkill -f "manage.py runserver"
```

**Verifica backend terminato**:
```bash
lsof -i :8000
```
✅ Se non ritorna nulla → Backend terminato

---

### 3️⃣ Kill Tutti i Servizi (Frontend + Backend)

```bash
# Kill Frontend
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill Backend  
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Verifica
echo "Verifica porte..."
lsof -i :3000 && echo "❌ Frontend ancora attivo" || echo "✅ Frontend terminato"
lsof -i :8000 && echo "❌ Backend ancora attivo" || echo "✅ Backend terminato"
```

**Kill aggressivo (se i comandi sopra non funzionano)**:
```bash
killall -9 node npm vite 2>/dev/null || true
pkill -9 -f "manage.py runserver" 2>/dev/null || true
```

---

## 🔍 VERIFICA STATO SERVIZI

### Verifica Completa

```bash
echo "=== VERIFICA SERVIZI ==="
echo ""
echo "Frontend (porta 3000):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "❌ Non raggiungibile"
echo ""
echo "Backend (porta 8000):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8000/api/ 2>/dev/null || echo "❌ Non raggiungibile"
echo ""
echo "Processi attivi:"
lsof -i :3000 | grep LISTEN && echo "✅ Frontend attivo su :3000" || echo "❌ Frontend non attivo"
lsof -i :8000 | grep LISTEN && echo "✅ Backend attivo su :8000" || echo "❌ Backend non attivo"
```

### Verifica Processi

```bash
# Verifica processi Node/NPM (Frontend)
ps aux | grep -i "vite\|npm" | grep -v grep

# Verifica processi Python/Django (Backend)
ps aux | grep -i "python.*manage.py\|runserver" | grep -v grep

# Verifica porte in uso
lsof -i :3000
lsof -i :8000
```

---

## 🐛 TROUBLESHOOTING

### Problema: Porta già in uso

**Frontend (3000)**:
```bash
# Trova cosa usa la porta 3000
lsof -i :3000

# Termina il processo
lsof -ti:3000 | xargs kill -9

# Riavvia
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend && npm run dev
```

**Backend (8000)**:
```bash
# Trova cosa usa la porta 8000
lsof -i :8000

# Termina il processo
lsof -ti:8000 | xargs kill -9

# Riavvia
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend && source venv/bin/activate && python manage.py runserver 8000
```

---

### Problema: Modulo Python non trovato

```bash
# Verifica virtual environment attivo
which python
# Dovrebbe mostrare: /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend/venv/bin/python

# Se non attivo, attiva venv
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend
source venv/bin/activate

# Reinstalla dipendenze se necessario
pip install -r requirements.txt
```

---

### Problema: Migrations non applicate

```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend
source venv/bin/activate

# Verifica migrations
python manage.py showmigrations

# Applica migrations
python manage.py migrate

# Riavvia backend
python manage.py runserver 8000
```

---

### Problema: Errori CORS

Se vedi errori CORS nella console del browser:

1. Verifica che backend sia attivo su porta 8000
2. Controlla `core/settings.py` → `CORS_ALLOWED_ORIGINS`
3. Dovrebbe includere: `http://localhost:3000`

---

### Problema: File statici non caricati (Frontend)

```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend

# Verifica che node_modules esista
ls node_modules

# Se manca, reinstalla
npm install

# Pulisci cache e riavvia
rm -rf node_modules/.vite
npm run dev
```

---

## 📊 COMANDI RAPIDI

### Script One-Liner Completo

**Avvio tutto**:
```bash
# Terminal 1
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend && npm run dev

# Terminal 2  
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend && source venv/bin/activate && python manage.py runserver 8000
```

**Kill tutto**:
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true && lsof -ti:8000 | xargs kill -9 2>/dev/null || true && echo "✅ Tutti i servizi terminati"
```

**Restart tutto**:
```bash
# Kill
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 2

# Avvia Frontend (in background)
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend && npm run dev > /tmp/frontend.log 2>&1 &

# Avvia Backend (in background)
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend && source venv/bin/activate && python manage.py runserver 8000 > /tmp/backend.log 2>&1 &

# Attendi avvio
sleep 5

# Verifica
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"
echo "Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/)"
```

---

## 📝 LOG FILES

### Visualizza log in tempo reale

**Frontend**:
```bash
# Se avviato in background con redirect
tail -f /tmp/frontend.log

# Altrimenti log è visibile nel terminal
```

**Backend**:
```bash
# Se avviato in background
tail -f /tmp/backend.log

# Log Django nel progetto
tail -f /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend/logs/django.log
```

---

## 🔐 Credenziali Demo

### Cliente
- **Email**: `demo@digitalnotary.sm`
- **Password**: `Demo2024`
- **Dashboard**: Dashboard Cliente con selezione notai

### Notaio
- **Email**: `notaio@digitalnotary.sm`
- **Password**: `Notaio2024`
- **Dashboard**: Dashboard Notaio con metriche e attività

---

## ✅ Checklist Pre-Avvio

Prima di avviare i servizi, verifica:

- [ ] Virtual environment Python attivo (`source venv/bin/activate`)
- [ ] Dipendenze Python installate (`pip install -r requirements.txt`)
- [ ] Dipendenze Node installate (`npm install` in frontend/)
- [ ] Migrations applicate (`python manage.py migrate`)
- [ ] Porte 3000 e 8000 libere
- [ ] Database configurato (se necessario)

---

## 📞 Supporto

Se i servizi non si avviano correttamente:

1. Verifica output dei comandi per errori specifici
2. Controlla i log files
3. Prova il restart completo
4. Verifica che non ci siano altri servizi sulle porte 3000/8000

---

**Ultimo aggiornamento**: Ottobre 2025  
**Progetto**: Sportello Notai - Digital Notary Platform

