import React from 'react'
import { FileText, User, Phone, Video, Home, Building2, Gift, Briefcase, FileSignature, Scale, Settings, Clock, Calendar as CalendarIcon, MapPin, Archive, FolderOpen, PenTool, Upload } from 'lucide-react'
import './DeedDetailCard.css'

// Funzione per determinare l'icona in base al tipo di atto
const getActIcon = (description) => {
  const desc = description.toLowerCase()
  
  if (desc.includes('immobile') || desc.includes('casa') || desc.includes('appartamento') || desc.includes('rogito')) {
    return Home
  } else if (desc.includes('azienda') || desc.includes('società') || desc.includes('costituzione')) {
    return Building2
  } else if (desc.includes('donazione') || desc.includes('regalo')) {
    return Gift
  } else if (desc.includes('mutuo') || desc.includes('finanziamento')) {
    return Briefcase
  } else if (desc.includes('testamento') || desc.includes('successione')) {
    return FileSignature
  } else if (desc.includes('procura') || desc.includes('delega')) {
    return Scale
  } else {
    return FileText
  }
}

function DeedDetailCard({ appointment, onEnter, documentiCaricati = 0, documentiTotali = 0, documentiApprovati = 0 }) {
  // Se non c'è appuntamento selezionato, mostra placeholder
  if (!appointment) {
    return (
      <div className="deed-card deed-card-empty">
        <div className="deed-empty-content">
          <CalendarIcon size={64} className="deed-empty-icon" />
          <p className="deed-empty-text">Seleziona un appuntamento per visualizzare i dettagli</p>
        </div>
      </div>
    )
  }
  
  // Handler per il click sul pulsante "Entra"
  const handleEnterClick = () => {
    console.log('📤 DeedDetailCard - handleEnterClick chiamato con appointment:', appointment)
    console.log('🔍 onEnter type:', typeof onEnter, 'value:', onEnter)
    if (onEnter) {
      console.log('✅ onEnter esiste, chiamando onEnter(appointment)')
      try {
        const result = onEnter(appointment)
        console.log('✅ onEnter(appointment) eseguito con successo, result:', result)
      } catch (error) {
        console.error('❌ ERRORE durante onEnter:', error)
      }
    } else {
      console.log('❌ onEnter NON esiste!')
    }
  }

  // Mantieni sempre lo stesso layout, popola dinamicamente i dati disponibili
  const actType = appointment.appointmentType || appointment.title || 'Appuntamento'
  const ActIcon = getActIcon(actType)
  
  // Usa i dati dall'oggetto rawData se disponibile, altrimenti dall'appointment stesso
  const appointmentData = appointment.rawData || appointment
  
  // ✅ Determina ruolo utente SUBITO (serve per logica documenti)
  const userRole = appointment.userRole || 'client'  // Determina se è vista cliente o notaio
  
  // ✅ Stato appuntamento
  const status = appointment.status || appointmentData.status || appointmentData.stato || 'provvisorio'
  const statusUpper = status.toUpperCase()
  const isConfirmed = statusUpper === 'CONFERMATO' || statusUpper === 'DOCUMENTI_IN_CARICAMENTO'
  
  // ✅ Logica documenti
  const tuttiDocumentiCaricati = documentiTotali > 0 && documentiCaricati === documentiTotali
  const tuttiDocumentiApprovati = documentiTotali > 0 && documentiApprovati === documentiTotali
  const canOpenDocuments = userRole === 'client' ? isConfirmed : tuttiDocumentiCaricati
  const canEnter = tuttiDocumentiApprovati
  
  const clientName = appointment.clientName || 'Cliente'
  const notaryName = appointment.notaryName || appointmentData.notaio_nome || 'Notaio'  // ✅ Nome del notaio
  
  // ✅ Determina il luogo in base ai servizi selezionati
  const services = appointment.services || []
  const isInPresence = services.includes('presence')
  const notaryAddress = appointmentData.location || appointment.location || 'Piazza Cavour n.19 - Dogana (S. Marino)'
  const location = isInPresence ? notaryAddress : 'Da Remoto su piattaforma Digital Notary'
  
  return (
    <div className="deed-card deed-card-active">
      {/* ✅ Badge pallino stato in alto a destra */}
      <div className="status-badge-dot-container status-badge-top-right">
        <div 
          className={`status-badge-dot status-${status.toLowerCase()}`}
          data-tooltip={
            statusUpper === 'PROVVISORIO' ? 'Da Confermare' :
            statusUpper === 'CONFERMATO' ? 'Confermato dal Notaio' :
            statusUpper === 'ANNULLATO' ? 'Annullato' :
            statusUpper === 'DOCUMENTI_IN_CARICAMENTO' ? 'In Lavorazione' :
            statusUpper === 'DOCUMENTI_VERIFICATI' ? 'Verificato' :
            statusUpper === 'RIFIUTATO' ? 'Rifiutato' :
            status
          }
        ></div>
      </div>

      {/* ✅ Titolo con icona */}
      <div className="deed-title-section">
        <ActIcon size={20} className="deed-title-icon" />
        <h3 className="deed-title">{actType}</h3>
      </div>

      {/* ✅ Mostra Nome Notaio per cliente, Nome Cliente per notaio */}
      <div className="deed-section deed-section-person">
        <p className="deed-person-line">
          <User size={16} className="deed-person-icon" />
          <span className="deed-person-name">
            {userRole === 'client' ? notaryName : clientName}
          </span>
        </p>
      </div>

      {/* ✅ Orario appuntamento */}
      {appointment.time && (
        <div className="deed-section deed-section-time">
          <p className="deed-time-line">
            <Clock size={16} className="deed-time-icon" />
            <span className="deed-time-text">{appointment.time}</span>
          </p>
        </div>
      )}

      <div className="deed-section deed-section-parties">
        <p className="deed-party">Luogo: <span className="deed-location-text">{location}</span></p>
      </div>

      <div className="deed-section-services">
        <p className="deed-services-title">
          <Settings size={16} className="deed-services-icon" />
          <span>Servizi Selezionati</span>
        </p>
        
        {/* ✅ Tutti i 6 servizi dello Step 3 del wizard */}
        {appointment.services && appointment.services.length > 0 && (
          <div className="deed-services-icons">
            {/* 1. In Presenza */}
            {appointment.services.includes('presence') && (
              <div className="service-icon-wrapper" data-service-tooltip="In Presenza">
                <MapPin size={18} className="service-icon" />
              </div>
            )}
            
            {/* 2. Video Chiamata */}
            {appointment.services.includes('video') && (
              <div className="service-icon-wrapper" data-service-tooltip="Video Chiamata">
                <Video size={18} className="service-icon" />
              </div>
            )}
            
            {/* 3. Telefonata */}
            {appointment.services.includes('phone') && (
              <div className="service-icon-wrapper" data-service-tooltip="Telefonata">
                <Phone size={18} className="service-icon" />
              </div>
            )}
            
            {/* 4. Conservazione */}
            {appointment.services.includes('conservation') && (
              <div className="service-icon-wrapper" data-service-tooltip="Conservazione">
                <Archive size={18} className="service-icon" />
              </div>
            )}
            
            {/* 5. Cartella Condivisa */}
            {appointment.services.includes('shared_folder') && (
              <div className="service-icon-wrapper" data-service-tooltip="Cartella Condivisa">
                <FolderOpen size={18} className="service-icon" />
              </div>
            )}
            
            {/* 6. Firma Digitale */}
            {appointment.services.includes('digital_signature') && (
              <div className="service-icon-wrapper" data-service-tooltip="Firma Digitale">
                <PenTool size={18} className="service-icon" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ Sezione Documenti Richiesti */}
      <div className="deed-section-documents">
        <p className="deed-documents-title">
          <FileText size={16} className="deed-documents-icon" />
          <span>Documenti Richiesti</span>
        </p>
        
        {/* Box documenti con badge esterno */}
        <div className="deed-documents-container">
          <div 
            className={`deed-documents-upload ${!canOpenDocuments ? 'disabled' : ''}`}
            onClick={canOpenDocuments ? handleEnterClick : undefined}
          >
            <Upload size={18} className="deed-upload-icon" />
            <div className="deed-upload-content">
              <p className="deed-upload-text">
                {userRole === 'notary' ? 'Documenti Caricati' : 'Carica i Documenti'}
              </p>
            </div>
          </div>
          
          {/* Badge contatore fuori dal box */}
          <span className={`deed-documents-badge ${tuttiDocumentiCaricati ? 'complete' : 'incomplete'}`}>
            {documentiCaricati}/{documentiTotali}
          </span>
        </div>
      </div>

      {/* ✅ Mostra pulsante Entra solo se tutti i documenti sono approvati */}
      {isConfirmed && canEnter && (
        <button className="deed-btn">Entra</button>
      )}
    </div>
  )
}

export default DeedDetailCard

