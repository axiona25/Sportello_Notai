import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Calendar, 
  Users, 
  FileSignature, 
  Mail, 
  Archive, 
  FileText,
  Save,
  Store,
  Upload,
  Image,
  FolderOpen,
  CalendarCheck,
  MessageSquare,
  Video,
  FileCheck,
  ShieldCheck
} from 'lucide-react'
import Header from './Header'
import './Settings.css'

function Settings({ searchValue, onSearchChange }) {
  const [activeTab, setActiveTab] = useState(0)
  
  // State per tracciare se ogni tab è in modalità editing o saved
  const [tabStates, setTabStates] = useState({
    0: 'saved', // 'saved' o 'editing'
    1: 'saved',
    2: 'saved',
    3: 'saved',
    4: 'saved',
    5: 'saved',
    6: 'saved',
    7: 'saved'
  })

  const tabs = [
    { id: 0, label: 'Generali', icon: SettingsIcon },
    { id: 1, label: 'Vetrina', icon: Store },
    { id: 2, label: 'Imposta Agenda', icon: Calendar },
    { id: 3, label: 'Staff', icon: Users },
    { id: 4, label: 'Firma Digitale', icon: FileSignature },
    { id: 5, label: 'PEC', icon: Mail },
    { id: 6, label: 'Conservazione', icon: Archive },
    { id: 7, label: 'Modelli', icon: FileText }
  ]

  const handleSaveOrEdit = () => {
    const currentState = tabStates[activeTab]
    if (currentState === 'editing') {
      // Salva le modifiche
      setTabStates(prev => ({ ...prev, [activeTab]: 'saved' }))
    } else {
      // Entra in modalità editing
      setTabStates(prev => ({ ...prev, [activeTab]: 'editing' }))
    }
  }

  const handleCancel = () => {
    // Annulla e torna in modalità saved (ripristina i dati originali)
    setTabStates(prev => ({ ...prev, [activeTab]: 'saved' }))
  }

  const isEditing = tabStates[activeTab] === 'editing'

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <GeneraliTab isEditing={isEditing} />
      case 1:
        return <VetrinaTab isEditing={isEditing} />
      case 2:
        return <AgendaTab isEditing={isEditing} />
      case 3:
        return <StaffTab isEditing={isEditing} />
      case 4:
        return <FirmaDigitaleTab isEditing={isEditing} />
      case 5:
        return <PECTab isEditing={isEditing} />
      case 6:
        return <ConservazioneTab isEditing={isEditing} />
      case 7:
        return <ModelliTab isEditing={isEditing} />
      default:
        return <GeneraliTab isEditing={isEditing} />
    }
  }

  return (
    <div className="settings-page">
      <Header searchValue={searchValue} onSearchChange={onSearchChange} />
      
      <div className="settings-content-wrapper">
        <div className="settings-header">
          <div className="settings-welcome-group">
            <h1 className="settings-welcome-title">Impostazioni di</h1>
            <div className="settings-name-container">
              <span className="settings-name">Francesco Spada</span>
              <img src="/assets/element.png" alt="" className="settings-underline" />
            </div>
          </div>
          <p className="settings-subtitle">Configura le preferenze del tuo studio notarile</p>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

                <div className="settings-content">
                  <div className="settings-tab-wrapper">
                    {renderTabContent()}
                  </div>

                  <div className="settings-actions">
                    {isEditing && (
                      <button className="btn-secondary" onClick={handleCancel}>
                        Annulla
                      </button>
                    )}
                    <button className="btn-primary" onClick={handleSaveOrEdit}>
                      <Save size={18} />
                      {isEditing ? 'Salva Modifiche' : 'Modifica'}
                    </button>
                  </div>
                </div>
      </div>
    </div>
  )
}

