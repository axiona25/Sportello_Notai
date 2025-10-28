import React, { useState, useEffect, useRef } from 'react'
import { 
  Settings as SettingsIcon, 
  Calendar, 
  Users, 
  FileSignature, 
  Mail, 
  Archive, 
  FileText,
  Save,
  Edit,
  Clock,
  Upload,
  Trash2,
  Paperclip,
  User,
  Store,
  Image,
  FolderOpen,
  CalendarCheck,
  MessageSquare,
  Video,
  FileCheck,
  ShieldCheck,
  ChevronDown,
  Download
} from 'lucide-react'
import Header from './Header'
import notaryProfileService from '../services/notaryProfileService'
import { 
  getTipologieAtti, 
  saveTipologieAtti, 
  aggiungiTipologiaAtto, 
  aggiornaTipologiaAtto, 
  eliminaTipologiaAtto,
  DURATE_PREDEFINITE,
  GIORNI_SETTIMANA,
  SLOT_ORARI,
  AVAILABLE_ICONS 
} from '../config/tipologieAttiConfig'
import './Settings.css'

// Logo placeholder per profili senza immagine
const DEFAULT_PROFILE_PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAB5CAYAAABWUl2kAAAACXBIWXMAAAsTAAALEwEAmpwYAAAIRElEQVR4nO2dCahdxRmAv3lm0USbZ4z2PYMa97rgRq+oYLVaCuIudcfUUmtEFJdWccMNW4NtUTFI3VAi7mJSFRRcQaTirUpa16pJXOK7ajTRJMasI/+f/0nUBPveO/85c5YPHrztzj33OzNzzpn5558QYwS4wL4GwmfAvsBHVJ8RwL3AAYN8/WT5CjFGkXz1IAt5EdgP+Jpqi34QOHSI5VwosucDY4ZQyFTgt1SX3YBXMijvi64MCpkInJ1BOZUnC9nC34EDMyqrsnRlWM4DwFYZlVdJspItbAg8DKyfYZmVIkvZwk52wQwZl1sJspYtHAlc6lBu6fGQLVwOHOFUdmnxki3cad1KQw6y5UL5T2Cs43uUCk/ZwtbAfcA6zu9TCrxlC78CrsnhfZInD9nCucBJ1Jy8ZAu3AC1qTJ6yRwLTgR5qSp6yhU2Bh2yMuHbkLVvYG7iRGlKEbOH3wBnUjKJkC9cCv6RGFCl7GHA/MIGaUKRsYZzdoYymBhQtW9gVuL0OY+ApyBaOlql+Kk4qsoWrgEOoMCnJDsDdwM+oKCnJFjawSeNuKkhqsoVtrYZXbgw8RdnCQcBfqBipyhbOB06gQqQsW7gV2IOKkLrs9YBpwE+pAFnKfgEfNrc4wtKPgWcp+yxH4fsC11NyspS91ELPvJZ9nAZMosRk3Wd3LOxsCT7cYLW8lHhcINvAqfgw3Na3bEYJ8robmWozMR5sYmPgcqdSKjxv/c4DnnQqew/gNkqGp+wVwLHATKfyj7enzNLg/VDzOXA4sNCp/KttHKUU5PEE+apjnF+XjRBuRwnI63F9OnCFU9ndFgf+ExInz7GRK0y6BzK7c1fqYz15Hly07uQ1p/Jl/vJKEibvmrAQOAyY51T+xTZTnyRFNLuZwDHASqfy77BYlOQoqo97EviTU9mj7IK5EYlRdGDlVKeyt7MxFIknTIoir96TbODKg/0dx2dKKftrGwOXoVkPzrBY8CQoWrYwBzjKJh88uNFWOxROCrKFfwGn48MIW8cznoJJRTY2ZDoFH3psln5dCiQl2cI5wLP4IGswb6JAUpO9HPgN8J5T+RPthBZCarL7kzPKGPhX+PA3W0+fOynKFmYAJ+P3me8vInlYqrKxKKg/40MhycNSlo3lmnoUH3aybD+5LZxKXfZK4ETgTafyJaDoMnIiddnCl3bBlJyxHlxmQwbulEG28D8LXfAaA5fRx51xpiyyhccd10rmkjysTLKxXFP34MNWdkvotnCqbLKxIdOX8UEyJf/VqexSyl5sdxGfOJV/jj3WZ04ZZQsf2BjKMny4Gdgz60LLKlt4DjgTv+Rh07JOHlZm2diQ6T/wSx42LcuFU2WX3b9wSmq5B3tluXCqCrKXWhTU+47CM6EKsoWP7ZFb7lSSpSqysXvvU0iYKsnGAuOTzWhcNdnCRcBjJEgVZa+w1BlvkxhVlI2NfUsc+AISoaqysdkdqeG6B2MKVFk2Nn95CYlQddn9ayVlpr5w6iA7Ar+zWJRCqYNsYZGNgc+lQOoiW5htC6cknrAQ6iRbeKYJrMyXKUWlz6ijbGyVg1fysLVSV9lLnZOHrZG6ys4jedgPqLNsbA3mH8iJusvGwoZzWZzayPZPHvYtjezvJg97F0ca2fklD2tkf4/XPDcJbWT/kOm2lXnmNLLXzJUWepYpjey1j4FPzDp5WCM7x+RhjewfTx52dFYLpxrZP85TwB/JgEb2/8d1WSQPE9mTh1oI8AjwOtVmEvDiEF4/OcSoMSwX2NdgeBo4zjHHU0psaoH3A80ZOHl12Q050PTZOdLIzpFGdo40snOkkZ0juWbhbfdpiqAuAsOIuphTvh9p+xZ0E3WjCNnwvlf3MAiammKYbQA0di2PzV0W9D7f/ncFUde1B4vxW0jQmfRFlvv1ffu7/MdyopYpy7KXE1jZ6vGL587l1k8lB0YRmaA7KAU2N7Gym9KGBJU7nKiJsuQkiORI0DCDlRaf99Va8jnJBxhp2Sjl+0DU1we7919KUNHLbPrrS6L+vIDALKIOOMkayjkEDbz8sNXjk4Qgc9ntjsqS+iH7OG4DbA+MU6FR14KL3BFEFbFMhUYdWRMBn9gHXmC/kxorB7iEoOmL1tTtyckYZYJXWL6QbjtZkrh8PSIbW+uQY+u14xm12skZbbV+HkGnxzpEPiVoK5CEjm9Z65jf6hl8YOaQZLc72h3IU9UEAuOJ9BJU8Nb2+zG2+dpineMLmlH4M6JGIs22DzafqB9kiX3YeVk35Xafnox1CXosG9kJl1Y0TlvEquPewlpWt20UN1pbRNSTNEsXtgZmE3kDeIegk8NzBiJ/QLLbHd0XXSRupjV31QFKbqUtCYwm6t+l7+vTNBWRD/SgojZT+V5SV3ze6nHL9TRo2h2VLq1DhG+pnzGwMZEdrVVKl9djrUu6mZkEZhD5j6XkkOHYua1ebV0Dk93u0EXUmilf4wlMILILgd20e4haA6QrmGs19i2ivuEsAv+VfKopSh0M7Y5enOU6swOwO0ErmPw8djX5rwBP2OyOVLZPvy/+O7L17K6SK01teyK/sP0DZHeMsdavSdN/B/g3qFQ5wyJ5keeVPCXaHe2OpPL93BKh72pdj3j70PKByzj48+qlV/PLrpLd7mMMgV3shVJzdyZqU5KL1jwbPp1B4CU9g3LxgNjqLS6KPwXafVqrh9mdj9T2g4F9bEeo9U18m8Atssdav+wHLBnVcL0biLrY51ULPHzZpC+WO4eqdA0etPv0Yiq1fgeLkP21nQS5uB7XL3uK3f9Kn/OS1Vx5SFjYkktDAwPBHt7kbka64BaRfQhc+g1bY+tzHHXMygAAAABJRU5ErkJggg=='

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
    nomeCognome: 'Francesco Spada',
    partitaIva: 'SM23456789',
    address: 'Piazza Cavour n.19 - Dogana (SM)',
    telefono: '+378 0549 987654',
    email: 'notaio@digitalnotary.sm',
    sitoWeb: '',
    codiceFiscale: 'SPDFRN70A01H501Z'
  })

  // State per i dati della vetrina
  const [vetrinaData, setVetrinaData] = useState({
    photo: '', // Inizialmente vuoto, verrà caricato dal backend
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
      
      // Carica dati Generali
      const generalData = await notaryProfileService.getGeneralData()
      if (generalData) {
        
        setGeneraliData({
          nomeCognome: generalData.studio_name || '',
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
        
        // Aggiorna vetrinaData con i dati dal backend
        setVetrinaData({
          photo: existingProfile.photo || '', // Non usare DEFAULT_PROFILE_PHOTO se vuoto
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
    { id: 7, label: 'Tipologia Atti', icon: FileText }
  ]

  const handleSaveOrEdit = async () => {
    const currentState = tabStates[activeTab]
    if (currentState === 'editing') {
      // Salva le modifiche sul backend a seconda della tab attiva
      let result = null
      
      switch (activeTab) {
        case 0: // Tab Generali
          result = await notaryProfileService.saveGeneralData(generaliData)
          
          if (result.success) {
            
            // Aggiorna vetrinaData con i campi read-only sincronizzati
            if (result.data) {
              setVetrinaData(prev => ({
                ...prev,
                name: result.data.studio_name,
                address: result.data.address_street
              }))
              
              // Aggiorna anche l'oggetto user nel localStorage
              const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
              if (storedUser && storedUser.notary_profile) {
                storedUser.notary_profile.studio_name = result.data.studio_name
                localStorage.setItem('user', JSON.stringify(storedUser))
                
                // Emetti eventi per forzare re-render di tutti i componenti
                window.dispatchEvent(new CustomEvent('userUpdated', { 
                  detail: { user: storedUser } 
                }))
                window.dispatchEvent(new CustomEvent('notaryProfileUpdated', { 
                  detail: { notaryId: storedUser.notary_profile.id } 
                }))
                
                // Usa localStorage per notificare anche altre tab/browser
                localStorage.setItem('notaryProfileUpdatedTrigger', Date.now().toString())
              }
            }
            
            // Forza invalidazione cache
            notaryProfileService.clearCache()
          } else {
            alert('Errore nel salvare le impostazioni. Riprova.')
            return
          }
          break
          
        case 1: // Tab Vetrina
          result = await notaryProfileService.saveProfile(vetrinaData)
          
          if (result.success) {
            
            // Aggiorna lo stato locale con i dati ricevuti dal backend
            if (result.data) {
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
              
              // Aggiorna anche l'oggetto user nel localStorage con la foto
              const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
              if (storedUser && storedUser.notary_profile) {
                storedUser.notary_profile.showcase_photo = result.data.photo || ''
                storedUser.notary_profile.foto = result.data.photo || ''
                localStorage.setItem('user', JSON.stringify(storedUser))
              }
            }
            
            // Forza invalidazione cache e aggiornamento immediato
            notaryProfileService.clearCache()
            
            // Notifica l'aggiornamento del profilo per aggiornare tutti i componenti
            window.dispatchEvent(new CustomEvent('notaryProfileUpdated', { 
              detail: { forceRefresh: true }
            }))
            
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
            window.dispatchEvent(new CustomEvent('userUpdated', { 
              detail: { user: storedUser } 
            }))
            
            // Usa localStorage per notificare anche altre tab/browser
            localStorage.setItem('notaryProfileUpdatedTrigger', Date.now().toString())
          } else {
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
        case 7: // Tipologia Atti
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
        setVetrinaData(prev => {
          const newData = { ...prev, photo: reader.result }
          return newData
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGeneraliFieldChange = (field, value) => {
    setGeneraliData(prev => ({ ...prev, [field]: value }))
    
    // Sincronizza i campi read-only con la vetrina in tempo reale
    if (field === 'nomeCognome') {
      setVetrinaData(prev => ({ ...prev, name: value }))
    }
    if (field === 'address') {
      setVetrinaData(prev => ({ ...prev, address: value }))
    }
  }

  const handleVetrinaFieldChange = (field, value) => {
    setVetrinaData(prev => {
      const updated = { ...prev, [field]: value }
      return updated
    })
  }

  const handleServiceToggle = (serviceKey) => {
    setVetrinaData(prev => {
      const newValue = !prev.services[serviceKey]
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

        <div className="settings-tabs-container">
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

        <div className="settings-container">
          <div className="settings-content">
            {renderTabContent()}
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
            <label className="form-label">Nome e Cognome</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Francesco Spada"
              value={data.nomeCognome} 
              onChange={(e) => onFieldChange('nomeCognome', e.target.value)}
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
  }, [isEditing, data.photo, data.experience, data.languages, data.description, data.services])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Estrai iniziali dal nome pubblico
  const getInitials = () => {
    if (!data.name) return 'NN'
    const parts = data.name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="settings-tab three-columns">
      <div className="settings-section">
        <h3 className="section-title">Profilo Pubblico</h3>
        <div className="photo-upload-compact">
          <div className={`photo-preview-compact ${(!data.photo || data.photo === '' || data.photo === DEFAULT_PROFILE_PHOTO) ? 'placeholder' : ''}`}>
            {data.photo && data.photo !== '' && data.photo !== DEFAULT_PROFILE_PHOTO && data.photo.startsWith('data:image') ? (
              <img src={data.photo} alt="Foto profilo" className="photo-preview-img" />
            ) : (
              <span className="initials-placeholder">{getInitials()}</span>
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

// Tab 7: Tipologia Atti
function ModelliTab({ isEditing }) {
  const [tipologieAtti, setTipologieAtti] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [attoSelezionato, setAttoSelezionato] = useState(null)
  const [templateStates, setTemplateStates] = useState({}) // { attoId: { hasTemplate: bool, filename: string } }
  
  useEffect(() => {
    // Carica tipologie atti
    const tipologie = getTipologieAtti()
    setTipologieAtti(tipologie)
    
    // Carica info template per ogni tipologia
    loadAllTemplateStates(tipologie)
  }, [])
  
  const loadAllTemplateStates = async (tipologie) => {
    const templateService = (await import('../services/templateService')).default
    const states = {}
    
    for (const atto of tipologie) {
      if (atto.attivo) {
        const result = await templateService.getTemplateByActType(atto.id)
        if (result.success) {
          states[atto.id] = {
            hasTemplate: true,
            filename: result.data.original_filename,
            id: result.data.id
          }
        } else {
          states[atto.id] = { hasTemplate: false }
        }
      }
    }
    
    setTemplateStates(states)
  }
  
  const handleModifica = (atto) => {
    setAttoSelezionato(atto)
    setShowEditModal(true)
  }
  
  const handleDurata = (atto) => {
    setAttoSelezionato(atto)
    setShowDurationModal(true)
  }
  
  const handleUpload = (atto) => {
    setAttoSelezionato(atto)
    setShowUploadModal(true)
  }
  
  const handleUploadSuccess = async (attoId) => {
    // Ricarica lo stato del template per questo atto
    const templateService = (await import('../services/templateService')).default
    const result = await templateService.getTemplateByActType(attoId)
    
    if (result.success) {
      setTemplateStates(prev => ({
        ...prev,
        [attoId]: {
          hasTemplate: true,
          filename: result.data.original_filename,
          id: result.data.id
        }
      }))
    }
  }
  
  const handleElimina = (attoId) => {
    if (confirm('Vuoi davvero disattivare questa tipologia atto?')) {
      eliminaTipologiaAtto(attoId)
      setTipologieAtti(getTipologieAtti())
    }
  }
  
  return (
    <div className="settings-tab two-columns">
      <div className="settings-section">
        <div className="section-header-with-action">
          <h3 className="section-title">Tipologie Atti Disponibili</h3>
          {isEditing && (
            <button 
              className="btn-add-inline"
              onClick={() => setShowAddModal(true)}
            >
              + Aggiungi Tipologia
            </button>
          )}
        </div>
        <div className="models-compact-list">
          {tipologieAtti.filter(a => a.attivo).map(atto => {
            const IconComponent = atto.icon || FileText
            return (
              <div key={atto.id} className="model-compact-item">
                <IconComponent size={20} className="model-compact-icon" />
                <div className="model-compact-info">
                  <span className="model-compact-name">{atto.nome}</span>
                  <span className="model-compact-usage">{atto.durata_minuti} minuti</span>
                </div>
                <div className="model-compact-actions">
                  {isEditing && (
                    <>
                      {/* Icona Modifica Nome */}
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => handleModifica(atto)}
                        title="Rinomina atto"
                      >
                        <Edit size={16} />
                      </button>
                      
                      {/* Icona Tempo (Durata) */}
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => handleDurata(atto)}
                        title="Imposta durata"
                      >
                        <Clock size={16} />
                      </button>
                      
                      {/* Icona Upload/Allegato Template */}
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => handleUpload(atto)}
                        title={templateStates[atto.id]?.hasTemplate ? `Template: ${templateStates[atto.id]?.filename}` : "Carica template"}
                      >
                        {templateStates[atto.id]?.hasTemplate ? (
                          <Paperclip size={16} className="has-attachment" />
                        ) : (
                          <Upload size={16} />
                        )}
                      </button>
                      
                      {/* Icona Elimina */}
                      <button 
                        className="btn-icon-sm btn-icon-danger" 
                        onClick={() => handleElimina(atto.id)}
                        title="Disattiva atto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Impostazioni Tipologie Atti</h3>
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
      
      {/* Modali */}
      {showAddModal && <ModalAggiungiTipologia onClose={() => setShowAddModal(false)} onSave={() => setTipologieAtti(getTipologieAtti())} />}
      {showEditModal && attoSelezionato && <ModalModificaNome atto={attoSelezionato} onClose={() => setShowEditModal(false)} onSave={() => setTipologieAtti(getTipologieAtti())} />}
      {showDurationModal && attoSelezionato && <ModalDurata atto={attoSelezionato} onClose={() => setShowDurationModal(false)} onSave={() => setTipologieAtti(getTipologieAtti())} />}
      {showUploadModal && attoSelezionato && <ModalUploadTemplate atto={attoSelezionato} onClose={() => setShowUploadModal(false)} onSave={() => setTipologieAtti(getTipologieAtti())} onUploadSuccess={() => handleUploadSuccess(attoSelezionato.id)} />}
    </div>
  )
}

// ===== ICON PICKER COMPONENT =====
function IconPicker({ selectedIconName, onSelectIcon }) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)

  // Chiudi quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedIcon = AVAILABLE_ICONS.find(i => i.name === selectedIconName) || AVAILABLE_ICONS[0]
  const SelectedIconComponent = selectedIcon.icon

  return (
    <div className="icon-picker-container" style={{ position: 'relative' }} ref={pickerRef}>
      <div 
        className="icon-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="icon-picker-preview">
          <SelectedIconComponent size={20} />
        </div>
        <span>{selectedIcon.label}</span>
        <ChevronDown size={16} style={{ marginLeft: 'auto' }} />
      </div>

      {isOpen && (
        <>
          <div className="icon-picker-overlay" onClick={() => setIsOpen(false)} />
          <div className="icon-picker-dropdown">
            <div className="icon-picker-dropdown-header">
              <h4>Seleziona Icona</h4>
              <button 
                className="icon-picker-dropdown-close"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="icon-picker-grid">
              {AVAILABLE_ICONS.map((iconItem) => {
                const IconComponent = iconItem.icon
                const isSelected = iconItem.name === selectedIconName
                
                return (
                  <div
                    key={iconItem.name}
                    className={`icon-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectIcon(iconItem.name)
                      setIsOpen(false)
                    }}
                  >
                    <div className="icon-picker-item-icon">
                      <IconComponent size={24} />
                    </div>
                    <div className="icon-picker-item-label">
                      {iconItem.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ===== MODALI PER GESTIONE TIPOLOGIE ATTI =====

// Modale Aggiungi Tipologia
function ModalAggiungiTipologia({ onClose, onSave }) {
  const [nome, setNome] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [durata, setDurata] = useState(60)
  const [iconName, setIconName] = useState('FileText')
  
  const handleSave = () => {
    if (nome.trim()) {
      aggiungiTipologiaAtto({ nome, descrizione, durata_minuti: durata, iconName })
      onSave()
      onClose()
    }
  }
  
  return (
    <div className="tipologia-modal-overlay" onClick={onClose}>
      <div className="tipologia-modal" onClick={e => e.stopPropagation()}>
        <div className="tipologia-modal-header">
          <h3>Aggiungi Nuova Tipologia Atto</h3>
          <button className="tipologia-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tipologia-modal-body">
          <div className="form-group">
            <label className="form-label">Nome Atto *</label>
            <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Costituzione SRL" />
          </div>
          <div className="form-group">
            <label className="form-label">Descrizione</label>
            <textarea className="form-textarea" value={descrizione} onChange={e => setDescrizione(e.target.value)} placeholder="Breve descrizione..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Icona</label>
            <IconPicker selectedIconName={iconName} onSelectIcon={setIconName} />
          </div>
          <div className="form-group">
            <label className="form-label">Durata Appuntamento (minuti)</label>
            <input type="number" className="form-input" value={durata} onChange={e => setDurata(parseInt(e.target.value))} min={15} step={15} />
          </div>
        </div>
        <div className="tipologia-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!nome.trim()}>Aggiungi</button>
        </div>
      </div>
    </div>
  )
}

// Modale Modifica Nome
function ModalModificaNome({ atto, onClose, onSave }) {
  const [nome, setNome] = useState(atto.nome)
  const [descrizione, setDescrizione] = useState(atto.descrizione || '')
  const [iconName, setIconName] = useState(atto.iconName || 'FileText')
  
  const handleSave = () => {
    if (nome.trim()) {
      aggiornaTipologiaAtto(atto.id, { nome, descrizione, iconName })
      onSave()
      onClose()
    }
  }
  
  return (
    <div className="tipologia-modal-overlay" onClick={onClose}>
      <div className="tipologia-modal" onClick={e => e.stopPropagation()}>
        <div className="tipologia-modal-header">
          <h3>Modifica Tipologia Atto</h3>
          <button className="tipologia-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tipologia-modal-body">
          <div className="form-group">
            <label className="form-label">Nome Atto *</label>
            <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrizione</label>
            <textarea className="form-textarea" value={descrizione} onChange={e => setDescrizione(e.target.value)} rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Icona</label>
            <IconPicker selectedIconName={iconName} onSelectIcon={setIconName} />
          </div>
        </div>
        <div className="tipologia-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!nome.trim()}>Salva</button>
        </div>
      </div>
    </div>
  )
}

// Modale Durata
function ModalDurata({ atto, onClose, onSave }) {
  const [durata, setDurata] = useState(atto.durata_minuti)
  const [giorniDisponibili, setGiorniDisponibili] = useState(atto.giorni_disponibili || [1, 2, 3, 4, 5])
  const [slotDisponibili, setSlotDisponibili] = useState(atto.slot_disponibili || [1, 2, 3])
  
  const toggleGiorno = (giornoId) => {
    setGiorniDisponibili(prev => 
      prev.includes(giornoId) 
        ? prev.filter(id => id !== giornoId)
        : [...prev, giornoId].sort((a, b) => a - b)
    )
  }
  
  const toggleSlot = (slotId) => {
    setSlotDisponibili(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId].sort((a, b) => a - b)
    )
  }
  
  const handleSave = () => {
    aggiornaTipologiaAtto(atto.id, { 
      durata_minuti: durata,
      giorni_disponibili: giorniDisponibili,
      slot_disponibili: slotDisponibili
    })
    onSave()
    onClose()
  }
  
  return (
    <div className="tipologia-modal-overlay" onClick={onClose}>
      <div className="tipologia-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="tipologia-modal-header">
          <h3>Imposta Disponibilità Appuntamento</h3>
          <button className="tipologia-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tipologia-modal-body">
          <div className="tipologia-modal-atto-title">
            {atto.icon && <atto.icon size={24} />}
            <strong>{atto.nome.toUpperCase()}</strong>
          </div>
          
          {/* Durata */}
          <div className="form-group">
            <label className="form-label">Durata (minuti)</label>
            <input type="number" className="form-input" value={durata} onChange={e => setDurata(parseInt(e.target.value))} min={15} step={15} />
          </div>
          <div className="tipologia-duration-presets">
            <button className="tipologia-btn-preset" onClick={() => setDurata(DURATE_PREDEFINITE.BREVE)}>30 min</button>
            <button className="tipologia-btn-preset" onClick={() => setDurata(DURATE_PREDEFINITE.STANDARD)}>60 min</button>
            <button className="tipologia-btn-preset" onClick={() => setDurata(DURATE_PREDEFINITE.LUNGA)}>90 min</button>
            <button className="tipologia-btn-preset" onClick={() => setDurata(DURATE_PREDEFINITE.MOLTO_LUNGA)}>120 min</button>
          </div>
          
          {/* Giorni disponibili */}
          <div className="form-group availability-section">
            <label className="form-label">Giorni Disponibili</label>
            <div className="availability-checkboxes">
              {GIORNI_SETTIMANA.map(giorno => (
                <label key={giorno.id} className="availability-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={giorniDisponibili.includes(giorno.id)}
                    onChange={() => toggleGiorno(giorno.id)}
                  />
                  <span>{giorno.nome}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Slot orari */}
          <div className="form-group availability-section">
            <label className="form-label">Fasce Orarie Disponibili</label>
            <div className="availability-checkboxes">
              {SLOT_ORARI.map(slot => (
                <label key={slot.id} className="availability-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={slotDisponibili.includes(slot.id)}
                    onChange={() => toggleSlot(slot.id)}
                  />
                  <span>{slot.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="tipologia-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave}>Salva</button>
        </div>
      </div>
    </div>
  )
}

// Modale Upload Template
function ModalUploadTemplate({ atto, onClose, onSave, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [templateInfo, setTemplateInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Carica info template esistente
  useEffect(() => {
    loadTemplateInfo()
  }, [atto.id])
  
  const loadTemplateInfo = async () => {
    setLoading(true)
    const templateService = (await import('../services/templateService')).default
    const result = await templateService.getTemplateByActType(atto.id)
    
    if (result.success) {
      setTemplateInfo(result.data)
    } else if (!result.notFound) {
      console.error('Errore caricamento template:', result.error)
    }
    setLoading(false)
  }
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    const templateService = (await import('../services/templateService')).default
    
    const result = await templateService.uploadTemplate({
      actTypeCode: atto.id,
      actTypeName: atto.nome,
      file: file,
      description: `Template per ${atto.nome}`,
      version: '1.0'
    })
    
    if (result.success) {
      // Aggiorna anche la configurazione locale
      aggiornaTipologiaAtto(atto.id, { 
        template_documento: result.data?.original_filename || 'Template caricato'
      })
      
      // Ricarica le info del template
      await loadTemplateInfo()
      
      // Notifica il parent component del successo
      if (onUploadSuccess) {
        await onUploadSuccess()
      }
      
      onSave()
      onClose()
    } else {
      alert(`Errore: ${result.error}`)
    }
    
    setUploading(false)
  }
  
  return (
    <div className="tipologia-modal-overlay" onClick={onClose}>
      <div className="tipologia-modal" onClick={e => e.stopPropagation()}>
        <div className="tipologia-modal-header">
          <h3>Carica Template Documento</h3>
          <button className="tipologia-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tipologia-modal-body">
          <div className="tipologia-modal-atto-title">
            {atto.icon && <atto.icon size={24} />}
            <strong>{atto.nome.toUpperCase()}</strong>
          </div>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              Caricamento informazioni template...
            </div>
          ) : (
            <>
              {/* Template corrente */}
              {templateInfo && (
                <div className="template-info-box">
                  <div className="template-info-header">
                    <FileText size={20} />
                    <strong>Documento Template Caricato</strong>
                  </div>
                  <div className="template-info-content">
                    <div className="template-info-row">
                      <span className="template-info-label">File:</span>
                      <a 
                        href={templateInfo.template_url}
                        download={templateInfo.original_filename}
                        className="template-info-value"
                        style={{ 
                          color: '#3B82F6', 
                          textDecoration: 'none', 
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {templateInfo.original_filename}
                      </a>
                    </div>
                    <div className="template-info-row">
                      <span className="template-info-label">Dimensione:</span>
                      <span className="template-info-value">{(templateInfo.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="template-info-row">
                      <span className="template-info-label">Caricato il:</span>
                      <span className="template-info-value">
                        {new Date(templateInfo.created_at).toLocaleDateString('it-IT', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Separatore visivo */}
              {templateInfo && (
                <div style={{ 
                  borderTop: '2px dashed #E5E7EB', 
                  margin: '24px 0', 
                  position: 'relative' 
                }}>
                  <span style={{ 
                    position: 'absolute', 
                    top: '-12px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: 'white', 
                    padding: '0 12px', 
                    fontSize: '12px', 
                    color: '#9CA3AF',
                    fontWeight: '500'
                  }}>
                    OPPURE
                  </span>
                </div>
              )}
              
              {/* Upload nuovo template */}
              <div className="form-group" style={{ marginTop: templateInfo ? '0' : '0' }}>
                <label className="form-label">
                  {templateInfo ? '🔄 Sostituisci Template (opzionale)' : '📤 Carica Template Documento (DOCX, PDF, ODT)'}
                </label>
                {templateInfo && (
                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', marginTop: '4px' }}>
                    Seleziona un file solo se vuoi sostituire il template esistente
                  </p>
                )}
                <input 
                  type="file" 
                  className="form-file" 
                  accept=".docx,.pdf,.odt,.doc" 
                  onChange={handleFileChange} 
                />
              </div>
              
              {file && (
                <div className="tipologia-file-preview">
                  <Paperclip size={16} />
                  <span>{file.name}</span>
                  <span className="tipologia-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
              
              {!templateInfo && !file && (
                <p className="tipologia-modal-description" style={{ marginTop: '12px' }}>
                  Nessun template caricato per questa tipologia. Carica un file per iniziare.
                </p>
              )}
            </>
          )}
        </div>
        <div className="tipologia-modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Annulla
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload} 
            disabled={!file || uploading || loading}
          >
            {uploading ? 'Caricamento...' : (templateInfo ? 'Sostituisci' : 'Carica')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings

