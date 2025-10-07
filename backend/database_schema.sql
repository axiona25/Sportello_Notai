-- ============================================
-- SPORTELLO NOTAI - PostgreSQL Schema
-- Database completo per piattaforma notarile
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('notaio', 'collaboratore', 'cliente', 'partner', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_verification', 'deleted');
CREATE TYPE act_category AS ENUM (
    'compravendita', 
    'mutuo', 
    'testamento', 
    'costituzione_societa', 
    'donazione',
    'divisione',
    'successione',
    'procura',
    'altro'
);
CREATE TYPE act_status AS ENUM ('bozza', 'in_lavorazione', 'in_attesa_firma', 'firmato', 'inviato_pec', 'archiviato', 'annullato');
CREATE TYPE document_category AS ENUM (
    'anagrafica',
    'banca',
    'permessi',
    'certificazioni',
    'catastali',
    'urbanistici',
    'contratti',
    'allegati',
    'firmati',
    'altro'
);
CREATE TYPE appointment_status AS ENUM ('richiesto', 'confermato', 'rifiutato', 'completato', 'annullato');
CREATE TYPE pec_status AS ENUM ('bozza', 'in_coda', 'inviato', 'consegnato', 'errore', 'quarantena');
CREATE TYPE rtc_session_type AS ENUM ('video_1to1', 'video_group', 'screen_share', 'document_share');
CREATE TYPE rtc_session_status AS ENUM ('active', 'ended', 'failed');
CREATE TYPE signature_type AS ENUM ('cades', 'xades', 'pades');
CREATE TYPE audit_action AS ENUM (
    'login', 'logout', 'login_failed',
    'create', 'read', 'update', 'delete',
    'upload', 'download', 'share',
    'sign', 'timestamp', 'stamp',
    'send_pec', 'export',
    'mfa_enabled', 'mfa_disabled',
    'permission_granted', 'permission_revoked'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Users (base)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Argon2
    role user_role NOT NULL,
    status user_status DEFAULT 'pending_verification',
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Notaries (profilo notaio)
CREATE TABLE notaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Studio
    studio_name VARCHAR(255) NOT NULL,
    bio TEXT,
    specializations TEXT[], -- array di specializzazioni
    
    -- Contatti
    phone VARCHAR(50),
    pec_address VARCHAR(255),
    website VARCHAR(255),
    
    -- Indirizzo
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_province VARCHAR(50),
    address_cap VARCHAR(10),
    address_country VARCHAR(50) DEFAULT 'Italia',
    coordinates POINT, -- lat/lng per mappa
    
    -- Vetrina
    cover_image_url TEXT,
    profile_image_url TEXT,
    
    -- Tariffe e servizi (JSON flessibile)
    services JSONB, -- [{name: "Compravendita", price: 1500, description: "..."}, ...]
    tariffe JSONB,
    
    -- Stats
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_acts INTEGER DEFAULT 0,
    
    -- Disponibilità
    working_hours JSONB, -- {monday: {start: "09:00", end: "18:00"}, ...}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT rating_range CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- Clients (clienti)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Anagrafica
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    fiscal_code VARCHAR(16),
    birth_date DATE,
    birth_place VARCHAR(100),
    
    -- Contatti
    phone VARCHAR(50),
    pec_address VARCHAR(255),
    
    -- Indirizzo residenza
    residence_street VARCHAR(255),
    residence_city VARCHAR(100),
    residence_province VARCHAR(50),
    residence_cap VARCHAR(10),
    residence_country VARCHAR(50) DEFAULT 'Italia',
    
    -- Documenti identità (riferimenti cifrati)
    identity_document_type VARCHAR(50), -- CI, Passaporto, Patente
    identity_document_number VARCHAR(100),
    identity_document_expiry DATE,
    identity_document_url TEXT, -- URL blob cifrato
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collaboratori (staff dello studio notarile)
CREATE TABLE collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE CASCADE,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100), -- "Praticante", "Segretaria", ecc.
    
    -- Permessi specifici (RBAC granulare)
    permissions JSONB, -- {can_create_acts: true, can_sign: false, ...}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ACTS & DOCUMENTS
-- ============================================

-- Acts (atti notarili)
CREATE TABLE acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Riferimenti
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Tipo e stato
    category act_category NOT NULL,
    status act_status DEFAULT 'bozza',
    
    -- Protocollo
    protocol_number VARCHAR(100) UNIQUE,
    protocol_year INTEGER,
    
    -- Dettagli
    title VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,
    
    -- Parti coinvolte (JSON flessibile per supportare atti complessi)
    parties JSONB, -- [{type: "venditore", client_id: "...", name: "..."}, ...]
    
    -- Banca coinvolta (se mutuo)
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    loan_amount DECIMAL(15,2),
    
    -- Immobile (se compravendita)
    property_address VARCHAR(500),
    property_cadastral_data JSONB,
    property_value DECIMAL(15,2),
    
    -- Date importanti
    signing_date TIMESTAMP,
    registration_date TIMESTAMP,
    
    -- Survey obbligatoria post-chiusura
    survey_completed BOOLEAN DEFAULT FALSE,
    survey_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Act Documents (documenti dell'atto - cifrati E2E)
CREATE TABLE act_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_id UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    
    -- Categorizzazione
    category document_category NOT NULL,
    subcategory VARCHAR(100), -- sottocartella personalizzata
    
    -- File info
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Storage (blob cifrato)
    blob_url TEXT NOT NULL, -- S3/GCS/Azure URL
    blob_storage_key VARCHAR(500), -- chiave storage
    
    -- E2E Encryption
    ciphertext_hash VARCHAR(64), -- SHA-256 del ciphertext
    encryption_metadata JSONB, -- {algorithm: "AES-256-GCM", key_wrapped: true, ...}
    wrapped_keys JSONB, -- [{user_id: "...", wrapped_key: "base64...", algorithm: "RSA-OAEP"}, ...]
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES act_documents(id),
    is_latest BOOLEAN DEFAULT TRUE,
    
    -- Firma digitale
    is_signed BOOLEAN DEFAULT FALSE,
    signature_type signature_type,
    signature_data JSONB, -- {signer: "...", timestamp: "...", certificate: "...", ...}
    
    -- Marca temporale
    has_timestamp BOOLEAN DEFAULT FALSE,
    timestamp_data JSONB,
    
    -- Timbro digitale
    has_stamp BOOLEAN DEFAULT FALSE,
    stamp_data JSONB,
    
    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit
    access_log JSONB, -- [{user_id: "...", action: "download", timestamp: "..."}, ...]
    
    CONSTRAINT positive_file_size CHECK (file_size > 0)
);

-- Document Permissions (permessi granulari sui documenti)
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES act_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(document_id, user_id)
);

