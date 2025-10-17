-- Migration: Add Document Types Tables
-- Repubblica di San Marino - Document requirements for notarial acts

-- Create Document Types Table
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'altro',
    required_from VARCHAR(50) DEFAULT 'cliente',
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_document_types_category ON document_types (category);

-- Create Notarial Act Category Documents (many-to-many relation)
CREATE TABLE IF NOT EXISTS notarial_act_category_documents (
    id SERIAL PRIMARY KEY,
    act_category_id INTEGER NOT NULL REFERENCES notarial_act_categories(id) ON DELETE CASCADE,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    notes TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(act_category_id, document_type_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_act_cat_docs_act ON notarial_act_category_documents (act_category_id);
CREATE INDEX IF NOT EXISTS idx_act_cat_docs_doc ON notarial_act_category_documents (document_type_id);
CREATE INDEX IF NOT EXISTS idx_act_cat_docs_order ON notarial_act_category_documents ("order");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_types_timestamp BEFORE UPDATE ON document_types
    FOR EACH ROW EXECUTE FUNCTION update_document_types_updated_at();

CREATE TRIGGER update_act_cat_docs_timestamp BEFORE UPDATE ON notarial_act_category_documents
    FOR EACH ROW EXECUTE FUNCTION update_document_types_updated_at();

-- Insert Document Types
INSERT INTO document_types (name, code, category, required_from, description, is_mandatory) VALUES
-- Identità
('Documento d''identità valido', 'DOC_IDENTITA', 'identita', 'cliente', 'Carta d''identità, passaporto o patente', TRUE),
('Codice fiscale', 'CODICE_FISCALE', 'fiscale', 'cliente', 'Tessera del codice fiscale', TRUE),
('Permesso di soggiorno (extra UE)', 'PERMESSO_SOGGIORNO', 'identita', 'cliente', 'Per cittadini non UE', FALSE),

-- Stato Civile
('Certificato di stato civile', 'CERT_STATO_CIVILE', 'stato_civile', 'cliente', 'Certificato di matrimonio o stato libero', TRUE),
('Estratto di matrimonio', 'ESTRATTO_MATRIMONIO', 'stato_civile', 'cliente', 'Se coniugato', FALSE),
('Convenzione patrimoniale', 'CONVENZIONE_PATRIMONIALE', 'stato_civile', 'cliente', 'Se applicabile', FALSE),
('Certificato di morte', 'CERT_MORTE', 'stato_civile', 'cliente', 'Per atti di successione', TRUE),

-- Immobile
('Atto di provenienza', 'ATTO_PROVENIENZA', 'immobile', 'venditore', 'Precedente atto di acquisto dell''immobile', TRUE),
('Visura catastale', 'VISURA_CATASTALE', 'immobile', 'PA', 'Dati catastali aggiornati', TRUE),
('Planimetria catastale', 'PLANIMETRIA_CATASTALE', 'immobile', 'PA', 'Planimetria aggiornata e conforme', TRUE),
('Certificato di agibilità', 'CERT_AGIBILITA', 'immobile', 'PA', 'Certificato di abitabilità/agibilità', TRUE),
('Attestato di Prestazione Energetica (APE)', 'APE', 'tecnico', 'professionista', 'Certificazione energetica', TRUE),
('Certificato di conformità urbanistica', 'CERT_URBANISTICA', 'immobile', 'PA', 'Conformità urbanistica dell''immobile', TRUE),
('Certificati di conformità impiantistica', 'CERT_IMPIANTI', 'tecnico', 'professionista', 'Certificati impianti elettrico, idraulico, gas', TRUE),
('Regolamento di condominio', 'REGOLAMENTO_CONDOMINIO', 'immobile', 'venditore', 'Se immobile in condominio', FALSE),
('Tabella millesimale', 'TABELLA_MILLESIMALE', 'immobile', 'venditore', 'Per immobili in condominio', FALSE),
('Perizia di stima immobile', 'PERIZIA_STIMA', 'tecnico', 'professionista', 'Valutazione del valore di mercato', FALSE),

-- Societari
('Certificato di iscrizione al Registro delle Imprese', 'CERT_REGISTRO_IMPRESE', 'societario', 'cliente', 'Visura camerale', TRUE),
('Statuto sociale', 'STATUTO_SOCIALE', 'societario', 'cliente', 'Statuto della società', TRUE),
('Atto costitutivo', 'ATTO_COSTITUTIVO', 'societario', 'cliente', 'Atto costitutivo della società', TRUE),
('Delibera assembleare', 'DELIBERA_ASSEMBLEARE', 'societario', 'cliente', 'Delibera con delega di poteri', TRUE),
('Verbale di assemblea', 'VERBALE_ASSEMBLEA', 'societario', 'cliente', 'Verbale delle decisioni assembleari', TRUE),
('Certificato versamento capitale sociale', 'CERT_CAPITALE', 'finanziario', 'banca', 'Attestazione versamento capitale', TRUE),

-- Finanziari/Banca
('Contratto di mutuo', 'CONTRATTO_MUTUO', 'finanziario', 'banca', 'Contratto di finanziamento', TRUE),
('Delibera di concessione mutuo', 'DELIBERA_MUTUO', 'finanziario', 'banca', 'Approvazione del finanziamento', TRUE),
('Documentazione reddituale', 'DOC_REDDITUALE', 'fiscale', 'cliente', 'Ultime dichiarazioni dei redditi, buste paga', TRUE),
('Piano di ammortamento', 'PIANO_AMMORTAMENTO', 'finanziario', 'banca', 'Piano di rimborso del mutuo', TRUE),

-- Successioni
('Testamento', 'TESTAMENTO', 'altro', 'cliente', 'Testamento del de cuius', FALSE),
('Dichiarazione di successione', 'DICHIARAZIONE_SUCCESSIONE', 'fiscale', 'cliente', 'Dichiarazione degli eredi', TRUE),
('Certificato degli eredi', 'CERT_EREDI', 'stato_civile', 'cliente', 'Elenco degli aventi diritto', TRUE),

-- Procure
('Dati del mandatario', 'DATI_MANDATARIO', 'altro', 'cliente', 'Dati anagrafici completi del procuratore', TRUE),
('Descrizione poteri conferiti', 'DESC_POTERI', 'altro', 'cliente', 'Elenco dettagliato dei poteri da conferire', TRUE),

-- Altri
('Contratto preliminare', 'CONTRATTO_PRELIMINARE', 'altro', 'entrambi', 'Compromesso di compravendita', FALSE),
('Ricevuta caparra confirmatoria', 'RICEVUTA_CAPARRA', 'finanziario', 'venditore', 'Prova del pagamento della caparra', FALSE),
('Autodichiarazione requisiti prima casa', 'AUTODICH_PRIMA_CASA', 'fiscale', 'acquirente', 'Per agevolazioni fiscali', FALSE),
('Perizia giurata', 'PERIZIA_GIURATA', 'tecnico', 'professionista', 'Perizia tecnica giurata', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Nota: Le associazioni tra documenti e categorie di atti devono essere gestite tramite
-- il management command populate_document_types.py per maggiore flessibilità

