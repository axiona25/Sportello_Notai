import React from 'react'
import { FileText, User, Phone, Video, Home, Building2, Gift, Briefcase, FileSignature, Scale, Settings, Clock, Calendar as CalendarIcon, MapPin, Archive, FolderOpen, PenTool, Upload, Eye } from 'lucide-react'
import { useAppointmentRoom } from '../contexts/AppointmentRoomContext'
import authService from '../services/authService'
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
  const { enterAppointment } = useAppointmentRoom()
  
  // 🔑 Leggi il ruolo dalla SESSIONE CORRENTE (JWT token)
  const userRole = authService.getUserRole()
  
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

  // Mantieni sempre lo stesso layout, popola dinamicamente i dati disponibili
  const actType = appointment.appointmentType || appointment.title || 'Appuntamento'
  const ActIcon = getActIcon(actType)
  
  // Usa i dati dall'oggetto rawData se disponibile, altrimenti dall'appointment stesso
  const appointmentData = appointment.rawData || appointment
  
  // ✅ Stato appuntamento
  const status = appointment.status || appointmentData.status || appointmentData.stato || 'provvisorio'
  const statusUpper = status.toUpperCase()
  const isConfirmed = statusUpper === 'CONFERMATO' || 
                      statusUpper === 'DOCUMENTI_IN_CARICAMENTO' ||
                      statusUpper === 'DOCUMENTI_IN_VERIFICA' ||
                      statusUpper === 'DOCUMENTI_PARZIALI' ||  // ✅ Permette accesso se documenti rifiutati
                      statusUpper === 'DOCUMENTI_VERIFICATI' ||
                      statusUpper === 'PRONTO_ATTO_VIRTUALE' ||
                      statusUpper === 'IN_CORSO' ||
                      statusUpper === 'COMPLETATO'
  
  // ✅ Logica documenti
  const tuttiDocumentiCaricati = documentiTotali > 0 && documentiCaricati === documentiTotali
  const tuttiDocumentiApprovati = documentiTotali > 0 && documentiApprovati === documentiTotali
  // Permetti apertura modale documenti se confermato (per tutti i ruoli)
  const canOpenDocuments = isConfirmed
  const canEnter = tuttiDocumentiApprovati
  
  // ✅ Stato badge documenti: grigio / giallo / verde
  const getDocumentsStatus = () => {
    if (documentiCaricati === 0 && documentiApprovati === 0) {
      return 'empty' // Grigio: niente caricato
    } else if (tuttiDocumentiCaricati && tuttiDocumentiApprovati) {
      return 'complete' // Verde: tutto caricato e approvato
    } else if (tuttiDocumentiCaricati && !tuttiDocumentiApprovati) {
      return 'pending' // Giallo: tutto caricato ma non tutto approvato
    } else {
      return 'incomplete' // Default: parziale
    }
  }
  
  const documentsStatus = getDocumentsStatus()
  
  // ✅ Nomi da API (stesso formato delle mini-card)
  const clientName = appointmentData.client_name || appointment.clientName || 'Cliente'
  const notaryName = appointmentData.notaio_nome || appointment.notaryName || 'Notaio'
  
  // ✅ Determina il luogo in base ai servizi selezionati
  const services = appointment.services || []
  const isInPresence = services.includes('presence')
  const notaryAddress = appointmentData.location || appointment.location || 'Piazza Cavour n.19 - Dogana (S. Marino)'
  const location = isInPresence ? notaryAddress : 'Da Remoto su piattaforma Digital Notary'
  
  // Handler per aprire la modale documenti (box "Consulta Documenti")
  const handleDocumentsClick = () => {
    if (onEnter) {
      onEnter(appointment)
    }
  }

  // Handler per entrare nella stanza video (pulsante "Entra")
  const handleEnterAppointmentClick = () => {
    // Entra nell'appuntamento video (tutti i documenti approvati)
    if (canEnter) {
      // AppointmentRoom legge il ruolo direttamente dalla sessione corrente (JWT token)
      enterAppointment(appointment)
    }
  }
  
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
                    statusUpper === 'DOCUMENTI_IN_VERIFICA' ? 'Documenti in Verifica' :
                    statusUpper === 'DOCUMENTI_PARZIALI' ? 'Alcuni Documenti Rifiutati' :
                    statusUpper === 'DOCUMENTI_VERIFICATI' ? 'Verificato' :
                    statusUpper === 'PRONTO_ATTO_VIRTUALE' ? 'Pronto per Atto' :
                    statusUpper === 'IN_CORSO' ? 'In Corso' :
                    statusUpper === 'COMPLETATO' ? 'Completato' :
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
          {(userRole === 'client' || userRole === 'cliente') ? (
            <>
              <Scale size={16} className="deed-person-icon" />
              <span className="deed-person-name">{notaryName}</span>
            </>
          ) : (
            <>
              <User size={16} className="deed-person-icon" />
              <span className="deed-person-name">{clientName}</span>
            </>
          )}
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
            onClick={canOpenDocuments ? handleDocumentsClick : undefined}
          >
            {/* ✅ Icona dinamica: Eye se tutti caricati (solo cliente), Upload altrimenti */}
            {(userRole === 'notary' || userRole === 'notaio' || userRole === 'admin') ? (
              <FolderOpen size={18} className="deed-upload-icon" />
            ) : tuttiDocumentiCaricati ? (
              <Eye size={18} className="deed-upload-icon" />
            ) : (
              <Upload size={18} className="deed-upload-icon" />
            )}
            
            <div className="deed-upload-content">
              <p className="deed-upload-text">
                {(userRole === 'notary' || userRole === 'notaio' || userRole === 'admin') 
                  ? 'Documenti Caricati' 
                  : tuttiDocumentiCaricati 
                    ? 'Consulta Documenti'
                    : 'Carica i Documenti'
                }
              </p>
            </div>
          </div>
          
          {/* Badge contatore fuori dal box - 3 stati: empty (grigio), pending (giallo), complete (verde) */}
          <div className={`deed-documents-badge ${documentsStatus}`}>
            <div className="badge-row">
              <span className="badge-label">Caricati:</span>
              <span className="badge-value">{documentiCaricati}/{documentiTotali}</span>
            </div>
            <div className="badge-row">
              <span className="badge-label">Approvati:</span>
              <span className="badge-value">{documentiApprovati}/{documentiTotali}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Mostra pulsante Entra solo se tutti i documenti sono approvati */}
      {isConfirmed && canEnter && (
        <button className="deed-btn" onClick={handleEnterAppointmentClick}>
          Entra
        </button>
      )}
    </div>
  )
}

export default DeedDetailCard

