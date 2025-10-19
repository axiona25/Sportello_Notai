import React from 'react'
import { ArrowLeft, Star, Folder, Mail, PenTool, Video, User } from 'lucide-react'
import './NotaryModal.css'

// Logo placeholder per profili senza immagine (stesso del NotaryCards)
const DEFAULT_PROFILE_PHOTO = 'data:image/png;base64,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'

function NotaryModal({ notary, isOpen, onClose, onBookAppointment }) {
  if (!isOpen || !notary) return null

  // Verifica se il notaio ha una foto REALE
  const hasValidPhoto = notary.photo && 
                       notary.photo.length > 0 &&
                       notary.photo.trim() !== '' && 
                       notary.photo !== DEFAULT_PROFILE_PHOTO && 
                       !notary.photo.includes('Logo_icona') &&
                       notary.photo.startsWith('data:image')

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className={`notary-modal ${isOpen ? 'open' : ''}`}>
        <div className="modal-header">
          <button className="modal-back-btn" onClick={onClose}>
            <ArrowLeft size={24} />
          </button>
          <h2 className="modal-title">Informazioni Generali</h2>
        </div>

        <div className="modal-content">
          <div className="modal-notary-profile">
            {hasValidPhoto ? (
              <img src={notary.photo} alt={notary.name} className="modal-notary-image" />
            ) : (
              <div className="modal-notary-image modal-notary-placeholder">
                <User 
                  size={64} 
                  color="white" 
                  strokeWidth={1.5}
                  style={{ opacity: 0.9 }}
                />
              </div>
            )}
            
            <h3 className="modal-notary-name">Notaio {notary.name}</h3>
            <p className="modal-notary-address">{notary.address}</p>
            
            <div className="modal-notary-rating">
              <div className="modal-stars">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    fill={i < Math.floor(notary.rating) ? '#FFC107' : 'none'}
                    color="#FFC107"
                  />
                ))}
              </div>
              <span className="modal-rating-text">{notary.rating} (22 recensioni)</span>
            </div>
          </div>

          <div className="modal-section">
            <h4 className="modal-section-title">Profilo</h4>
            <p className="modal-section-text">
              Notaio professionista con oltre 15 anni di esperienza nel settore immobiliare e delle compravendite. 
              Specializzato in atti notarili, consulenza legale e gestione documentale. Offre servizi digitali 
              innovativi per semplificare le pratiche notarili e garantire massima sicurezza e trasparenza.
            </p>
          </div>

          <div className="modal-section">
            <h4 className="modal-section-title">Servizi offerti</h4>
            <div className="modal-services">
              <div className="modal-service-item">
                <Folder size={20} className="modal-service-icon" />
                <span>Cartella Documenti Condivisa</span>
              </div>
              <div className="modal-service-item">
                <Mail size={20} className="modal-service-icon" />
                <span>PEC per invio Atto Notarile e Documenti</span>
              </div>
              <div className="modal-service-item">
                <PenTool size={20} className="modal-service-icon" />
                <span>Firma Digitale</span>
              </div>
              <div className="modal-service-item">
                <Video size={20} className="modal-service-icon" />
                <span>Video Conferenza</span>
              </div>
            </div>
          </div>

          <button className="modal-select-btn" onClick={onBookAppointment}>
            Prenota Appuntamento
          </button>
        </div>
      </div>
    </>
  )
}

export default NotaryModal

