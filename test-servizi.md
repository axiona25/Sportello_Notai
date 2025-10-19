# TEST SERVIZI VETRINA - PROCEDURA

## 1. Login come NOTAIO
- Email: notaio@digitalnotary.sm
- Password: Notaio2024
- Console Browser: APERTA (F12 → Console)

## 2. Vai in Impostazioni
- Clicca icona ingranaggio (⚙️) nella sidebar
- Clicca tab "Vetrina"

## 3. Modifica Servizi
- Clicca "Modifica" (bottone in basso a destra)
- **TOGLI 4 CHECK** (disabilita: PEC, Conservazione, Atti, Firma Digitale)
- **LASCIA 3 CHECK** (Documents, Agenda, Chat)

## 4. Salva
- Clicca "Salva Modifiche"

## 5. Verifica Console
Devi vedere questi log:
```
🔄 Toggle servizio pec: true -> false
🔄 Toggle servizio conservation: true -> false
🔄 Toggle servizio acts: true -> false
🔄 Toggle servizio signature: true -> false
💾 Salvando vetrina con servizi: {...}
✅ Vetrina salvata: {...}
📡 Emettendo evento notaryProfileUpdated
```

## 6. Vai Dashboard Cliente
- Fai Logout
- Login come cliente: cliente@example.com / Cliente2024
- Vai nella sezione "Notai Disponibili"

## 7. Verifica nella Console
Devi vedere:
```
📋 Profili caricati: [...]
🔧 Servizi profilo 1: {...}
✅ Servizi ABILITATI: ['documents', 'agenda', 'chat']
📊 Totale abilitati: 3
🎨 Rendering 3 servizi per Francesco Spada: ['documents', 'agenda', 'chat']
```

## 8. Verifica Card Vetrina
La card deve mostrare SOLO 3 icone servizi (non 7)

---

INVIA QUI TUTTI I LOG DELLA CONSOLE DA ENTRAMBI I PASSAGGI!
