# UI Elements App

Django app per gestire elementi UI (loghi, icone, elementi decorativi) nel database.

## 📋 Modello

### Element
Tabella: `elements`

Campi:
- `id` (UUID): Primary key
- `name` (String): Nome univoco dell'elemento
- `type` (Choice): Tipo (logo, icon, decorative, svg, image)
- `description` (Text): Descrizione opzionale
- `svg_content` (Text): Contenuto SVG per elementi vettoriali
- `image_url` (String): URL o path per immagini bitmap
- `width` (Integer): Larghezza in pixel
- `height` (Integer): Altezza in pixel
- `primary_color` (String): Colore primario (hex code)
- `secondary_color` (String): Colore secondario (hex code)
- `location` (String): Dove viene usato (es. 'sidebar.logo')
- `is_active` (Boolean): Stato attivo
- `created_at` (DateTime): Data creazione
- `updated_at` (DateTime): Data aggiornamento

## 🚀 Setup Database

### Opzione 1: Django Migrations
```bash
cd backend
python manage.py makemigrations ui_elements
python manage.py migrate ui_elements
```

### Opzione 2: SQL Diretto
```bash
psql -U postgres -d sportello_notai -f backend/ui_elements/migrations/0001_initial.sql
```

## 📡 API Endpoints

Base URL: `/api/ui/`

### List Elements
```
GET /api/ui/elements/
```

Query parameters:
- `type`: Filtra per tipo
- `location`: Filtra per location

### Get Single Element
```
GET /api/ui/elements/{id}/
```

### Create Element (Admin only)
```
POST /api/ui/elements/
{
  "name": "Element Name",
  "type": "svg",
  "svg_content": "<svg>...</svg>",
  "width": 100,
  "height": 50,
  "primary_color": "#4FADFF",
  "location": "header.logo"
}
```

### Update Element (Admin only)
```
PUT /api/ui/elements/{id}/
PATCH /api/ui/elements/{id}/
```

### Delete Element (Admin only)
```
DELETE /api/ui/elements/{id}/
```

## 🎨 Elementi Attuali

### Digital Notary Underline
- **Name**: Digital Notary Underline
- **Type**: decorative
- **Dimensions**: 79 × 7px
- **Color**: #4FADFF (azzurro chiaro)
- **Location**: sidebar.logo
- **SVG**: Curva decorativa sotto il logo

## 🔧 Admin Interface

L'app è registrata nel Django Admin:
```
/admin/ui_elements/element/
```

Funzionalità:
- Visualizzazione lista elementi
- Filtri per tipo, stato, data
- Ricerca per nome, descrizione, location
- Modifica/Creazione elementi
- Preview SVG

## 💡 Utilizzo Frontend

```javascript
// Fetch element
const response = await fetch('/api/ui/elements/?location=sidebar.logo');
const elements = await response.json();

// Use SVG
const underline = elements.find(e => e.name === 'Digital Notary Underline');
<div dangerouslySetInnerHTML={{__html: underline.svg_content}} />
```

## 🔒 Permissions

- **Read**: Tutti (anche non autenticati)
- **Create/Update/Delete**: Solo admin/staff

---

**Creato**: 2025-01-17
**Ultimo aggiornamento**: 2025-01-17

