# 🧪 Guida Test Slot Dinamici - Prenotazione Appuntamenti

## ✅ Configurazione Durate

Ho impostato **4 durate diverse** distribuite sulle 41 tipologie:

### ⏱️ **30 MINUTI** (10 atti - Pagina 1)
1. Procura generale
2. Procura speciale a vendere immobile
3. Autenticazione di firma
4. Atto di notorietà per contrarre matrimonio
5. Opzione di regime patrimoniale
6. Testamento pubblico
7. Testamento segreto
8. Testamento olografo
9. Pubblicazione di testamento
10. Revoca di testamento

### ⏱️ **60 MINUTI** (10 atti - Pagina 1-2)
11. Accettazione di eredità
12. Rinuncia all'eredità
13. Inventario
14. Donazione di beni immobili
15. Donazione di beni mobili
16. Cessione a titolo di antiparte di quota di immobile
17. Compravendita di beni immobili
18. Compravendita immobiliare con benefici prima casa
19. Permuta
20. Cessione di quote ereditarie indivise di bene immobile

### ⏱️ **90 MINUTI** (10 atti - Pagina 2-3)
21. Divisione di bene immobile
22. Locazione finanziaria (leasing)
23. Riscatto di locazione finanziaria
24. Contratto di locazione (affitto) di immobile
25. Contratto di comodato
26. Contratto di mutuo con iscrizione di ipoteca
27. Contratto di mutuo senza iscrizione di ipoteca
28. Cancellazione di ipoteca
29. Accollo di debito
30. Atto costitutivo e statuto di società per azioni (S.p.A.)

### ⏱️ **120 MINUTI** (11 atti - Pagina 3-4)
31. Atto costitutivo e statuto di società a responsabilità limitata (S.r.l.)
32. Verbale di assemblea di società
33. Cessione di quote di società a responsabilità limitata
34. Scioglimento e messa in liquidazione di società
35. Trascrizioni
36. Iscrizioni
37. Dichiarazione giurata
38. Rilascio di copie e certificazione di conformità
39. Scrittura privata autenticata
40. Vendita di autoveicolo
41. Compravendita di imbarcazione

---

## 🧪 Come Testare

### 1️⃣ **Login Cliente**
```
Email: cliente@example.com
Password: password123
```

### 2️⃣ **Avvia Prenotazione**
- Dashboard Cliente → Clicca su card notaio
- "Prenota Appuntamento"

### 3️⃣ **Step 1: Testa le Durate**

#### Test A: 30 minuti
1. **Seleziona**: "Procura generale" (card #1, pagina 1)
2. **Verifica badge**: Deve mostrare "30 min"
3. **Vai a Step 2**
4. **Console (F12)**:
   ```
   📅 Calendario caricato con durata: 30 minuti
   🔍 Carico slot per ... con durata 30 minuti
   ```
5. **Controlla slot**: Dovrebbero essere ogni 30 minuti
   ```
   09:00 - 09:30
   09:30 - 10:00
   10:00 - 10:30
   10:30 - 11:00
   ```

#### Test B: 60 minuti
1. **Torna indietro** (freccia ← o "Indietro")
2. **Pagina 1**: Seleziona "Accettazione di eredità" (card #11)
3. **Verifica badge**: "60 min"
4. **Step 2 → Console**:
   ```
   📅 Calendario caricato con durata: 60 minuti
   ```
5. **Slot attesi**:
   ```
   09:00 - 10:00
   10:00 - 11:00
   11:00 - 12:00
   ```

#### Test C: 90 minuti
1. **Torna Step 1**
2. **Naviga a Pagina 2** (freccia →)
3. **Seleziona**: "Divisione di bene immobile" (card #21)
4. **Verifica badge**: "90 min"
5. **Step 2 → Slot attesi**:
   ```
   09:00 - 10:30
   10:30 - 12:00
   12:00 - 13:30
   ```

#### Test D: 120 minuti (2 ore)
1. **Torna Step 1**
2. **Naviga a Pagina 4** (freccia → più volte)
3. **Seleziona**: "S.r.l." (card #31)
4. **Verifica badge**: "120 min"
5. **Step 2 → Slot attesi**:
   ```
   09:00 - 11:00
   11:00 - 13:00
   14:00 - 16:00
   ```

---

## 🎯 Cosa Verificare

### ✅ Checklist Test

#### Step 1 - Selezione Tipologia
- [ ] Badge mostra durata corretta per ogni atto
- [ ] Paginazione funziona (← e →)
- [ ] Puoi selezionare/deselezionare card (toggle)
- [ ] Bottone "Avanti" attivo solo con selezione

#### Step 2 - Calendario
- [ ] Console mostra: `📅 Calendario caricato con durata: X minuti`
- [ ] API chiamata con parametro `duration=X`
- [ ] Slot generati ogni X minuti
- [ ] Nessun sovrapposizione con appuntamenti esistenti
- [ ] Slot fuori orario lavorativo non mostrati

#### Step 3 & 4 - Conferma
- [ ] Riepilogo mostra durata corretta
- [ ] Slot selezionato rispetta la durata
- [ ] Appuntamento creato con durata corretta

---

## 🐛 Troubleshooting

### Problema: Tutti gli slot sono da 60 minuti
**Causa:** Cache frontend

**Soluzione:**
1. Hard refresh: `Ctrl+Shift+R` (o `Cmd+Shift+R` su Mac)
2. Chiudi e riapri il wizard
3. Verifica console: `✅ Card configurate: 41`

### Problema: Slot non disponibili
**Causa:** Notaio non ha configurato orari

**Soluzione:**
1. Login come notaio (`francesco.spadi@notaio.sm` / `password123`)
2. Impostazioni → Tab "Agenda"
3. Configura orari lavorativi (es: 09:00-13:00, 14:00-18:00)
4. Salva

### Problema: Errore 400 su prenotazione
**Causa:** Campo `tipologia_atto` mancante

**Verifica:**
- Console → Network → Payload deve includere:
  ```json
  {
    "tipologia_atto": 1,
    "notary": "...",
    "start_time": "...",
    ...
  }
  ```

---

## 📊 Verifica Database

Per controllare le durate nel database:

```bash
cd backend
python manage.py shell -c "
from acts.models import NotarialActCategory

for durata in [30, 60, 90, 120]:
    count = NotarialActCategory.objects.filter(
        estimated_duration_minutes=durata
    ).count()
    print(f'{durata} min: {count} atti')
"
```

**Output atteso:**
```
30 min: 10 atti
60 min: 10 atti
90 min: 10 atti
120 min: 11 atti
```

---

## 🎬 Esempio Completo

### Scenario: Prenotare S.r.l. (120 minuti)

```
1. Login cliente
2. Dashboard → Card Notaio Spadi → "Prenota Appuntamento"

Step 1:
  - Clicca freccia → fino a Pagina 4
  - Seleziona "Atto costitutivo ... S.r.l."
  - Badge mostra "120 min" ✅
  - Clicca "Avanti"

Step 2:
  - Console: "📅 Calendario caricato con durata: 120 minuti" ✅
  - Calendario mostra slot ogni 2 ore
  - Seleziona slot: 09:00-11:00
  - Clicca "Avanti"

Step 3:
  - (Opzionale) Seleziona modalità
  - Clicca "Avanti"

Step 4:
  - Verifica riepilogo:
    • Tipologia: S.r.l.
    • Durata: 120 min ✅
    • Slot: 09:00-11:00 ✅
  - Clicca "Conferma Appuntamento"

Risultato:
  ✅ Toast: "Appuntamento Prenotato!"
  ✅ Appuntamento creato con durata 120 min
  ✅ Notaio riceve notifica
```

---

**Configurato il:** 21 Ottobre 2025  
**Durate Test:** 30/60/90/120 minuti  
**Distribuzione:** 10+10+10+11 atti

