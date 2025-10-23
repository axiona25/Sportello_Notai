import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { parseDateTimeLocal } from '../utils/dateUtils'
import './ConfirmModal.css'

function ConfirmApproveModal({ appointment, onClose, onConfirm }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  // Estrai i dati dell'appuntamento (può essere formattato o rawData)
  const appointmentData = appointment.rawData || appointment
  
  // Formatta i dati per la visualizzazione
  const clientName = appointment.clientName || appointmentData.client_name || 'N/A'
  const appointmentType = appointment.appointmentType || appointmentData.tipologia_atto_nome || appointment.title || 'N/A'
  
  // Formatta data e ora
  let formattedDate = appointment.date || 'N/A'
  let formattedTime = appointment.time || 'N/A'
  
  if (appointmentData.start_time) {
    const startDate = parseDateTimeLocal(appointmentData.start_time)
    const endDate = parseDateTimeLocal(appointmentData.end_time)
    
    if (startDate && endDate) {
      formattedDate = startDate.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      formattedTime = `${startDate.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${endDate.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(note)
      onClose()
    } catch (error) {
      console.error('Errore approvazione:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon confirm-modal-icon-approve">
            <Check size={28} />
          </div>
          <h2 className="confirm-modal-title">Approva Appuntamento</h2>
        </div>

        <div className="confirm-modal-body">
          <p className="confirm-modal-message">
            Stai per approvare l'appuntamento:
          </p>
          
          <div className="confirm-modal-info">
            <div className="confirm-modal-info-row">
              <span className="confirm-modal-label">Cliente:</span>
              <span className="confirm-modal-value">{clientName}</span>
            </div>
            <div className="confirm-modal-info-row">
              <span className="confirm-modal-label">Tipologia:</span>
              <span className="confirm-modal-value">{appointmentType}</span>
            </div>
            <div className="confirm-modal-info-row">
              <span className="confirm-modal-label">Data:</span>
              <span className="confirm-modal-value">{formattedDate}</span>
            </div>
            <div className="confirm-modal-info-row">
              <span className="confirm-modal-label">Orario:</span>
              <span className="confirm-modal-value">{formattedTime}</span>
            </div>
          </div>

          <div className="confirm-modal-input-group">
            <label htmlFor="approve-note" className="confirm-modal-label">
              Note (opzionali)
            </label>
            <textarea
              id="approve-note"
              className="confirm-modal-textarea"
              placeholder="Aggiungi eventuali note per il cliente..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="confirm-modal-warning confirm-modal-warning-info">
            <p>
              ✓ Il cliente riceverà una notifica di conferma
            </p>
          </div>
        </div>

        <div className="confirm-modal-actions">
          <button 
            className="confirm-modal-btn confirm-modal-btn-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            <X size={18} />
            Annulla
          </button>
          <button 
            className="confirm-modal-btn confirm-modal-btn-confirm confirm-modal-btn-approve" 
            onClick={handleConfirm}
            disabled={loading}
          >
            <Check size={18} />
            {loading ? 'Approvazione...' : 'Approva'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmApproveModal

