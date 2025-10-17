-- Migration: Add Notarial Act Categories Tables
-- Repubblica di San Marino - Based on "Breve Formulario degli Atti Notarili della Repubblica di San Marino" (2009)

-- Create Main Categories Table
CREATE TABLE IF NOT EXISTS notarial_act_main_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on order for sorting
CREATE INDEX IF NOT EXISTS idx_main_categories_order ON notarial_act_main_categories ("order", name);

-- Create Notarial Act Categories Table
CREATE TABLE IF NOT EXISTS notarial_act_categories (
    id SERIAL PRIMARY KEY,
    main_category_id INTEGER NOT NULL REFERENCES notarial_act_main_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    requires_property BOOLEAN DEFAULT FALSE,
    requires_bank BOOLEAN DEFAULT FALSE,
    requires_parties BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(main_category_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_main ON notarial_act_categories (main_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON notarial_act_categories ("order");

-- Insert Main Categories
INSERT INTO notarial_act_main_categories (name, code, description, "order") VALUES
('Procure', 'PROCURE', 'Procure generali e speciali', 1),
('Atti relativi alle persone e alla famiglia', 'PERSONE_FAMIGLIA', 'Atti di famiglia e regime patrimoniale', 2),
('Successioni e donazioni', 'SUCCESSIONI_DONAZIONI', 'Testamenti, successioni, donazioni', 3),
('Proprietà e compravendite immobiliari', 'PROPRIETA', 'Vendita, permuta, divisione di beni immobili', 4),
('Obbligazioni e contratti', 'OBBLIGAZIONI_CONTRATTI', 'Contratti di locazione, mutuo, ipoteca', 5),
('Società', 'SOCIETA', 'Costituzione, gestione e liquidazione società', 6),
('Formalità e tutela', 'FORMALITA_TUTELA', 'Trascrizioni, iscrizioni, certificazioni', 7),
('Norme speciali', 'NORME_SPECIALI', 'Scritture private, veicoli, imbarcazioni', 8)
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for PROCURE
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Procura generale', 'PROCURA_GENERALE', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'PROCURE'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Procura speciale a vendere immobile', 'PROCURA_SPECIALE_VENDITA', 2, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROCURE'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Autenticazione di firma', 'AUTENTICAZIONE_FIRMA', 3, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'PROCURE'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for PERSONE_FAMIGLIA
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Atto di notorietà per contrarre matrimonio', 'NOTORIETA_MATRIMONIO', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'PERSONE_FAMIGLIA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Opzione di regime patrimoniale', 'REGIME_PATRIMONIALE', 2, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'PERSONE_FAMIGLIA'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for SUCCESSIONI_DONAZIONI
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Testamento pubblico', 'TESTAMENTO_PUBBLICO', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Testamento segreto', 'TESTAMENTO_SEGRETO', 2, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Testamento olografo', 'TESTAMENTO_OLOGRAFO', 3, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Pubblicazione di testamento', 'PUBBLICAZIONE_TESTAMENTO', 4, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Revoca di testamento', 'REVOCA_TESTAMENTO', 5, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Accettazione di eredità', 'ACCETTAZIONE_EREDITA', 6, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Rinuncia all''eredità', 'RINUNCIA_EREDITA', 7, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Inventario', 'INVENTARIO', 8, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Donazione di beni immobili', 'DONAZIONE_IMMOBILI', 9, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Donazione di beni mobili', 'DONAZIONE_MOBILI', 10, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Cessione a titolo di antiparte di quota di immobile', 'CESSIONE_ANTIPARTE', 11, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'SUCCESSIONI_DONAZIONI'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for PROPRIETA
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Compravendita di beni immobili', 'COMPRAVENDITA_IMMOBILI', 1, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Compravendita immobiliare con benefici prima casa', 'COMPRAVENDITA_PRIMA_CASA', 2, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Permuta', 'PERMUTA', 3, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Cessione di quote ereditarie indivise di bene immobile', 'CESSIONE_QUOTE_EREDITARIE', 4, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Divisione di bene immobile', 'DIVISIONE_IMMOBILE', 5, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Locazione finanziaria (leasing)', 'LEASING', 6, TRUE, TRUE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Riscatto di locazione finanziaria', 'RISCATTO_LEASING', 7, TRUE, TRUE FROM notarial_act_main_categories WHERE code = 'PROPRIETA'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for OBBLIGAZIONI_CONTRATTI
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Contratto di locazione (affitto) di immobile', 'LOCAZIONE_IMMOBILE', 1, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Contratto di comodato', 'COMODATO', 2, TRUE, FALSE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Contratto di mutuo con iscrizione di ipoteca', 'MUTUO_CON_IPOTECA', 3, TRUE, TRUE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Contratto di mutuo senza iscrizione di ipoteca', 'MUTUO_SENZA_IPOTECA', 4, FALSE, TRUE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Cancellazione di ipoteca', 'CANCELLAZIONE_IPOTECA', 5, TRUE, TRUE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Accollo di debito', 'ACCOLLO_DEBITO', 6, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'OBBLIGAZIONI_CONTRATTI'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for SOCIETA
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Atto costitutivo e statuto di società per azioni (S.p.A.)', 'COSTITUZIONE_SPA', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SOCIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Atto costitutivo e statuto di società a responsabilità limitata (S.r.l.)', 'COSTITUZIONE_SRL', 2, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SOCIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Verbale di assemblea di società', 'VERBALE_ASSEMBLEA', 3, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SOCIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Cessione di quote di società a responsabilità limitata', 'CESSIONE_QUOTE_SRL', 4, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SOCIETA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Scioglimento e messa in liquidazione di società', 'LIQUIDAZIONE_SOCIETA', 5, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'SOCIETA'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for FORMALITA_TUTELA
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Trascrizioni', 'TRASCRIZIONI', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'FORMALITA_TUTELA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Iscrizioni', 'ISCRIZIONI', 2, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'FORMALITA_TUTELA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Dichiarazione giurata', 'DICHIARAZIONE_GIURATA', 3, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'FORMALITA_TUTELA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Rilascio di copie e certificazione di conformità', 'CERTIFICAZIONE_COPIE', 4, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'FORMALITA_TUTELA'
ON CONFLICT (code) DO NOTHING;

-- Insert Subcategories for NORME_SPECIALI
INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Scrittura privata autenticata', 'SCRITTURA_PRIVATA', 1, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'NORME_SPECIALI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Vendita di autoveicolo', 'VENDITA_AUTOVEICOLO', 2, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'NORME_SPECIALI'
ON CONFLICT (code) DO NOTHING;

INSERT INTO notarial_act_categories (main_category_id, name, code, "order", requires_property, requires_bank) 
SELECT id, 'Compravendita di imbarcazione', 'COMPRAVENDITA_IMBARCAZIONE', 3, FALSE, FALSE FROM notarial_act_main_categories WHERE code = 'NORME_SPECIALI'
ON CONFLICT (code) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_main_categories_updated_at BEFORE UPDATE ON notarial_act_main_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON notarial_act_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

