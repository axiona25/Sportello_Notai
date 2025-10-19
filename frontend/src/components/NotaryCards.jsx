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
  User
} from 'lucide-react'
import notaryProfileService from '../services/notaryProfileService'
import NotaryModal from './NotaryModal'
import AppointmentBooking from './AppointmentBooking'
import './NotaryCards.css'

// Logo placeholder per profili senza immagine
const DEFAULT_PROFILE_PHOTO = 'data:image/png;base64,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'

function NotaryCards() {
  const [profiles, setProfiles] = useState([])
  const [selectedNotary, setSelectedNotary] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showBooking, setShowBooking] = useState(false)

  const loadProfiles = async (forceRefresh = false) => {
    console.log('📋 Caricamento profili dal backend...')
    const notaryProfiles = await notaryProfileService.getAllProfiles(!forceRefresh)
    
    console.log(`✅ ${notaryProfiles.length} profili caricati`)
    
    // Debug foto profilo
    notaryProfiles.forEach((profile, index) => {
      const photoInfo = {
        hasPhoto: !!profile.photo,
        isEmpty: profile.photo === '',
        isNull: profile.photo === null,
        photoLength: profile.photo?.length || 0,
        photoStart: profile.photo?.substring(0, 50) || 'N/A'
      }
      console.log(`📸 Profilo ${index + 1} (${profile.name}):`)
      console.log('  - hasPhoto:', photoInfo.hasPhoto)
      console.log('  - isEmpty:', photoInfo.isEmpty)
      console.log('  - isNull:', photoInfo.isNull)
      console.log('  - photoLength:', photoInfo.photoLength)
      console.log('  - photoStart:', photoInfo.photoStart)
    })
    
    if (notaryProfiles[0]?.services) {
      console.log('🔧 Servizi profilo 1:', JSON.stringify(notaryProfiles[0].services, null, 2))
      const enabledServices = Object.entries(notaryProfiles[0].services)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key)
      console.log('✅ Servizi ABILITATI:', enabledServices)
      console.log('📊 Totale abilitati:', enabledServices.length)
    }
    
    setProfiles(notaryProfiles)
  }

  useEffect(() => {
    // Carica i profili notai al mount
    loadProfiles()

    // Custom event per aggiornamenti interni (quando notaio salva impostazioni)
    const handleProfileUpdate = (event) => {
      console.log('📡 Ricevuto evento notaryProfileUpdated!')
      console.log('📊 Dettagli evento:', event.detail)
      console.log('🔄 Ricaricando profili con forceRefresh...')
      loadProfiles(true) // Force refresh senza cache
    }

    // Polling ogni 10 secondi per aggiornamenti real-time tra browser diversi
    const stopPolling = notaryProfileService.startPolling((newProfiles) => {
      console.log(`🔄 Polling: ${newProfiles.length} profili aggiornati`)
      setProfiles(newProfiles)
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

  return (
    <>
      <div className="notary-cards-section">
        <h2 className="notary-cards-title">Notai Disponibili</h2>
        <div className="notary-cards-grid">
          {profiles.map((profile) => (
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
                
                console.log(`🖼️ RENDER ${profile.name}:`)
                console.log('  - photo value:', profile.photo === '' ? '""(EMPTY)' : (profile.photo === null ? 'null' : `${profile.photo?.length} chars`))
                console.log('  - hasValidPhoto:', hasValidPhoto)
                console.log('  - willShowPlaceholder:', !hasValidPhoto)
                console.log('  - showing:', hasValidPhoto ? 'FOTO REALE' : '🔵 LOGO SU BLU')
                
                if (hasValidPhoto) {
                  return <img src={profile.photo} alt={profile.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                } else {
                  console.log(`🎨 RENDERING PLACEHOLDER per ${profile.name} senza foto`)
                  return (
                    <div className="notary-photo-placeholder">
                      <User 
                        size={64} 
                        color="white" 
                        strokeWidth={1.5}
                        style={{ opacity: 0.9 }}
                      />
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
                  const enabledServices = Object.entries(profile.services || {})
                    .filter(([_, enabled]) => enabled)
                  
                  console.log(`🎨 Rendering ${enabledServices.length} servizi per ${profile.name}:`, 
                    enabledServices.map(([key]) => key))
                  
                  return enabledServices.map(([key, enabled], index, array) => {
                    const icon = getServiceIcon(key, enabled)
                    if (!icon) return null
                    
                    return (
                      <React.Fragment key={key}>
                        <div 
                          className="notary-service-item" 
                          title={getServiceLabel(key)}
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
        onClose={() => setShowBooking(false)}
        onSuccess={() => {
          setShowBooking(false)
          alert('Appuntamento prenotato con successo!')
        }}
      />
    )}
  </>
  )
}

export default NotaryCards


