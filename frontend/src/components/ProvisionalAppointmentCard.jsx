import React, { useState } from 'react'
import { Clock, User, FileText, Phone, Video, Calendar as CalendarIcon, Check, X, AlertCircle } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import './AppointmentCard.css'
import './ProvisionalAppointmentCard.css'

function ProvisionalAppointmentCard({ 
  appointment, 
  onClick, 
  isSelected,
  onConfirm,
  onReject
}) {
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const { showToast } = useToast()

  const handleConfirm = async (e) => {
    e.stopPropagation()
    
    if (loading) return
    
    setLoading(true)
    try {
      await appointmentExtendedService.confermaAppuntamento(appointment.id)
      showToast('Appuntamento confermato con successo', 'success', 'Confermato!')
      if (onConfirm) onConfirm(appointment.id)
    } catch (error) {
      console.error('Errore conferma appuntamento:', error)
      showToast('Errore nella conferma dell\'appuntamento', 'error', 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectClick = (e) => {
    e.stopPropagation()
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      showToast('Inserisci un motivo del rifiuto', 'warning', 'Attenzione')
      return
    }

    setLoading(true)
    try {
      await appointmentExtendedService.rifiutaAppuntamento(appointment.id, rejectReason)
      showToast('Appuntamento rifiutato', 'success', 'Rifiutato')
      setShowRejectModal(false)
      setRejectReason('')
      if (onReject) onReject(appointment.id)
    } catch (error) {
      console.error('Errore rifiuto appuntamento:', error)
      showToast('Errore nel rifiuto dell\'appuntamento', 'error', 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectCancel = (e) => {
    if (e) e.stopPropagation()
    setShowRejectModal(false)
    setRejectReason('')
  }

  return (
    <>
      <div 
        className={`appointment-card provisional ${isSelected ? 'selected' : ''}`}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Badge Provvisorio */}
        <div className="provisional-badge">
          <AlertCircle size={14} />
          <span>DA CONFERMARE</span>
        </div>

        <h3 className="appointment-title">{appointment.tipologia_atto_nome || appointment.appointment_type}</h3>
        
        {appointment.cliente_nome && (
          <p className="appointment-client">
            <User size={14} />
            Cliente: {appointment.cliente_nome}
          </p>
        )}
        
        {appointment.notes && (
          <p className="appointment-description">{appointment.notes}</p>
        )}

        <div className="appointment-footer">
          <div className="appointment-time">
            <Clock size={16} />
            <span>{appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}</span>
          </div>
        </div>

        {/* Pulsanti Conferma/Rifiuta */}
        <div className="provisional-actions">
          <button
            className="provisional-btn provisional-btn-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            <Check size={16} />
            Conferma
          </button>
          <button
            className="provisional-btn provisional-btn-reject"
            onClick={handleRejectClick}
            disabled={loading}
          >
            <X size={16} />
            Rifiuta
          </button>
        </div>
      </div>

      {/* Modale Rifiuto */}
      {showRejectModal && (
        <div className="provisional-modal-overlay" onClick={handleRejectCancel}>
          <div className="provisional-modal" onClick={(e) => e.stopPropagation()}>
            <div className="provisional-modal-header">
              <h3>Rifiuta Appuntamento</h3>
              <button className="provisional-modal-close" onClick={handleRejectCancel}>
                <X size={20} />
              </button>
            </div>
            <div className="provisional-modal-body">
              <p className="provisional-modal-label">Motivo del rifiuto:</p>
              <textarea
                className="provisional-modal-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Spiega al cliente il motivo del rifiuto..."
                rows={4}
                autoFocus
              />
            </div>
            <div className="provisional-modal-footer">
              <button
                className="provisional-modal-btn provisional-modal-btn-cancel"
                onClick={handleRejectCancel}
              >
                Annulla
              </button>
              <button
                className="provisional-modal-btn provisional-modal-btn-confirm"
                onClick={handleRejectConfirm}
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? 'Rifiuto...' : 'Conferma Rifiuto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProvisionalAppointmentCard

