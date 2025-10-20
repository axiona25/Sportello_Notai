import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Calendar, 
  Users, 
  FileSignature, 
  Mail, 
  Archive, 
  FileText,
  Save,
  User,
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
import notaryProfileService from '../services/notaryProfileService'
import './Settings.css'

// Logo placeholder per profili senza immagine
const DEFAULT_PROFILE_PHOTO = 'data:image/png;base64,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'

function Settings({ searchValue, onSearchChange, user }) {
  const [activeTab, setActiveTab] = useState(0)
  
  // Ottieni nome del notaio
  const getNotaryName = () => {
    if (user?.notary_profile?.studio_name) {
      return user.notary_profile.studio_name
    }
    return user?.email?.split('@')[0] || 'Notaio'
  }
  
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

  // State per i dati generali
  const [generaliData, setGeneraliData] = useState({
    studioName: 'Studio Notarile Francesco Spada',
    partitaIva: 'SM23456789',
    address: 'Piazza Cavour n.19 - Dogana (SM)',
    telefono: '+378 0549 987654',
    email: 'notaio@digitalnotary.sm',
    sitoWeb: '',
    codiceFiscale: 'SPDFRN70A01H501Z'
  })

  // State per i dati della vetrina
  const [vetrinaData, setVetrinaData] = useState({
    photo: DEFAULT_PROFILE_PHOTO,
    name: 'Francesco Spada',
    title: 'Notaio - Diritto Immobiliare',
    address: 'Piazza Cavour n.19 - Dogana (SM)',
    rating: 4.7,
    experience: 15,
    languages: 'Italiano, Inglese',
    description: 'Consulenza notarile specializzata in compravendite immobiliari e diritto societario.',
    services: {
      documents: true,
      agenda: true,
      chat: true,
      acts: true,
      signature: true,
      pec: true,
      conservation: true
    },
    availability: {
      enabled: true,
      hours: 'Lun-Ven 9:00-18:00'
    }
  })

  // Carica i dati esistenti al mount
  useEffect(() => {
    const loadProfile = async () => {
      console.log('📥 Caricamento dati dal backend...')
      
      // Carica dati Generali
      const generalData = await notaryProfileService.getGeneralData()
      if (generalData) {
        console.log('✅ Dati Generali caricati:', generalData)
        setGeneraliData({
          studioName: generalData.studio_name || '',
          partitaIva: generalData.fiscal_code || '',
          address: generalData.address_street || '',
          telefono: generalData.phone || '',
          email: generalData.pec_address || '',
          sitoWeb: generalData.website || '',
          codiceFiscale: generalData.fiscal_code || ''
        })
      }
      
      // Carica dati Vetrina
      const existingProfile = await notaryProfileService.getMyProfile()
      if (existingProfile) {
        console.log('✅ Profilo Vetrina caricato:', existingProfile)
        console.log('🔧 Servizi caricati dal profilo:', JSON.stringify(existingProfile.services, null, 2))
        
        // Aggiorna vetrinaData con i dati dal backend
        setVetrinaData({
          photo: existingProfile.photo || DEFAULT_PROFILE_PHOTO,
          name: existingProfile.name,
          title: existingProfile.title,
          address: existingProfile.address,
          rating: existingProfile.rating,
          experience: existingProfile.experience,
          languages: existingProfile.languages,
          description: existingProfile.description,
          services: existingProfile.services || {
            documents: true,
            agenda: true,
            chat: true,
            acts: true,
            signature: true,
            pec: true,
            conservation: true
          },
          availability: existingProfile.availability
        })
      } else {
        console.log('⚠️ Nessun profilo trovato, usando valori di default')
      }
    }
    
    loadProfile()
  }, [])

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

  const handleSaveOrEdit = async () => {
    const currentState = tabStates[activeTab]
    if (currentState === 'editing') {
      // Salva le modifiche sul backend a seconda della tab attiva
      let result = null
      
      switch (activeTab) {
        case 0: // Tab Generali
          console.log('💾 Salvando dati tab Generali...')
          result = await notaryProfileService.saveGeneralData(generaliData)
          
          if (result.success) {
            console.log('✅ Dati Generali salvati sul backend:', result.data)
            
            // Aggiorna vetrinaData con i campi read-only sincronizzati
            if (result.data) {
              setVetrinaData(prev => ({
                ...prev,
                name: result.data.studio_name,
                address: result.data.address_street
              }))
            }
            
            // Forza invalidazione cache
            notaryProfileService.clearCache()
          } else {
            console.error('❌ Errore nel salvare i dati Generali:', result.error)
            alert('Errore nel salvare le impostazioni. Riprova.')
            return
          }
          break
          
        case 1: // Tab Vetrina
          console.log('💾 Salvando dati tab Vetrina...')
          result = await notaryProfileService.saveProfile(vetrinaData)
          
          if (result.success) {
            console.log('✅ Dati Vetrina salvati sul backend:', result.data)
            
            // Aggiorna lo stato locale con i dati ricevuti dal backend
            if (result.data) {
              console.log('🔄 Aggiornando stato locale con dati dal backend...')
              setVetrinaData({
                photo: result.data.photo || DEFAULT_PROFILE_PHOTO,
                name: result.data.name,
                title: result.data.title,
                address: result.data.address,
                rating: result.data.rating,
                experience: result.data.experience,
                languages: result.data.languages,
                description: result.data.description,
                services: result.data.services || vetrinaData.services,
                availability: result.data.availability || vetrinaData.availability
              })
            }
            
            console.log('📡 Forzo invalidazione cache globale...')
            
            // Forza invalidazione cache e aggiornamento immediato
            notaryProfileService.clearCache()
            
            console.log('📢 Emettendo evento notaryProfileUpdated con forceRefresh...')
            
            // Notifica l'aggiornamento del profilo per aggiornare la dashboard clienti in tempo reale
            window.dispatchEvent(new CustomEvent('notaryProfileUpdated', { 
              detail: { forceRefresh: true }
            }))
            
            console.log('✅ Evento emesso correttamente')
          } else {
            console.error('❌ Errore nel salvare i dati Vetrina:', result.error)
            alert('Errore nel salvare le impostazioni. Riprova.')
            return
          }
          break
          
        // Altre tab: per ora solo stato locale, TODO: implementare salvataggio backend
        case 2: // Imposta Agenda
        case 3: // Staff
        case 4: // Firma Digitale
        case 5: // PEC
        case 6: // Conservazione
        case 7: // Modelli
          console.log(`ℹ️ Tab ${activeTab}: salvataggio locale (backend TODO)`)
          // TODO: implementare salvataggio backend per queste tab
          break
      }
      
      setTabStates(prev => ({ ...prev, [activeTab]: 'saved' }))
    } else {
      // Entra in modalità editing
      setTabStates(prev => ({ ...prev, [activeTab]: 'editing' }))
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Limita a 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('Immagine troppo grande. Max 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('📸 Foto caricata, lunghezza base64:', reader.result.length)
        setVetrinaData(prev => {
          const newData = { ...prev, photo: reader.result }
          console.log('✅ Vetrina data aggiornato con nuova foto')
          return newData
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGeneraliFieldChange = (field, value) => {
    setGeneraliData(prev => ({ ...prev, [field]: value }))
    
    // Sincronizza i campi read-only con la vetrina in tempo reale
    if (field === 'studioName') {
      setVetrinaData(prev => ({ ...prev, name: value }))
    }
    if (field === 'address') {
      setVetrinaData(prev => ({ ...prev, address: value }))
    }
  }

  const handleVetrinaFieldChange = (field, value) => {
    console.log(`✏️ Modifica campo "${field}":`, value)
    setVetrinaData(prev => {
      const updated = { ...prev, [field]: value }
      console.log('📝 Nuovo stato vetrinaData:', updated)
      return updated
    })
  }

  const handleServiceToggle = (serviceKey) => {
    setVetrinaData(prev => {
      const newValue = !prev.services[serviceKey]
      console.log(`🔄 Toggle servizio ${serviceKey}: ${prev.services[serviceKey]} -> ${newValue}`)
      return {
        ...prev,
        services: {
          ...prev.services,
          [serviceKey]: newValue
        }
      }
    })
  }

  const handleCancel = () => {
    // Annulla e torna in modalità saved (ripristina i dati originali)
    setTabStates(prev => ({ ...prev, [activeTab]: 'saved' }))
  }

  const isEditing = tabStates[activeTab] === 'editing'

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <GeneraliTab isEditing={isEditing} data={generaliData} onFieldChange={handleGeneraliFieldChange} />
      case 1:
        return <VetrinaTab 
          isEditing={isEditing} 
          data={vetrinaData}
          onPhotoUpload={handlePhotoUpload}
          onFieldChange={handleVetrinaFieldChange}
          onServiceToggle={handleServiceToggle}
        />
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
      <Header searchValue={searchValue} onSearchChange={onSearchChange} user={user} />
      
      <div className="settings-content-wrapper">
        <div className="settings-header">
          <div className="settings-welcome-group">
            <h1 className="settings-welcome-title">Impostazioni di</h1>
            <div className="settings-name-container">
              <span className="settings-name">{getNotaryName()}</span>
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
function GeneraliTab({ isEditing, data, onFieldChange }) {
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
              value={data.studioName} 
              onChange={(e) => onFieldChange('studioName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Partita IVA</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="IT12345678901"
              value={data.partitaIva}
              onChange={(e) => onFieldChange('partitaIva', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Indirizzo Completo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Piazza Cavour n.19 - Dogana (SM)"
              value={data.address}
              onChange={(e) => onFieldChange('address', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefono Studio</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="+378 0549 123456"
              value={data.telefono}
              onChange={(e) => onFieldChange('telefono', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Studio</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="info@studionotarile.sm"
              value={data.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sito Web</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://www.studionotarile.sm"
              value={data.sitoWeb}
              onChange={(e) => onFieldChange('sitoWeb', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Codice Fiscale</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="SPDFRN70A01H501Z"
              value={data.codiceFiscale}
              onChange={(e) => onFieldChange('codiceFiscale', e.target.value)}
              disabled={!isEditing}
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
function VetrinaTab({ isEditing, data, onPhotoUpload, onFieldChange, onServiceToggle }) {
  const fileInputRef = React.useRef(null)

  // Debug: verifica i dati ricevuti
  React.useEffect(() => {
    console.log('🎨 VetrinaTab render con isEditing:', isEditing)
    console.log('📊 Dati completi VetrinaTab:', {
      photo: data.photo ? `${data.photo.substring(0, 50)}... (length: ${data.photo.length})` : 'NO PHOTO',
      photoIsDefault: data.photo === DEFAULT_PROFILE_PHOTO,
      experience: data.experience,
      languages: data.languages,
      description: data.description,
      services: data.services
    })
  }, [isEditing, data.photo, data.experience, data.languages, data.description, data.services])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <h3 className="section-title">Profilo Pubblico</h3>
        <div className="photo-upload-compact">
          <div className={`photo-preview-compact ${(!data.photo || data.photo === DEFAULT_PROFILE_PHOTO) ? 'placeholder' : ''}`}>
            {data.photo && data.photo !== DEFAULT_PROFILE_PHOTO ? (
              <img src={data.photo} alt="Foto profilo" className="photo-preview-img" />
            ) : (
              <User 
                size={40} 
                color="white" 
                strokeWidth={1.5}
                style={{ opacity: 0.9 }}
              />
            )}
          </div>
          <div className="photo-upload-info">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png"
              onChange={onPhotoUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="btn-outline-sm" 
              disabled={!isEditing}
              onClick={handleUploadClick}
            >
              <Upload size={14} />
              Carica
            </button>
            <span className="upload-hint-sm">JPG/PNG, max 5MB<br/>Consigliato: 440x280px</span>
          </div>
        </div>

        <div className="form-grid" style={{marginTop: '16px'}}>
          <div className="form-group full-width">
            <label className="form-label">Nome Pubblico <span style={{fontSize: '12px', color: '#6b7280'}}>(da tab Generali)</span></label>
            <input 
              type="text" 
              className="form-input form-input-readonly" 
              placeholder="Notaio Francesco Spada"
              value={data.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              disabled={true}
              readOnly
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Titolo Professionale <span style={{fontSize: '12px', color: '#6b7280'}}>(da tab Generali)</span></label>
            <input 
              type="text" 
              className="form-input form-input-readonly" 
              placeholder="Specializzazione"
              value={data.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              disabled={true}
              readOnly
            />
          </div>
          <div className="form-group form-group-narrow">
            <label className="form-label">Anni Esperienza</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="15"
              value={data.experience}
              onChange={(e) => onFieldChange('experience', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group form-group-wide">
            <label className="form-label">Lingue</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Italiano, Inglese, Francese"
              value={data.languages}
              onChange={(e) => onFieldChange('languages', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Descrizione</label>
            <textarea 
              className="form-textarea-compact" 
              rows="3"
              placeholder="Breve presentazione dello studio..."
              value={data.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Servizi Offerti</h3>
        <div className="services-checklist-compact">
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.documents}
              onChange={() => onServiceToggle('documents')}
              disabled={!isEditing} 
            />
            <FolderOpen size={16} className="service-icon" />
            <span className="service-name-compact">Documenti Condivisi</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.agenda}
              onChange={() => onServiceToggle('agenda')}
              disabled={!isEditing} 
            />
            <CalendarCheck size={16} className="service-icon" />
            <span className="service-name-compact">Agenda Automatica</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.chat}
              onChange={() => onServiceToggle('chat')}
              disabled={!isEditing} 
            />
            <Video size={16} className="service-icon" />
            <span className="service-name-compact">Chat, Audio e Video</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.acts}
              onChange={() => onServiceToggle('acts')}
              disabled={!isEditing} 
            />
            <FileCheck size={16} className="service-icon" />
            <span className="service-name-compact">Atti Presenza/Digitali</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.signature}
              onChange={() => onServiceToggle('signature')}
              disabled={!isEditing} 
            />
            <FileSignature size={16} className="service-icon" />
            <span className="service-name-compact">Firma Digitale</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.pec}
              onChange={() => onServiceToggle('pec')}
              disabled={!isEditing} 
            />
            <Mail size={16} className="service-icon" />
            <span className="service-name-compact">PEC</span>
          </label>
          <label className="service-item-compact">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              checked={data.services.conservation}
              onChange={() => onServiceToggle('conservation')}
              disabled={!isEditing} 
            />
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
          <div className="filter-group">
            <label className="form-label">Atti Notarili</label>
            <div className="filter-item">
              <span className="filter-condition">Oggetto contiene "Rogito" o "Atto"</span>
              {isEditing && <button className="btn-text">Modifica</button>}
            </div>
          </div>
          <div className="filter-group">
            <label className="form-label">Conservazione</label>
            <div className="filter-item">
              <span className="filter-condition">Da: conservazione@*</span>
              {isEditing && <button className="btn-text">Modifica</button>}
            </div>
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

