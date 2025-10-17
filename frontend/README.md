# Digital Notary - Dashboard Frontend

Dashboard completa per il sistema Sportello Notai, clonata dal design Figma con precisione pixel-perfect.

## 🎨 Design Fidelity

Questa dashboard è stata sviluppata per essere **identica** al design Figma, rispettando:

- ✅ **UI/UX**: Layout, spaziature, proporzioni
- ✅ **CSS**: Rounded corners, shadows, borders
- ✅ **Font**: Poppins (Regular, Medium, Semi-bold, Bold)
- ✅ **Palette Colori**: Esatta corrispondenza con i codici hex
- ✅ **Icone**: Line-based icons usando Lucide React
- ✅ **Interazioni**: Hover states, active states, transizioni

## 🎨 Palette Colori

```css
--color-black: #000000
--color-dark-blue: #0F1527
--color-light-gray: #BFBFBF
--color-medium-gray: #B4BAC5
--color-light-blue: #4FADFF
--color-lavender: #B0BAD3
--color-white: #FFFFFF
--color-dark-gray: #404143
--color-very-light-blue: #B2E4F1
--color-primary-blue: #007BFF
```

## 📦 Installazione

```bash
cd frontend
npm install
```

## 🚀 Avvio

### Development Mode
```bash
npm run dev
```

Il frontend sarà disponibile su: `http://localhost:3000`

### Build Production
```bash
npm run build
npm run preview
```

## 📁 Struttura Componenti

```
src/
├── components/
│   ├── Dashboard.jsx         # Container principale
│   ├── Sidebar.jsx           # Navigazione laterale
│   ├── Header.jsx            # Header con search e user info
│   ├── Calendar.jsx          # Calendario interattivo
│   ├── AppointmentCard.jsx   # Card per appuntamenti
│   ├── DeedDetailCard.jsx    # Card dettaglio atto notarile
│   └── NotarySelection.jsx   # Sezione selezione notai
├── App.jsx
├── main.jsx
└── index.css                 # Variabili CSS globali
```

## 🎯 Componenti Principali

### Dashboard
- Layout responsive con sidebar, header e content area
- Grid layout per organizzazione contenuti
- Sezione welcome personalizzata

### Sidebar
- Navigazione principale (Dashboard, Documenti, Messaggi)
- Logo Digital Notary con underline
- Logout button
- Active state indicator

### Header
- Data e ora corrente
- Localizzazione (San Marino)
- Search bar
- Notifiche
- User profile con dropdown
- Button "Nuovo"

### Calendar
- Calendario mensile interattivo
- Navigazione mesi (prev/next)
- Selezione data
- Evidenziazione data selezionata

### Appointment Cards
- Card documenti con deadline
- Card appuntamenti con dettagli
- Card "nessun appuntamento"
- Active state con border blu

### Deed Detail Card
- Informazioni atto notarile
- Dati notaio e proprietà
- Status indicators (Documenti, PEC, Firma Digitale, Video Conferenza)
- Button "Entra" per accedere

### Notary Selection
- Carousel orizzontale di notai
- Card con foto, nome, indirizzo
- Rating con stelle
- Icone servizi offerti

## 🎨 Font

Il font **Poppins** viene caricato da Google Fonts con i seguenti pesi:
- Regular (400)
- Medium (500)
- Semi-bold (600)
- Bold (700)

## 🔧 Tecnologie

- **React 18.3**: Library principale
- **Vite 5.1**: Build tool e dev server
- **Lucide React**: Libreria icone line-based
- **CSS Variables**: Per gestione temi e colori

## 📱 Responsive Design

La dashboard è completamente responsive con breakpoints:
- Desktop: > 1400px (layout completo a 3 colonne)
- Tablet: 768px - 1400px (layout a 2 colonne)
- Mobile: < 768px (layout a 1 colonna)

## 🎭 Interazioni

- **Hover effects**: Su cards, buttons, navigation items
- **Active states**: Sidebar navigation, calendar dates
- **Smooth transitions**: Tutti gli elementi interattivi
- **Box shadows**: Elevazione delle cards al hover

## 🔗 Integrazione Backend

Il frontend è configurato per comunicare con il backend Django su `http://localhost:8000`.
Le chiamate API vengono proxate automaticamente da Vite.

## 📝 Note

- Tutte le immagini degli utenti utilizzano placeholder da Unsplash
- I dati sono attualmente statici/mock
- Pronto per integrazione con API REST del backend Django
- Ottimizzato per performance con lazy loading e code splitting

## 🚀 Next Steps

1. Integrare autenticazione JWT
2. Collegare API backend per dati reali
3. Implementare routing con React Router
4. Aggiungere gestione stato globale (Context API o Redux)
5. Implementare real-time updates con WebSocket
6. Aggiungere testing (Jest + React Testing Library)

---

**Sviluppato con ❤️ seguendo esattamente il design Figma**

