# Dashboard Notaio - Documentazione

## 📋 Panoramica

La Dashboard Notaio è stata creata seguendo lo stesso layout della Dashboard Cliente, ma con una sezione inferiore personalizzata che mostra:
- **Metriche notarili**: 6 card con statistiche dell'attività
- **Log attività studio**: Timeline delle attività dei collaboratori

## 🎨 Design e Stile

### Consistenza Grafica
Tutti i componenti seguono lo **stile grafico del progetto**:
- Font: `Poppins` (Regular 400, Medium 500, Bold 600, ExtraBold 700)
- Colori: Palette definita in `index.css` (`--color-*`)
- Border Radius: `--radius-lg` (12px), `--radius-md` (8px), `--radius-sm` (6px)
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Spacing: `--spacing-xs/sm/md/lg/xl` (4px/8px/16px/24px/32px)

### Componenti Creati

#### 1. **DashboardNotaio.jsx**
Dashboard principale per il ruolo Notaio.

**Caratteristiche**:
- Layout identico alla Dashboard Cliente nella parte superiore
- Sezione specifica con metriche e attività studio
- Gestione appuntamenti e documenti dalla prospettiva del notaio

**Sezioni**:
- Welcome section con nome notaio
- Calendario mensile
- Appuntamenti del giorno selezionato
- Dettaglio atto notarile
- **Riepilogo attività notarile** (6 card metriche)
- **Attività di studio** (log collaboratori)

#### 2. **NotaryMetrics.jsx**
Componente che mostra 6 card con statistiche dell'attività notarile.

**Metriche visualizzate**:
- Rogito Immobiliare: 451 (+2.11%)
- Costituzioni Societarie: 137 (-3.52%)
- Altri Atti Notarili: 151 (+2.11%)
- Totale Clienti: 675 (+5.78%)
- Totale Aziende: 193 (+2.11%)
- Staff di Studio: 12 (-3.52%)

**Funzionalità**:
- Icone TrendingUp/Down per variazioni positive/negative
- Hover effect con elevazione
- Layout responsive (3 colonne → 2 colonne → 1 colonna)

#### 3. **StudioActivity.jsx**
Componente che mostra il log delle attività dei collaboratori dello studio.

**Caratteristiche**:
- Lista scrollabile di attività
- Avatar iniziale per ogni collaboratore
- Timestamp di ogni attività
- Stato approvazione/rifiuto con icone colorate
- Menu opzioni (three-dots)

**Struttura attività**:
- Data e ora: `Mercoledi 08 Ottobre 22:54`
- Nome collaboratore: `Armando Carli`, `Sandro Pertini`, etc.
- Azione: `Documento Revisionato - Rogito Sig.ra Elena Russo`
- Status: Approvato (✓ verde) o Rifiutato (✗ rosso)

## 🔐 Credenziali Demo

### Cliente
- **Email**: `demo@digitalnotary.sm`
- **Password**: `Demo2024`
- **Dashboard**: Dashboard Cliente con selezione notai

### Notaio
- **Email**: `notaio@digitalnotary.sm`
- **Password**: `Notaio2024`
- **Dashboard**: Dashboard Notaio con metriche e attività studio

## 📂 File Modificati/Creati

### Nuovi File
```
frontend/src/components/
├── DashboardNotaio.jsx        # Dashboard principale notaio
├── DashboardNotaio.css        # Stili dashboard notaio
├── NotaryMetrics.jsx          # 6 card metriche
├── NotaryMetrics.css          # Stili metriche
├── StudioActivity.jsx         # Log attività collaboratori
├── StudioActivity.css         # Stili attività studio
├── Settings.jsx               # Pagina impostazioni con 7 tab
└── Settings.css               # Stili pagina impostazioni
```

### File Modificati
```
frontend/src/
├── App.jsx                    # Aggiunta gestione ruolo e routing
└── components/
    ├── Sidebar.jsx            # Aggiunta prop userRole e pulsante Impostazioni per NOTAIO
    ├── Dashboard.jsx          # Passaggio prop userRole="cliente"
    └── DashboardNotaio.jsx    # Passaggio prop userRole="notaio"
```

## 🎯 Layout Dashboard Notaio

