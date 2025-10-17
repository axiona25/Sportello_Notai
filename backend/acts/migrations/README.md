# Migrazioni Categorie Atti Notarili

## 📋 Descrizione

Queste migrazioni creano le tabelle per gestire le categorie degli atti notarili della Repubblica di San Marino, basate sul "Breve Formulario degli Atti Notarili della Repubblica di San Marino" (2009).

## 🗂️ Tabelle Create

### 1. `notarial_act_main_categories`
Categorie principali (8 categorie):
- PROCURE
- ATTI RELATIVI ALLE PERSONE E ALLA FAMIGLIA
- SUCCESSIONI E DONAZIONI
- PROPRIETÀ E COMPRAVENDITE IMMOBILIARI
- OBBLIGAZIONI E CONTRATTI
- SOCIETÀ
- FORMALITÀ E TUTELA
- NORME SPECIALI

### 2. `notarial_act_categories`
Sottocategorie specifiche (40+ tipologie di atti notarili)

## 🚀 Come Applicare la Migrazione

### Opzione 1: Usando psql (Raccomandato)

```bash
# Connettiti al database PostgreSQL
psql -U your_username -d sportello_notai

# Esegui lo script SQL
\i /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend/acts/migrations/add_notarial_categories.sql
```

### Opzione 2: Da riga di comando

```bash
psql -U your_username -d sportello_notai -f /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend/acts/migrations/add_notarial_categories.sql
```

### Opzione 3: Usando Django (quando GDAL sarà configurato)

```bash
cd /Users/r.amoroso/Documents/Cursor/Sportello_Notai/backend
source venv/bin/activate
python manage.py makemigrations acts
python manage.py migrate acts
python manage.py populate_act_categories
```

## ✅ Verifica

Dopo aver applicato la migrazione, verifica che le tabelle siano state create:

```sql
-- Verifica categorie principali
SELECT * FROM notarial_act_main_categories ORDER BY "order";

-- Verifica sottocategorie
SELECT 
    mc.name as categoria_principale,
    c.name as sottocategoria,
    c.requires_property,
    c.requires_bank
FROM notarial_act_categories c
JOIN notarial_act_main_categories mc ON c.main_category_id = mc.id
ORDER BY mc."order", c."order";

-- Conta totali
SELECT 
    'Categorie Principali' as tipo, COUNT(*) as totale 
FROM notarial_act_main_categories
UNION ALL
SELECT 
    'Sottocategorie' as tipo, COUNT(*) as totale 
FROM notarial_act_categories;
```

## 📊 Statistiche Attese

- **Categorie Principali**: 8
- **Sottocategorie**: 40+
- **Categorie con requisito immobile**: 15
- **Categorie con requisito banca**: 8

## 🔧 Note Tecniche

- Lo script usa `ON CONFLICT DO NOTHING` per essere idempotente (può essere eseguito più volte senza errori)
- Include trigger automatici per aggiornare il campo `updated_at`
- Tutti i vincoli di integrità referenziale sono configurati con `ON DELETE CASCADE`