// Tab 0: Generali
function GeneraliTab({ isEditing }) {
  return (
    <div className="settings-tab two-columns">
      <div className="settings-section">
        <h3 className="section-title">Informazioni Studio</h3>
        <div className="form-grid-spaced">
          <div className="form-group">
            <label className="form-label">Nome Studio</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Studio Notarile Francesco Spada"
              defaultValue="Studio Notarile Francesco Spada" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Partita IVA</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="IT12345678901"
              defaultValue="SM23456789" disabled={!isEditing}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Indirizzo Completo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Piazza Cavour n.19 - Dogana (S. Marino)"
              defaultValue="Piazza Cavour n.19 - Dogana (S. Marino)" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefono Studio</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="+378 0549 123456"
              defaultValue="+378 0549 987654" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Studio</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="info@studionotarile.sm"
              defaultValue="notaio@digitalnotary.sm" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sito Web</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://www.studionotarile.sm"
              defaultValue="" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Codice Fiscale</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="SPDFRN70A01H501Z"
              defaultValue="SPDFRN70A01H501Z" disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Preferenze Interfaccia</h3>
        <div className="form-grid-spaced">
          <div className="form-group">
            <label className="form-label">Lingua Sistema</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fuso Orario</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="Europe/Rome">Europe/Rome (GMT+1)</option>
              <option value="Europe/London">Europe/London (GMT+0)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Formato Data</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="dd/mm/yyyy">GG/MM/AAAA</option>
              <option value="mm/dd/yyyy">MM/GG/AAAA</option>
              <option value="yyyy-mm-dd">AAAA-MM-GG</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Valuta Predefinita</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="eur">Euro (€)</option>
              <option value="usd">Dollaro ($)</option>
            </select>
          </div>
        </div>
        
        <h3 className="section-title" style={{marginTop: '32px'}}>Notifiche</h3>
        <div className="form-grid-spaced">
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Abilita notifiche desktop</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Notifiche email per nuovi appuntamenti</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" disabled={!isEditing} />
              <span>Modalità scura (in arrivo)</span>
            </label>
          </div>
        </div>
      </div>

    </div>
  )
}