```
┌──────────┬───────────────────────────────────────────────┐
│ Digital  │ Header (Data/Ora, Ricerca, Profilo)          │
│ Notary   ├───────────────────────────────────────────────┤
│          │                                               │
│ ◉ Dashb. │ Benvenuto Francesco Spada        [Nuovo]     │
│ ○ Docum. │                                               │
│ ○ Messag.├──────────┬──────────────┬─────────────────────┤
│ ⚙ Imposta│Calendario│ Appuntamenti │  Dettaglio Atto    │
│          │          │  del giorno  │  Notarile          │
│          │ Ottobre  │              │                    │
│          │  2025    │  • Rogito    │ Sig.ra Elena Russo │
│          │          │  • Consulenz.│ Piazza Cavour 11/A │
│          │ [Giorni] │  • Documento │ 156mq | 5 stanze   │
│          │          │  • [Vuoto]   │ Venditore: L.Rossi │
│          │          │              │ Documenti 11/14    │
│          ├──────────┴──────────────┴─────────────────────┤
│          │                                               │
│  Logout  │ Riepilogo Attività Notarile                  │
│          ├──────────────────────────────┬────────────────┤
│          │                              │Attività Studio │
│          │ ┌──────┐ ┌──────┐ ┌──────┐  │                │
│          │ │ 451  │ │ 137  │ │ 151  │  │ Mer 08 22:54  │
│          │ │+2.11%│ │-3.52%│ │+2.11%│  │ 👤 A. Carli   │
│          │ │Rogiti│ │Costit│ │Altri │  │ Doc Rev... ✓  │
│          │ └──────┘ └──────┘ └──────┘  │                │
│          │                              │ Mer 08 22:54  │
│          │ ┌──────┐ ┌──────┐ ┌──────┐  │ 👤 S.Pertini  │
│          │ │ 675  │ │ 193  │ │  12  │  │ Doc Rev... ✓  │
│          │ │+5.78%│ │+2.11%│ │-3.52%│  │                │
│          │ │Client│ │Aziend│ │Staff │  │ ...altre att. │
│          │ └──────┘ └──────┘ └──────┘  │                │
└──────────┴──────────────────────────────┴────────────────┘
```

**Nota**: Il pulsante ⚙ Impostazioni appare SOLO nella sidebar del NOTAIO.

## 🚀 Come Testare

### 1. Avvia il frontend
```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/frontend
npm run dev
```

### 2. Login come Notaio
- Inserisci: `notaio@digitalnotary.sm`
- Password: `Notaio2024`

### 3. Esplora la Dashboard
- ✅ Calendario con appuntamenti evidenziati
- ✅ Clicca su una data per vedere gli appuntamenti
- ✅ Seleziona un appuntamento per vedere i dettagli
- ✅ Visualizza le 6 card metriche con trend
- ✅ Scorri il log attività collaboratori
- ✅ **Click su "Impostazioni"** nella sidebar per accedere alla pagina di configurazione
- ✅ Esplora tutti i **7 tab** di impostazioni
- ✅ Click sulla **X** per tornare alla dashboard

### 4. Confronta con Dashboard Cliente
- Logout
- Login come Cliente: `demo@digitalnotary.sm` / `Demo2024`
- Nota le differenze: card notai vs metriche/attività

## 📊 Differenze Dashboard Cliente vs Notaio

| Caratteristica | Cliente | Notaio |
|---------------|---------|---------|
| **Sezione superiore** | Identica | Identica |
| **Calendario** | ✅ | ✅ |
| **Appuntamenti** | ✅ | ✅ |
| **Dettaglio atto** | ✅ | ✅ |
| **Card notai** | ✅ | ❌ |
| **Metriche attività** | ❌ | ✅ (6 card) |
| **Log collaboratori** | ❌ | ✅ |

## 🎨 Variabili CSS Utilizzate

```css
/* Colori */
--color-white: #FFFFFF
--color-text-primary: #343A40
--color-text-secondary: #6C757D
--color-bg-main: #F8F9FA
--color-border: #E9ECEF
--color-light-blue: #4FADFF
--color-lavender: #B0BAD3

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Border Radius */
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 50%

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06)
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.1)

/* Typography */
--font-family: 'Poppins', sans-serif
```

## 🔄 Responsive Design

### Desktop (> 1400px)
- Layout completo a 3 colonne (calendario, appuntamenti, dettaglio)
- Metriche: 3 colonne
- Attività: colonna destra

### Tablet (768px - 1400px)
- Layout a 2 colonne
- Dettaglio atto su riga separata
- Metriche: 2 colonne
- Attività: sotto metriche

### Mobile (< 768px)
- Layout a colonna singola
- Metriche: 1 colonna
- Tutti gli elementi impilati verticalmente

## ✅ Checklist Implementazione