-- ============================================
-- APPOINTMENTS
-- ============================================

-- Appointments (appuntamenti)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    act_id UUID REFERENCES acts(id) ON DELETE SET NULL, -- opzionale, può essere collegato a un atto
    
    status appointment_status DEFAULT 'richiesto',
    
    -- Date e orari
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    -- Dettagli
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    is_online BOOLEAN DEFAULT FALSE,
    meeting_url TEXT, -- link videoconferenza
    
    -- Reminder
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    -- Note
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Notary Availability (disponibilità notaio)
CREATE TABLE notary_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL, -- 0=Domenica, 6=Sabato
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    is_available BOOLEAN DEFAULT TRUE,
    
    UNIQUE(notary_id, day_of_week, start_time),
    CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

-- Reviews (recensioni post-atto)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    act_id UUID UNIQUE NOT NULL REFERENCES acts(id) ON DELETE CASCADE, -- una review per atto
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Rating (1-5 stelle)
    rating INTEGER NOT NULL,
    
    -- Feedback
    title VARCHAR(255),
    comment TEXT,
    
    -- Moderazione
    is_approved BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    moderation_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- ============================================
-- PEC (Posta Elettronica Certificata)
-- ============================================

-- PEC Templates (template messaggi)
CREATE TABLE pec_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notary_id UUID NOT NULL REFERENCES notaries(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template
    subject VARCHAR(500),
    body TEXT, -- con placeholder {{variabile}}
    
    -- Variabili disponibili (metadata)
    variables JSONB, -- ["cliente_nome", "atto_numero", ...]
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PEC Messages (messaggi PEC)
CREATE TABLE pec_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_id UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    
    -- Mittente
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_pec VARCHAR(255) NOT NULL,
    
    -- Destinatari (array)
    recipients JSONB NOT NULL, -- [{email: "...", name: "...", type: "to|cc|bcc"}, ...]
    
    -- Contenuto
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    -- Template usato (opzionale)
    template_id UUID REFERENCES pec_templates(id) ON DELETE SET NULL,
    
    -- Allegati (riferimenti a documenti)
    attachments JSONB, -- [{document_id: "...", filename: "..."}, ...]
    
    -- Stato invio
    status pec_status DEFAULT 'bozza',
    
    -- Log invio
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Ricevuta PEC
    receipt_data JSONB, -- dati ricevuta consegna/accettazione
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REAL-TIME COMMUNICATION (RTC)
-- ============================================

-- RTC Sessions (sessioni audio/video)
CREATE TABLE rtc_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    session_type rtc_session_type NOT NULL,
    status rtc_session_status DEFAULT 'active',
    
    -- Host
    host_id UUID NOT NULL REFERENCES users(id),
    
    -- Atto collegato (opzionale)
    act_id UUID REFERENCES acts(id) ON DELETE SET NULL,
    
    -- SFU/Server details
    server_url TEXT,
    room_id VARCHAR(255),
    
    -- Documento condiviso
    shared_document_id UUID REFERENCES act_documents(id) ON DELETE SET NULL,
    
    -- CRDT/OT state (per co-authoring)
    collaboration_state JSONB,
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- RTC Participants (partecipanti sessione)
CREATE TABLE rtc_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES rtc_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    
    -- Permissions
    can_share_screen BOOLEAN DEFAULT TRUE,
    can_edit_document BOOLEAN DEFAULT FALSE,
    
    UNIQUE(session_id, user_id)
);

-- ============================================
-- DIGITAL SIGNATURE & TIMESTAMP
-- ============================================

-- Signature Requests (richieste firma digitale)
CREATE TABLE signature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES act_documents(id) ON DELETE CASCADE,
    
    requested_by UUID NOT NULL REFERENCES users(id),
    signer_id UUID NOT NULL REFERENCES users(id),
    
    signature_type signature_type NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, signed, rejected, expired
    
    -- Provider firma qualificata
    provider VARCHAR(100), -- es. "Infocert", "Aruba", "Namirial"
    provider_request_id VARCHAR(255),
    
    -- OTP/PIN per firma
    otp_sent BOOLEAN DEFAULT FALSE,
    otp_verified BOOLEAN DEFAULT FALSE,
    
    signed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timestamp Requests (richieste marca temporale)
CREATE TABLE timestamp_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES act_documents(id) ON DELETE CASCADE,
    
    requested_by UUID NOT NULL REFERENCES users(id),
    
    -- TSA (Time Stamp Authority)
    tsa_provider VARCHAR(100),
    tsa_response BYTEA, -- RFC 3161 TimeStampResp
    
    timestamp_token TEXT,
    timestamp_value TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONSERVAZIONE SOSTITUTIVA
-- ============================================

-- Conservation Packages (pacchetti conservazione)
CREATE TABLE conservation_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    notary_id UUID NOT NULL REFERENCES notaries(id),
    
    -- Periodo
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Documenti inclusi
    document_ids JSONB, -- array di document_id
    
    -- Conservatore
    conservator_provider VARCHAR(100), -- conservatore accreditato AgID
    conservator_package_id VARCHAR(255),
    
    -- Export
    package_hash VARCHAR(64), -- SHA-256 del pacchetto
    package_url TEXT,
    
    -- Stato
    status VARCHAR(50) DEFAULT 'pending', -- pending, exported, conserved, verified
    
    exported_at TIMESTAMP,
    conserved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT & SECURITY
-- ============================================

-- Audit Logs (log completo azioni)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role user_role,
    
    -- Action
    action audit_action NOT NULL,
    resource_type VARCHAR(100), -- "act", "document", "user", ...
    resource_id UUID,
    
    -- Details
    description TEXT,
    metadata JSONB, -- dettagli aggiuntivi
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Events (eventi sicurezza critici)
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    event_type VARCHAR(100) NOT NULL, -- "brute_force", "unauthorized_access", "data_breach_attempt"
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    
    description TEXT NOT NULL,
    details JSONB,
    
    -- Response
    action_taken TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Tokens (JWT refresh tokens)
CREATE TABLE session_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    
    -- Device info
    device_info JSONB,
    ip_address INET,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES per performance
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Notaries
CREATE INDEX idx_notaries_user_id ON notaries(user_id);
CREATE INDEX idx_notaries_location ON notaries USING GIST(coordinates);
CREATE INDEX idx_notaries_rating ON notaries(average_rating DESC);

-- Clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_fiscal_code ON clients(fiscal_code);

-- Acts
CREATE INDEX idx_acts_notary_id ON acts(notary_id);
CREATE INDEX idx_acts_client_id ON acts(client_id);
CREATE INDEX idx_acts_category ON acts(category);
CREATE INDEX idx_acts_status ON acts(status);
CREATE INDEX idx_acts_protocol ON acts(protocol_number, protocol_year);
CREATE INDEX idx_acts_dates ON acts(signing_date, created_at);

-- Documents
CREATE INDEX idx_documents_act_id ON act_documents(act_id);
CREATE INDEX idx_documents_category ON act_documents(category);
CREATE INDEX idx_documents_uploaded_by ON act_documents(uploaded_by);
CREATE INDEX idx_documents_version ON act_documents(act_id, version, is_latest);

-- Appointments
CREATE INDEX idx_appointments_notary_id ON appointments(notary_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Reviews
CREATE INDEX idx_reviews_notary_id ON reviews(notary_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_approved ON reviews(is_approved, is_visible);

-- PEC
CREATE INDEX idx_pec_messages_act_id ON pec_messages(act_id);
CREATE INDEX idx_pec_messages_status ON pec_messages(status);
CREATE INDEX idx_pec_messages_sender ON pec_messages(sender_id);

-- RTC
CREATE INDEX idx_rtc_sessions_host ON rtc_sessions(host_id);
CREATE INDEX idx_rtc_sessions_status ON rtc_sessions(status);

-- Audit
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at DESC);

-- Security
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user ON security_events(user_id);

-- ============================================
-- TRIGGERS per auto-update
-- ============================================

-- Trigger per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notaries_updated_at BEFORE UPDATE ON notaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_acts_updated_at BEFORE UPDATE ON acts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pec_templates_updated_at BEFORE UPDATE ON pec_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pec_messages_updated_at BEFORE UPDATE ON pec_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per aggiornare statistiche notaio quando si aggiunge una review
CREATE OR REPLACE FUNCTION update_notary_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE notaries SET
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE notary_id = NEW.notary_id AND is_approved = TRUE),
        average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE notary_id = NEW.notary_id AND is_approved = TRUE)
    WHERE id = NEW.notary_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notary_stats AFTER INSERT OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_notary_rating();

-- ============================================
-- VIEWS utili
-- ============================================

-- Vista per atti con info complete
CREATE VIEW acts_complete AS
SELECT 
    a.*,
    n.studio_name as notary_studio,
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email,
    (SELECT COUNT(*) FROM act_documents WHERE act_id = a.id) as total_documents,
    (SELECT COUNT(*) FROM act_documents WHERE act_id = a.id AND is_signed = TRUE) as signed_documents
FROM acts a
JOIN notaries n ON a.notary_id = n.id
JOIN clients c ON a.client_id = c.id;

-- Vista per dashboard notaio
CREATE VIEW notary_dashboard AS
SELECT 
    n.id as notary_id,
    n.studio_name,
    COUNT(DISTINCT a.id) as total_acts,
    COUNT(DISTINCT CASE WHEN a.status = 'in_lavorazione' THEN a.id END) as active_acts,
    COUNT(DISTINCT CASE WHEN a.status = 'firmato' THEN a.id END) as signed_acts,
    COUNT(DISTINCT ap.id) as upcoming_appointments,
    n.average_rating,
    n.total_reviews
FROM notaries n
LEFT JOIN acts a ON n.id = a.notary_id
LEFT JOIN appointments ap ON n.id = ap.notary_id AND ap.start_time > CURRENT_TIMESTAMP AND ap.status = 'confermato'
GROUP BY n.id;

-- ============================================
-- COMMENTI E DOCUMENTAZIONE
-- ============================================

COMMENT ON TABLE users IS 'Tabella utenti base con autenticazione e MFA';
COMMENT ON TABLE notaries IS 'Profili notai con vetrina, servizi e tariffe';
COMMENT ON TABLE acts IS 'Atti notarili con categorizzazione e workflow completo';
COMMENT ON TABLE act_documents IS 'Documenti cifrati E2E collegati agli atti';
COMMENT ON TABLE audit_logs IS 'Log completo di tutte le azioni per compliance';
COMMENT ON TABLE pec_messages IS 'Messaggi PEC con tracking e template';
COMMENT ON TABLE rtc_sessions IS 'Sessioni real-time per video/audio e co-authoring';
COMMENT ON TABLE conservation_packages IS 'Pacchetti per conservazione sostitutiva AgID';

-- Fine schema

