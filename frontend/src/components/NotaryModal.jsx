import React from 'react'
import { ArrowLeft, Star, Folder, Mail, PenTool, Video } from 'lucide-react'
import './NotaryModal.css'

function NotaryModal({ notary, isOpen, onClose }) {
  if (!isOpen || !notary) return null

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
            <img src={notary.image} alt={notary.name} className="modal-notary-image" />
            
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

          <button className="modal-select-btn">Seleziona</button>
        </div>
      </div>
    </>
  )
}

export default NotaryModal