- [x] Dashboard Notaio con layout identico a Cliente
- [x] Componente NotaryMetrics (6 card)
- [x] Componente StudioActivity (log collaboratori)
- [x] Stili consistenti con design system
- [x] Uso variabili CSS del progetto
- [x] Font Poppins su tutti gli elementi
- [x] Hover effects e transizioni
- [x] Responsive design
- [x] Gestione ruoli in App.jsx
- [x] Credenziali demo Notaio
- [x] Sidebar differenziata per ruolo
- [x] Pulsante "Impostazioni" per Notaio
- [x] Pagina Impostazioni con 8 tab funzionali
- [x] Tab Vetrina per configurazione profilo pubblico
- [x] Navigazione Impostazioni funzionante
- [x] Zero errori linting

## ⚙️ Pagina Impostazioni Notaio

### Struttura a Tab
La pagina Impostazioni è organizzata in **8 tab orizzontali** con:
- **Header** identico alle altre pagine (logo, data/ora, ricerca, profilo)
- **Titolo e sottotitolo** della pagina
- **Tab orizzontali** in alto per navigare tra le sezioni
- **Contenuto della tab attiva** visualizzato sotto

#### **Tab 0: Generali** 🏢
Configurazione base dello studio notarile:
- **Informazioni Studio**: Nome, P.IVA, Indirizzo, Telefono, Email, Sito Web, Codice Fiscale
- **Preferenze Interfaccia**: Lingua, Fuso orario, Formato Data, Valuta Predefinita
- **Notifiche**: Notifiche desktop, Notifiche email, Modalità scura

#### **Tab 1: Vetrina** 🏪
Configurazione del profilo pubblico visibile ai clienti:
- **Profilo Pubblico**:
  - Upload foto profilo (JPG/PNG, max 5MB)
  - Nome pubblico
  - Titolo professionale
  - Descrizione breve dello studio e specializzazioni
  - Anni di esperienza
  - Lingue parlate
- **Servizi Offerti** (con checkbox e icone per attivazione):
  - 📁 Documenti Condivisi (condivisione e gestione documenti in cloud)
  - 📅 Agenda per Appuntamenti Automatica (prenotazione appuntamenti online)
  - 💬 Sistema di Chat, Audio e Video (comunicazione multicanale)
  - ✍️ Atti in Presenza o Digitali (gestione atti notarili fisici e digitali)
  - 🔏 Firma Digitale (servizi di firma digitale remota)
  - 📧 PEC (posta elettronica certificata integrata)
  - 📦 Conservazione (conservazione sostitutiva documenti)
- **Disponibilità Studio**:
  - Mostra disponibilità in tempo reale
  - Accetta appuntamenti online
  - Tempo medio di risposta (24h/48h/72h)
  - Visibilità profilo (Pubblico/Solo clienti esistenti)

#### **Tab 2: Imposta Agenda** 📅
Gestione calendario e appuntamenti con fasce orarie multiple:
- **Orari di Lavoro** (multipli):
  - Fascia 1: 09:00 - 12:00 (Lun, Mar, Mer)
  - Fascia 2: 15:00 - 18:00 (Gio, Ven)
  - Fascia 3: 10:00 - 13:00 (Sab)
  - Possibilità di aggiungere/rimuovere fasce orarie
  - Selezione giorni con pill interattive
- **Configurazione Slot**: Durata slot (15/30/45/60 minuti)
- **Festività e Chiusure**:
  - Toggle per festività italiane
  - Toggle per festività di San Marino
  - Chiusure personalizzate (es. Natale, Ferie estive)
  - Possibilità di aggiungere/rimuovere chiusure
- **Tipologie Appuntamento** (compatte):
  - Rogito Notarile (90 min)
  - Consulenza (45 min)
  - Revisione Documenti (30 min)
  - Possibilità di aggiungere/modificare tipologie

#### **Tab 3: Staff** 👥
Gestione team e permessi:
- **Membri del Team**: Lista collaboratori con avatar, ruolo e stato (Attivo/Inattivo)
  - Armando Carli (Praticante Notaio)
  - Sandro Pertini (Segretario)
  - Maria Rossi (Assistente)
  - Giuseppe Bianchi (Praticante - Inattivo)
- **Ruoli e Permessi**: Card con permessi per ogni ruolo
  - Praticante Notaio: visualizza/modifica documenti, gestione appuntamenti
  - Segretario: gestione agenda, caricamento documenti

#### **Tab 4: Firma Digitale** 🔐
Configurazione firma digitale e certificati:
- **Certificati Installati**: 
  - Francesco Spada - Firma Qualificata (valido fino 15/12/2025)
  - Francesco Spada - Firma Avanzata (valido fino 28/03/2026)
