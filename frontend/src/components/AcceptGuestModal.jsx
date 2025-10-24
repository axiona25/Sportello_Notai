import React from 'react'
import { UserCheck, X } from 'lucide-react'
import './AcceptGuestModal.css'

function AcceptGuestModal({ clientName, onClose, onConfirm }) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="accept-guest-modal-overlay" onClick={onClose}>
      <div className="accept-guest-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="accept-guest-modal-header">
          <div className="accept-guest-modal-icon">
            <UserCheck size={24} />
          </div>
          <button className="accept-guest-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="accept-guest-modal-body">
          <h3>Ammetti partecipante</h3>
          <p>
            Vuoi ammettere <strong>{clientName}</strong> alla video chiamata?
          </p>
        </div>

        {/* Footer */}
        <div className="accept-guest-modal-footer">
          <button className="accept-guest-modal-btn-cancel" onClick={onClose}>
            Annulla
          </button>
          <button className="accept-guest-modal-btn-confirm" onClick={handleConfirm}>
            Ammetti
          </button>
        </div>
      </div>
    </div>
  )
}

export default AcceptGuestModal