// Tab 1: Vetrina
function VetrinaTab({ isEditing }) {
  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <h3 className="section-title">Profilo Pubblico</h3>
        <div className="photo-upload-compact">
          <div className="photo-preview-compact">
            <Image size={32} />
          </div>
          <div className="photo-upload-info">
            <button className="btn-outline-sm" disabled={!isEditing}>
              <Upload size={14} />
              Carica
            </button>
            <span className="upload-hint-sm">JPG/PNG, max 5MB</span>
          </div>
        </div>

        <div className="form-grid" style={{marginTop: '16px'}}>
          <div className="form-group full-width">
            <label className="form-label">Nome Pubblico</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Notaio Francesco Spada"
              defaultValue="Notaio Francesco Spada"
              disabled={!isEditing}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Titolo Professionale</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Specializzazione"
              defaultValue="Notaio - Diritto Immobiliare"
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Anni Esperienza</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="15"
              defaultValue="15"
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lingue</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Italiano, Inglese"
              defaultValue="Italiano, Inglese"
              disabled={!isEditing}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Descrizione</label>
            <textarea 
              className="form-textarea-compact" 
              rows="3" disabled={!isEditing}
              placeholder="Breve presentazione dello studio..."
              defaultValue="Consulenza notarile specializzata in compravendite immobiliari e diritto societario."
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Servizi Offerti</h3>
        <div className="services-checklist-compact">
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <FolderOpen size={16} className="service-icon" />
            <span className="service-name-compact">Documenti Condivisi</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <CalendarCheck size={16} className="service-icon" />
            <span className="service-name-compact">Agenda Automatica</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <Video size={16} className="service-icon" />
            <span className="service-name-compact">Chat, Audio e Video</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <FileCheck size={16} className="service-icon" />
            <span className="service-name-compact">Atti Presenza/Digitali</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <FileSignature size={16} className="service-icon" />
            <span className="service-name-compact">Firma Digitale</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <Mail size={16} className="service-icon" />
            <span className="service-name-compact">PEC</span>
          </label>
          <label className="service-item-compact">
            <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
            <Archive size={16} className="service-icon" />
            <span className="service-name-compact">Conservazione</span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Disponibilità</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Mostra disponibilità tempo reale</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Accetta appuntamenti online</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Tempo medio risposta</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="24h">Entro 24 ore</option>
              <option value="48h">Entro 48 ore</option>
              <option value="72h">Entro 3 giorni</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Visibilità Profilo</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="public">Pubblico</option>
              <option value="private">Solo clienti esistenti</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 2: Imposta Agenda
function AgendaTab({ isEditing }) {
  const workingHours = [
    { id: 1, start: '09:00', end: '12:00', days: ['Lun', 'Mar', 'Mer'] },
    { id: 2, start: '15:00', end: '18:00', days: ['Gio', 'Ven'] },
    { id: 3, start: '10:00', end: '13:00', days: ['Sab'] }
  ]

  return (
    <div className="settings-tab two-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Orari di Lavoro</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Fascia Oraria
            </button>
          )}
        </div>
        <div className="working-hours-list">
          {workingHours.map((slot) => (
            <div key={slot.id} className="working-hour-card">
              <div className="working-hour-header">
                <div className="working-hour-time">
                  <input 
                    type="time" 
                    className="form-input-compact" 
                    defaultValue={slot.start} 
                    readOnly={!isEditing}
                  />
                  <span className="time-separator">-</span>
                  <input 
                    type="time" 
                    className="form-input-compact" 
                    defaultValue={slot.end} 
                    readOnly={!isEditing}
                  />
                </div>
                {isEditing && (
                  <button className="btn-icon-danger" title="Rimuovi">×</button>
                )}
              </div>
              <div className="working-hour-days">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                  <label key={day} className={`day-pill ${slot.days.includes(day) ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      defaultChecked={slot.days.includes(day)} 
                      disabled={!isEditing}
                      style={{display: 'none'}}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h3 className="section-title" style={{marginTop: '24px'}}>Configurazione Slot</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Durata Slot (minuti)</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="15">15 minuti</option>
              <option value="30" selected>30 minuti</option>
              <option value="45">45 minuti</option>
              <option value="60">60 minuti</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Festività e Chiusure</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Includi festività italiane</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Includi festività di San Marino</span>
            </label>
          </div>
        </div>

        <div className="section-header-with-action" style={{marginTop: '24px'}}>
          <h3 className="section-title">Chiusure Personalizzate</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Chiusura
            </button>
          )}
        </div>
        <div className="closures-list">
          <div className="closure-item">
            <div className="closure-info">
              <span className="closure-date">25 Dic 2024</span>
              <span className="closure-reason">Natale</span>
            </div>
            {isEditing && <button className="btn-text-danger">Rimuovi</button>}
          </div>
          <div className="closure-item">
            <div className="closure-info">
              <span className="closure-date">15-30 Ago 2025</span>
              <span className="closure-reason">Ferie estive</span>
            </div>
            {isEditing && <button className="btn-text-danger">Rimuovi</button>}
          </div>
        </div>

        <div className="section-header-with-action" style={{marginTop: '24px'}}>
          <h3 className="section-title">Tipologie Appuntamento</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Tipologia
            </button>
          )}
        </div>
        <div className="appointment-types-compact">
          <div className="appointment-type-compact">
            <div className="type-info-compact">
              <span className="type-name-compact">Rogito Notarile</span>
              <span className="type-duration-compact">90 min</span>
            </div>
            {isEditing && <button className="btn-text-sm">Modifica</button>}
          </div>
          <div className="appointment-type-compact">
            <div className="type-info-compact">
              <span className="type-name-compact">Consulenza</span>
              <span className="type-duration-compact">45 min</span>
            </div>
            {isEditing && <button className="btn-text-sm">Modifica</button>}
          </div>
          <div className="appointment-type-compact">
            <div className="type-info-compact">
              <span className="type-name-compact">Revisione Documenti</span>
              <span className="type-duration-compact">30 min</span>
            </div>
            {isEditing && <button className="btn-text-sm">Modifica</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 2: Staff
function StaffTab({ isEditing }) {
  return (
    <div className="settings-tab two-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Membri del Team</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Membro
            </button>
          )}
        </div>
        <div className="staff-list">
          <div className="staff-item">
            <div className="staff-avatar">AC</div>
            <div className="staff-info">
              <span className="staff-name">Armando Carli</span>
              <span className="staff-role">Praticante Notaio</span>
            </div>
            <span className="staff-status active">Attivo</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
          <div className="staff-item">
            <div className="staff-avatar">SP</div>
            <div className="staff-info">
              <span className="staff-name">Sandro Pertini</span>
              <span className="staff-role">Segretario</span>
            </div>
            <span className="staff-status active">Attivo</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
          <div className="staff-item">
            <div className="staff-avatar">MR</div>
            <div className="staff-info">
              <span className="staff-name">Maria Rossi</span>
              <span className="staff-role">Assistente</span>
            </div>
            <span className="staff-status active">Attivo</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
          <div className="staff-item">
            <div className="staff-avatar">GB</div>
            <div className="staff-info">
              <span className="staff-name">Giuseppe Bianchi</span>
              <span className="staff-role">Praticante</span>
            </div>
            <span className="staff-status inactive">Inattivo</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Ruoli e Permessi</h3>
        <div className="permissions-grid">
          <div className="permission-card">
            <h4 className="permission-title">Praticante Notaio</h4>
            <ul className="permission-list">
              <li>✓ Visualizza atti</li>
              <li>✓ Modifica documenti</li>
              <li>✓ Gestione appuntamenti</li>
              <li>✗ Firma atti</li>
            </ul>
            {isEditing && <button className="btn-text">Configura</button>}
          </div>
          <div className="permission-card">
            <h4 className="permission-title">Segretario</h4>
            <ul className="permission-list">
              <li>✓ Gestione agenda</li>
              <li>✓ Caricamento documenti</li>
              <li>✗ Modifica atti</li>
              <li>✗ Firma documenti</li>
            </ul>
            {isEditing && <button className="btn-text">Configura</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 3: Firma Digitale
function FirmaDigitaleTab({ isEditing }) {
  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Certificati Installati</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Carica Certificato
            </button>
          )}
        </div>
        <div className="certificate-list">
          <div className="certificate-item active">
            <div className="certificate-icon">🔐</div>
            <div className="certificate-info">
              <span className="certificate-name">Francesco Spada - Firma Qualificata</span>
              <span className="certificate-details">CN=Francesco Spada, O=Digital Notary SM</span>
              <span className="certificate-validity">Valido fino al: 15/12/2025</span>
            </div>
            <span className="certificate-status valid">Valido</span>
          </div>
          <div className="certificate-item">
            <div className="certificate-icon">🔐</div>
            <div className="certificate-info">
              <span className="certificate-name">Francesco Spada - Firma Avanzata</span>
              <span className="certificate-details">CN=Francesco Spada, O=Digital Notary SM</span>
              <span className="certificate-validity">Valido fino al: 28/03/2026</span>
            </div>
            <span className="certificate-status valid">Valido</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Dispositivi di Firma</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tipo Dispositivo</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="token">Token USB</option>
              <option value="smartcard">Smart Card</option>
              <option value="hsm">HSM Remoto</option>
              <option value="cloud">Firma Cloud</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="aruba">Aruba PEC</option>
              <option value="infocert">InfoCert</option>
              <option value="poste">Poste Italiane</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Richiedi PIN ad ogni firma</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Verifica marca temporale automatica</span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Impostazioni Avanzate</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Formato Firma Predefinito</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="pades">PAdES (PDF)</option>
              <option value="cades">CAdES (P7M)</option>
              <option value="xades">XAdES (XML)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Livello Firma</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="basic">Basic (B)</option>
              <option value="timestamp">Timestamp (T)</option>
              <option value="ltv" selected>Long Term Validation (LTV)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 4: PEC
function PECTab({ isEditing }) {
  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Account PEC</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Account
            </button>
          )}
        </div>
        <div className="pec-account-card">
          <div className="pec-account-header">
            <Mail size={24} className="pec-icon" />
            <div className="pec-account-info">
              <span className="pec-email">notaio.spada@pec.digitalnotary.sm</span>
              <span className="pec-status connected">Connesso</span>
            </div>
          </div>
          <div className="pec-account-stats">
            <div className="pec-stat">
              <span className="stat-label">Ricevute oggi</span>
              <span className="stat-value">12</span>
            </div>
            <div className="pec-stat">
              <span className="stat-label">Inviate oggi</span>
              <span className="stat-value">8</span>
            </div>
            <div className="pec-stat">
              <span className="stat-label">Spazio utilizzato</span>
              <span className="stat-value">2.3 GB / 5 GB</span>
            </div>
          </div>
          {isEditing && <button className="btn-text">Configura</button>}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Regole Automatiche</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Scarica automaticamente ricevute di consegna</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Allega ricevuta PEC agli atti correlati</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" disabled={!isEditing} />
              <span>Archivia messaggi dopo 90 giorni</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Notifica ricezione nuove PEC</span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Filtri e Classificazione</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Filtro
            </button>
          )}
        </div>
        <div className="filter-list">
          <div className="filter-item">
            <span className="filter-name">Atti Notarili</span>
            <span className="filter-condition">Oggetto contiene "Rogito" o "Atto"</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
          <div className="filter-item">
            <span className="filter-name">Conservazione</span>
            <span className="filter-condition">Da: conservazione@*</span>
            {isEditing && <button className="btn-text">Modifica</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 5: Conservazione
function ConservazioneTab({ isEditing }) {
  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <h3 className="section-title">Configurazione Conservatore</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Provider Conservazione</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="aruba">Aruba Conservazione</option>
              <option value="infocert">InfoCert Conservazione</option>
              <option value="namirial">Namirial</option>
              <option value="custom">Conservatore Personalizzato</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">URL Servizio</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="https://conservazione.provider.sm"
              defaultValue="https://conservazione.digitalnotary.sm" disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">ID Cliente</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="CONS-123456"
              defaultValue="CONS-789012" disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Regole di Conservazione</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Aggiungi Regola
            </button>
          )}
        </div>
        <div className="conservation-rules">
          <div className="rule-item">
            <div className="rule-info">
              <span className="rule-name">Atti Notarili</span>
              <span className="rule-details">Conservazione automatica dopo firma → 50 anni</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="rule-item">
            <div className="rule-info">
              <span className="rule-name">Documenti Identificazione</span>
              <span className="rule-details">Conservazione manuale → 10 anni</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="rule-item">
            <div className="rule-info">
              <span className="rule-name">Ricevute PEC</span>
              <span className="rule-details">Conservazione automatica → 10 anni</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="rule-item">
            <div className="rule-info">
              <span className="rule-name">Fatture</span>
              <span className="rule-details">Conservazione automatica → 10 anni</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Statistiche Conservazione</h3>
        <div className="conservation-stats">
          <div className="stat-card">
            <span className="stat-label">Documenti Conservati</span>
            <span className="stat-value">1,234</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Spazio Occupato</span>
            <span className="stat-value">12.5 GB</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Ultimo Pacchetto</span>
            <span className="stat-value">15/10/2025</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Stato</span>
            <span className="stat-value success">Attivo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab 6: Modelli
function ModelliTab({ isEditing }) {
  return (
    <div className="settings-tab two-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Modelli Disponibili</h3>
          {isEditing && (
            <button className="btn-add-inline">
              + Carica Modello
            </button>
          )}
        </div>
        <div className="models-compact-list">
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Atto di Compravendita Immobiliare</span>
              <span className="model-compact-usage">145 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Costituzione Società</span>
              <span className="model-compact-usage">67 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Procura Notarile</span>
              <span className="model-compact-usage">89 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Testamento Olografo</span>
              <span className="model-compact-usage">23 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Donazione</span>
              <span className="model-compact-usage">34 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
          <div className="model-compact-item">
            <FileText size={20} className="model-compact-icon" />
            <div className="model-compact-info">
              <span className="model-compact-name">Mutuo Ipotecario</span>
              <span className="model-compact-usage">112 utilizzi</span>
            </div>
            <div className="model-compact-actions">
              {isEditing && <button className="btn-text-sm">Modifica</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Impostazioni Modelli</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Formato Predefinito</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="docx">Microsoft Word (.docx)</option>
              <option value="odt">OpenDocument (.odt)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Intestazione Predefinita</label>
            <select className="form-select" disabled={!isEditing}>
              <option value="standard">Standard Studio</option>
              <option value="minimal">Minimale</option>
              <option value="formal">Formale Completo</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Includi logo studio nei modelli</span>
            </label>
          </div>
          <div className="form-group full-width">
            <label className="form-label toggle-label">
              <input type="checkbox" className="form-checkbox" defaultChecked disabled={!isEditing} />
              <span>Numerazione automatica atti</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

