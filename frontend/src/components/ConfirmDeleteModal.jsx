import React, { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { formatDateItalian } from '../utils/dateUtils'
import './ConfirmModal.css'

function ConfirmDeleteModal({ appointment, onClose, onSuccess }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const isConfirmValid = confirmText.toLowerCase() === 'elimina'

  const handleConfirm = async () => {
    if (!isConfirmValid) {
      showToast('Digita "ELIMINA" per confermare', 'warning', 'Attenzione')
      return
    }

    setLoading(true)

    try {
      await appointmentExtendedService.eliminaAppuntamento(appointment.id)

      showToast(
        'Appuntamento eliminato completamente. Lo slot è ora disponibile.',
        'success',
        'Eliminazione Completata'
      )

      // Notifica aggiornamento calendario
      window.dispatchEvent(new Event('appointment-updated'))

      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Errore eliminazione appuntamento:', error)
      showToast(
        error.message || 'Errore durante l\'eliminazione dell\'appuntamento',
        'error',
        'Errore'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="confirm-modal-header delete">
          <div className="modal-icon-container delete">
            <Trash2 size={32} />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="confirm-modal-body">
          <h2 className="confirm-title">Elimina Appuntamento</h2>
          <p className="confirm-description">
            Stai per eliminare definitivamente l'appuntamento del <strong>{formatDateItalian(appointment.start_time?.split('T')[0])}</strong>.
          </p>

          <div className="danger-box">
            <AlertTriangle size={20} />
            <div className="danger-content">
              <p className="danger-title">⚠️ Attenzione: Questa azione è irreversibile!</p>
              <ul className="danger-list">
                <li>L'appuntamento sarà rimosso dal calendario del cliente</li>
                <li>L'appuntamento sarà rimosso dal tuo calendario</li>
                <li>Lo slot tornerà disponibile per nuove prenotazioni</li>
                <li>Tutti i dati associati saranno eliminati</li>
                <li>Il cliente NON riceverà alcuna notifica</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Per confermare, digita <strong>ELIMINA</strong>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Digita ELIMINA"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annulla
          </button>
          <button
            className="btn-danger-strong"
            onClick={handleConfirm}
            disabled={loading || !isConfirmValid}
          >
            {loading ? 'Eliminazione...' : 'Elimina Definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal

