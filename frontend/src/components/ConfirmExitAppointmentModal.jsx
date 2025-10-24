import React from 'react'
import { AlertTriangle } from 'lucide-react'
import './ConfirmExitAppointmentModal.css'

function ConfirmExitAppointmentModal({ onClose, onConfirm }) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="confirm-exit-overlay" onClick={onClose}>
      <div className="confirm-exit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-exit-icon">
          <AlertTriangle size={48} />
        </div>
        
        <h3 className="confirm-exit-title">Uscire dall'appuntamento?</h3>
        
        <p className="confirm-exit-message">
          Sei sicuro di voler uscire dall'appuntamento? La videochiamata verrà terminata.
        </p>
        
        <div className="confirm-exit-actions">
          <button className="confirm-exit-btn confirm-exit-cancel" onClick={onClose}>
            Annulla
          </button>
          <button className="confirm-exit-btn confirm-exit-confirm" onClick={handleConfirm}>
            Esci
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmExitAppointmentModal

