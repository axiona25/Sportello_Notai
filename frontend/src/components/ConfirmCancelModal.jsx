import React, { useState } from 'react'
import { X, AlertTriangle, XCircle } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { formatDateItalian } from '../utils/dateUtils'
import './ConfirmModal.css'

function ConfirmCancelModal({ appointment, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      showToast('Inserisci il motivo dell\'annullamento', 'warning', 'Attenzione')
      return
    }

    setLoading(true)

    try {
      await appointmentExtendedService.annullaAppuntamento(
        appointment.id,
        motivo
      )

      showToast(
        'Appuntamento annullato. Il cliente riceverà una notifica.',
        'success',
        'Annullamento Completato'
      )

      // Notifica aggiornamento calendario
      window.dispatchEvent(new Event('appointment-updated'))

      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Errore annullamento appuntamento:', error)
      showToast(
        error.message || 'Errore durante l\'annullamento dell\'appuntamento',
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
        <div className="confirm-modal-header cancel">
          <div className="modal-icon-container cancel">
            <XCircle size={32} />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="confirm-modal-body">
          <h2 className="confirm-title">Annulla Appuntamento</h2>
          <p className="confirm-description">
            Stai per annullare l'appuntamento del <strong>{formatDateItalian(appointment.start_time?.split('T')[0])}</strong>.
          </p>

          <div className="warning-box">
            <AlertTriangle size={18} />
            <div className="warning-content">
              <p className="warning-title">Cosa succede quando annulli?</p>
              <ul className="warning-list">
                <li>Il cliente riceverà una notifica di annullamento</li>
                <li>L'appuntamento sarà rimosso dal calendario del cliente</li>
                <li>Lo slot rimarrà visibile nel tuo calendario come annullato (barrato)</li>
                <li>Lo slot non sarà più prenotabile da altri clienti</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Motivo annullamento <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Spiega al cliente il motivo dell'annullamento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{motivo.length}/500</span>
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Indietro
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={loading || !motivo.trim()}
          >
            {loading ? 'Annullamento...' : 'Conferma Annullamento'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmCancelModal

