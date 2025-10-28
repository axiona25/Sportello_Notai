import React, { useState, useEffect } from 'react'
import { 
  FolderOpen, 
  CalendarCheck, 
  Video, 
  FileCheck, 
  FileSignature, 
  Mail, 
  Archive,
  Star,
  UserX,
  SlidersHorizontal,
  X,
  Search,
  MapPin
} from 'lucide-react'
import notaryProfileService from '../services/notaryProfileService'
import NotaryModal from './NotaryModal'
import AppointmentBooking from './AppointmentBooking'
import './NotaryCards.css'

// Logo placeholder per profili senza immagine
const DEFAULT_PROFILE_PHOTO = 'data:image/png;base64,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'

function NotaryCards({ initialDate }) {
  const [profiles, setProfiles] = useState([])
  const [blockedCount, setBlockedCount] = useState(0)
  const [selectedNotary, setSelectedNotary] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [filterRating, setFilterRating] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const loadProfiles = async (forceRefresh = false) => {
    const notaryProfiles = await notaryProfileService.getAllProfiles(!forceRefresh)
    
    // Filtra solo i notai con licenza attiva
    const activeProfiles = notaryProfiles.filter(profile => profile.license_active !== false)
    const inactiveCount = notaryProfiles.length - activeProfiles.length
    
    
    // Debug foto profilo
    activeProfiles.forEach((profile, index) => {
      const photoInfo = {
        hasPhoto: !!profile.photo,
        isEmpty: profile.photo === '',
        isNull: profile.photo === null,
        photoLength: profile.photo?.length || 0,
        photoStart: profile.photo?.substring(0, 50) || 'N/A'
      }
    })
    
    if (activeProfiles[0]?.services) {
      const enabledServices = Object.entries(activeProfiles[0].services)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key)
    }
    
    // Ordina alfabeticamente per nome
    const sortedProfiles = activeProfiles.sort((a, b) => 
      a.name.localeCompare(b.name, 'it')
    )
    
    setProfiles(sortedProfiles)
    setBlockedCount(inactiveCount)
  }

  useEffect(() => {
    // Carica i profili notai al mount
    loadProfiles()

    // Custom event per aggiornamenti interni (quando notaio salva impostazioni)
    const handleProfileUpdate = (event) => {
      loadProfiles(true) // Force refresh senza cache
    }

    // Polling ogni 10 secondi per aggiornamenti real-time tra browser diversi
    const stopPolling = notaryProfileService.startPolling((newProfiles) => {
      // Filtra solo i notai con licenza attiva
      const activeProfiles = newProfiles.filter(profile => profile.license_active !== false)
      const inactiveCount = newProfiles.length - activeProfiles.length
      
      // Ordina alfabeticamente per nome
      const sortedProfiles = activeProfiles.sort((a, b) => 
        a.name.localeCompare(b.name, 'it')
      )
      
      setProfiles(sortedProfiles)
      setBlockedCount(inactiveCount)
    }, 10000)

    window.addEventListener('notaryProfileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('notaryProfileUpdated', handleProfileUpdate)
      stopPolling() // Ferma il polling quando il componente viene smontato
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getServiceIcon = (serviceKey, enabled) => {
    if (!enabled) return null

    const iconProps = { size: 14, strokeWidth: 2 }
    
    switch (serviceKey) {
      case 'documents':
        return <FolderOpen {...iconProps} />
      case 'agenda':
        return <CalendarCheck {...iconProps} />
      case 'chat':
        return <Video {...iconProps} />
      case 'acts':
        return <FileCheck {...iconProps} />
      case 'signature':
        return <FileSignature {...iconProps} />
      case 'pec':
        return <Mail {...iconProps} />
      case 'conservation':
        return <Archive {...iconProps} />
      default:
        return null
    }
  }

  const getServiceLabel = (serviceKey) => {
    const labels = {
      documents: 'Documenti',
      agenda: 'Agenda',
      chat: 'Video',
      acts: 'Atti',
      signature: 'Firma',
      pec: 'PEC',
      conservation: 'Archivio'
    }
    return labels[serviceKey] || ''
  }

  const getServiceTooltip = (serviceKey) => {
    const tooltips = {
      documents: 'Gestione e condivisione documenti',
      agenda: 'Prenota appuntamenti online',
      chat: 'Videochiamate e consulenze online',
      acts: 'Consultazione atti notarili',
      signature: 'Firma digitale documenti',
      pec: 'Comunicazione via PEC certificata',
      conservation: 'Conservazione digitale a norma'
    }
    return tooltips[serviceKey] || ''
  }

  if (profiles.length === 0) {
    return (
      <div className="notary-cards-empty">
        <p>Nessun notaio disponibile al momento.</p>
      </div>
    )
  }

  const handleCardClick = (profile) => {
    setSelectedNotary(profile)
    setShowModal(true)
  }

  const handleBookAppointment = () => {
    setShowModal(false)
    setShowBooking(true)
  }

  // Funzione per estrarre le iniziali dal nome (campo "Nome e Cognome" dalla tab Generali)
  const getInitials = (name) => {
    if (!name) return 'NN'
    
    const parts = name.trim().split(' ').filter(p => p.length > 0)
    let initials = ''
    
    if (parts.length === 1) {
      // Se c'è solo una parola, prendi le prime 2 lettere
      initials = parts[0].substring(0, 2).toUpperCase()
    } else {
      // Se ci sono più parole, prendi prima lettera della prima parola + prima lettera dell'ultima parola
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    
    return initials
  }

  // Applica filtri
  const filteredProfiles = profiles.filter(profile => {
    // Filtro per nome e cognome
    if (searchName.trim() !== '') {
      const searchLower = searchName.toLowerCase().trim()
      const profileName = profile.name.toLowerCase()
      if (!profileName.includes(searchLower)) return false
    }
    
    // Filtro per rating
    if (filterRating !== 'all') {
      const rating = parseFloat(profile.rating) || 0
      if (filterRating === '5' && rating < 5) return false
      if (filterRating === '4' && rating < 4) return false
      if (filterRating === '3' && rating < 3) return false
    }
    
    // Filtro per città
    if (filterCity !== 'all') {
      const profileCity = profile.address.split('-')[1]?.trim() || ''
      if (!profileCity.toLowerCase().includes(filterCity.toLowerCase())) return false
    }
    
    return true
  })
  
  // Estrai città uniche per il filtro
  const uniqueCities = [...new Set(profiles.map(p => {
    const city = p.address.split('-')[1]?.trim() || 'N/A'
    return city
  }))].sort()
  
  // Calcola quante card placeholder mostrare
  const maxVisibleCards = 5
  const scrollHintCard = 1 // Una card extra come hint per lo scrolling
  
  // Placeholder normali (fino a 5 card totali)
  const normalPlaceholders = filteredProfiles.length < maxVisibleCards 
    ? Math.min(blockedCount, maxVisibleCards - filteredProfiles.length) 
    : 0
  
  // Aggiungi sempre una sesta card come hint per lo scrolling
  const totalPlaceholders = normalPlaceholders + scrollHintCard
  const placeholderCards = Array(totalPlaceholders).fill(null)
  
  // Disabilita lo scroll se ci sono meno di 6 notai attivi
  const shouldEnableScroll = filteredProfiles.length >= 6
  

  // Conta filtri attivi
  const activeFiltersCount = [
    searchName.trim() !== '',
    filterRating !== 'all',
    filterCity !== 'all'
  ].filter(Boolean).length
  
  const resetFilters = () => {
    setSearchName('')
    setFilterRating('all')
    setFilterCity('all')
  }

  return (
    <>
      <div className="notary-cards-section">
        {/* Header con titolo e filtri */}
        <div className="notary-cards-header">
          <h2 className="notary-cards-title">Notai Disponibili</h2>
          
          {/* Pulsante filtri */}
          <button 
            className="filter-button"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} />
            <span>Filtri</span>
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>
        
        {/* Modale Filtri - Layout Orizzontale Compatto */}
        {showFilters && (
          <div className="filter-modal-overlay" onClick={() => setShowFilters(false)}>
            <div className="filter-modal filter-modal-horizontal" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3 className="filter-modal-title">
                  <SlidersHorizontal size={18} />
                  Filtra Notai
                </h3>
                <button 
                  className="filter-modal-close"
                  onClick={() => setShowFilters(false)}
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="filter-modal-body filter-modal-body-horizontal">
                {/* Campo Ricerca Nome */}
                <div className="filter-section filter-section-horizontal">
                  <label className="filter-label">Nome</label>
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cerca..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="search-input"
                    />
                    {searchName && (
                      <button 
                        className="search-clear"
                        onClick={() => setSearchName('')}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filtro Rating */}
                <div className="filter-section filter-section-horizontal">
                  <label className="filter-label">Rating</label>
                  <div className="filter-options filter-options-horizontal">
                    <button 
                      className={`filter-option filter-option-compact ${filterRating === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterRating('all')}
                    >
                      Tutti
                    </button>
                    <button 
                      className={`filter-option filter-option-compact ${filterRating === '5' ? 'active' : ''}`}
                      onClick={() => setFilterRating('5')}
                    >
                      <Star size={12} fill="#FFB800" stroke="#FFB800" />
                      5
                    </button>
                    <button 
                      className={`filter-option filter-option-compact ${filterRating === '4' ? 'active' : ''}`}
                      onClick={() => setFilterRating('4')}
                    >
                      <Star size={12} fill="#FFB800" stroke="#FFB800" />
                      4+
                    </button>
                    <button 
                      className={`filter-option filter-option-compact ${filterRating === '3' ? 'active' : ''}`}
                      onClick={() => setFilterRating('3')}
                    >
                      <Star size={12} fill="#FFB800" stroke="#FFB800" />
                      3+
                    </button>
                  </div>
                </div>
                
                {/* Filtro Città */}
                <div className="filter-section filter-section-horizontal">
                  <label className="filter-label">Città</label>
                  <div className="filter-options filter-options-horizontal">
                    <button 
                      className={`filter-option filter-option-compact ${filterCity === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterCity('all')}
                    >
                      Tutte
                    </button>
                    {uniqueCities.slice(0, 3).map(city => (
                      <button 
                        key={city}
                        className={`filter-option filter-option-compact ${filterCity === city ? 'active' : ''}`}
                        onClick={() => setFilterCity(city)}
                      >
                        <MapPin size={12} />
                        {city}
                      </button>
                    ))}
                    {uniqueCities.length > 3 && (
                      <select 
                        className="filter-select-compact"
                        value={filterCity !== 'all' && !uniqueCities.slice(0, 3).includes(filterCity) ? filterCity : 'more'}
                        onChange={(e) => e.target.value !== 'more' && setFilterCity(e.target.value)}
                      >
                        <option value="more">Altre...</option>
                        {uniqueCities.slice(3).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Pulsanti Azioni */}
                <div className="filter-section filter-section-actions">
                  {activeFiltersCount > 0 && (
                    <button 
                      className="filter-reset-btn-compact"
                      onClick={resetFilters}
                      title="Resetta filtri"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button 
                    className="filter-apply-btn-compact"
                    onClick={() => setShowFilters(false)}
                  >
                    Applica
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className={`notary-cards-grid ${!shouldEnableScroll ? 'no-scroll' : ''}`}>
          {filteredProfiles.map((profile) => (
            <div 
              key={profile.id} 
              className="notary-card"
              onClick={() => handleCardClick(profile)}
            >
            {/* Foto in cima - IDENTICA AL MOCK */}
            <div className="notary-photo">
              {(() => {
                // Verifica se il notaio ha una foto REALE (non vuota, non logo di default)
                const hasValidPhoto = profile.photo && 
                                     profile.photo.length > 0 &&
                                     profile.photo.trim() !== '' && 
                                     profile.photo !== DEFAULT_PROFILE_PHOTO && 
                                     !profile.photo.includes('Logo_icona') &&
                                     profile.photo.startsWith('data:image')
                
                
                if (hasValidPhoto) {
                  return <img src={profile.photo} alt={profile.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                } else {
                  const initials = getInitials(profile.name)
                  return (
                    <div className="notary-photo-placeholder">
                      <span className="notary-initials">{initials}</span>
                    </div>
                  )
                }
              })()}
            </div>

            {/* Nome + Rating sulla stessa riga - IDENTICO AL MOCK */}
            <div className="notary-card-header">
              <div className="notary-info">
                <h3 className="notary-name">{profile.name}</h3>
              </div>
              <div className="notary-rating">
                <Star size={14} className="star-icon" fill="currentColor" />
                <span>{profile.rating ? parseFloat(profile.rating).toFixed(1) : '4.7'}</span>
              </div>
            </div>

            {/* Indirizzo sotto il nome - IDENTICO AL MOCK */}
            <p className="notary-address">{profile.address}</p>

            {/* Servizi in fondo - Testo sopra, icone sotto con tooltip */}
            <div className="notary-services">
              <span className="notary-services-title">Servizi Offerti</span>
              <div className="notary-services-grid">
                {(() => {
                  // Ordine fisso dei servizi (stesso ordine della tab Vetrina)
                  const serviceOrder = ['documents', 'agenda', 'chat', 'acts', 'signature', 'pec', 'conservation']
                  
                  const enabledServices = serviceOrder
                    .filter(key => profile.services?.[key] === true)
                  
                  
                  return enabledServices.map((key, index, array) => {
                    const icon = getServiceIcon(key, true)
                    if (!icon) return null
                    
                    return (
                      <React.Fragment key={key}>
                        <div 
                          className="notary-service-item" 
                          title={getServiceTooltip(key)}
                        >
                          {icon}
                        </div>
                        {index < array.length - 1 && <span className="icon-separator"></span>}
                      </React.Fragment>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        ))}

        {/* Card Placeholder per notai bloccati - Stile identico alle card normali */}
        {placeholderCards.map((_, index) => {
          const isScrollHint = index === placeholderCards.length - 1 // Ultima card è lo scroll hint
          return (
            <div 
              key={`placeholder-${index}`} 
              className={`notary-card notary-card-placeholder ${isScrollHint && !shouldEnableScroll ? 'scroll-hint' : ''}`}
            >
              {/* Foto placeholder con icona */}
              <div className="notary-photo">
                <UserX size={48} className="placeholder-icon" strokeWidth={1.5} />
              </div>

              {/* Nome + Rating */}
              <div className="notary-card-header">
                <div className="notary-info">
                  <h3 className="placeholder-name">Notaio non disponibile</h3>
                </div>
              </div>

              {/* Indirizzo */}
              <p className="placeholder-address">Questo notaio è attualmente disattivato</p>

              {/* Servizi */}
              <div className="notary-services">
                <span className="notary-services-title">Servizi Offerti</span>
                <div className="placeholder-services-empty">Nessun servizio disponibile</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Notary Modal */}
    <NotaryModal
      notary={selectedNotary}
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onBookAppointment={handleBookAppointment}
    />

    {/* Appointment Booking Modal */}
    {showBooking && selectedNotary && (
      <AppointmentBooking
        notary={selectedNotary}
        initialDate={initialDate}
        onClose={() => setShowBooking(false)}
        onSuccess={() => {
          setShowBooking(false)
          // Toast message già gestito in AppointmentBooking
        }}
      />
    )}
  </>
  )
}

export default NotaryCards


