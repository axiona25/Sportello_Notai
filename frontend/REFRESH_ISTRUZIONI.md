# 🔄 ISTRUZIONI REFRESH BROWSER

## Il contatore mostra ancora 4/3?

Devi fare un **HARD REFRESH** per caricare il nuovo codice JavaScript:

### Chrome / Edge / Brave (Windows/Linux):
```
Ctrl + Shift + R
oppure
Ctrl + F5
```

### Chrome / Edge / Brave (Mac):
```
Cmd + Shift + R
oppure
Shift + Cmd + Delete (e poi cancella cache)
```

### Safari (Mac):
```
Cmd + Option + E (svuota cache)
poi
Cmd + R (ricarica)
```

### Firefox:
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 🎯 Cosa vedrai dopo il refresh:

✅ **Contatore corretto: 3/3** (invece di 4/3)

✅ **Due cartelle nella AppointmentRoom:**
- 📁 **Documenti Cliente** (3 documenti)
- 📁 **Documenti di Studio** (1 documento Word - Template)

✅ **Nel log console:**
```
📊 Conteggio documenti (Notaio): 
  totale: "3 (esclusi documenti Studio)"
  caricati: 4
  approvati: 4
```

---

## Se il problema persiste:

1. **Apri DevTools** (F12)
2. **Network tab** → Spunta "Disable cache"
3. **Application tab** → "Clear storage" → "Clear site data"
4. **Ricarica la pagina**