- **Dispositivi di Firma**: Token USB, Smart Card, HSM Remoto, Firma Cloud
- **Provider**: Aruba PEC, InfoCert, Poste Italiane
- **Impostazioni Avanzate**: 
  - Formato firma (PAdES, CAdES, XAdES)
  - Livello firma (Basic, Timestamp, LTV)
  - Opzioni PIN e marca temporale

#### **Tab 5: PEC** 📧
Gestione Posta Elettronica Certificata:
- **Account PEC**: `notaio.spada@pec.digitalnotary.sm`
  - Statistiche: 12 ricevute oggi, 8 inviate, 2.3GB/5GB utilizzati
- **Regole Automatiche**:
  - Scarica ricevute di consegna automaticamente
  - Allega ricevuta PEC agli atti correlati
  - Archiviazione dopo 90 giorni
  - Notifiche nuove PEC
- **Filtri e Classificazione**: 
  - Atti Notarili (oggetto contiene "Rogito" o "Atto")
  - Conservazione (da conservazione@*)

#### **Tab 6: Conservazione** 📦
Conservazione sostitutiva digitale:
- **Provider Conservazione**: Aruba, InfoCert, Namirial, Custom
- **Regole di Conservazione**:
  - Atti Notarili → 50 anni (automatica)
  - Documenti Identificazione → 10 anni (manuale)
  - Ricevute PEC → 10 anni (automatica)
  - Fatture → 10 anni (automatica)
- **Statistiche**: 
  - 1,234 documenti conservati
  - 12.5 GB occupati
  - Ultimo pacchetto: 15/10/2025
  - Stato: Attivo ✅

#### **Tab 7: Modelli** 📄
Gestione template documentali:
- **Modelli Disponibili** (6 card):
  - Atto di Compravendita Immobiliare (145 utilizzi)
  - Costituzione Società (67 utilizzi)
  - Procura Notarile (89 utilizzi)
  - Testamento Olografo (23 utilizzi)
  - Donazione (34 utilizzi)
  - Mutuo Ipotecario (112 utilizzi)
- **Impostazioni Modelli**:
  - Formato predefinito (.docx, .odt, PDF)
  - Intestazione predefinita
  - Logo studio nei modelli
  - Numerazione automatica atti

### Design e UX
- **Tab orizzontali** in alto con icone e indicatore blu per tab attivo
- **Border-bottom blu** per tab selezionata
- **Hover states** su tutti gli elementi interattivi
- **Card e sezioni** con ombreggiature leggere
- **Toggle switches** per opzioni on/off
- **Pulsanti azione** in fondo ad ogni tab (Annulla / Salva)
- **Responsive** su mobile/tablet con scroll orizzontale delle tab
- **Header consistente** con tutte le altre pagine

### Navigazione
- Click su **"Impostazioni"** nella sidebar principale → Apre pagina Settings
- La sidebar principale mostra **quale vista è attiva** (Dashboard o Impostazioni)
- Le tab orizzontali permettono di **navigare tra le sezioni** delle impostazioni
- **Tutte le funzionalità dell'header** (ricerca, profilo) rimangono disponibili

## 🎛️ Differenze Sidebar per Ruolo

### Dashboard Cliente
- Dashboard
- Documenti
- Messaggi
- Logout

### Dashboard Notaio
- Dashboard
- Documenti
- Messaggi
- **Impostazioni** ⚙️ (solo per Notaio)
- Logout

La sidebar è ora **differenziata per ruolo**: il pulsante "Impostazioni" appare solo per gli utenti con ruolo `NOTAIO`. Questo permette ai notai di accedere a configurazioni specifiche del loro studio e gestire impostazioni avanzate non disponibili ai clienti.

## 🎯 Prossimi Sviluppi

1. **Integrazione Backend**: Collegare le metriche e le impostazioni ai dati reali dal database
2. **Filtri temporali**: Aggiungere periodo (settimana, mese, anno) per metriche
3. **Dettaglio attività**: Modal con dettagli completi attività collaboratori
4. **Export report**: Esportazione PDF/Excel delle statistiche
5. **Notifiche real-time**: WebSocket per aggiornamenti attività in tempo reale
6. **Grafici**: Chart.js per visualizzazione trend storici
7. **Persistenza Impostazioni**: Salvare le configurazioni nel database
8. **Upload Logo**: Permettere caricamento logo studio nelle impostazioni
9. **Editor Modelli**: Implementare editor visuale per i modelli documentali

## 📝 Note Tecniche

- Tutte le metriche sono attualmente hardcoded per demo
- Log attività usa dati statici
- Avatar collaboratori generati da iniziali
- Trend percentuali sono valori demo
- Icone da `lucide-react`

