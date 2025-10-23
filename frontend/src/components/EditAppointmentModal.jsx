import React, { useState } from 'react'
import { X, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import AppointmentCalendar from './AppointmentCalendar'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { formatDateItalian } from '../utils/dateUtils'
import './EditAppointmentModal.css'

function EditAppointmentModal({ appointment, notaryId, onClose, onSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  // Determina l'ID del notaio da usare
  const effectiveNotaryId = appointment?.notary || appointment?.notaio || notaryId

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  const handleSave = async () => {
    if (!selectedSlot) {
      showToast('Seleziona una nuova data e orario', 'warning', 'Attenzione')
      return
    }

    setLoading(true)

    try {
      // Prepara i dati per l'aggiornamento
      const updateData = {
        start_time: `${selectedSlot.date}T${selectedSlot.start_time}`,
        end_time: `${selectedSlot.date}T${selectedSlot.end_time}`
      }

      // Aggiorna l'appuntamento
      await appointmentExtendedService.aggiornaAppuntamento(
        appointment.id,
        updateData
      )

      showToast(
        'Appuntamento modificato. Il cliente riceverà una notifica con la nuova data.',
        'success',
        'Modifica Completata'
      )

      // Notifica aggiornamento calendario
      window.dispatchEvent(new Event('appointment-updated'))

      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Errore modifica appuntamento:', error)
      showToast(
        error.message || 'Errore durante la modifica dell\'appuntamento',
        'error',
        'Errore'
      )
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeStr) => {
    return timeStr?.substring(0, 5)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-appointment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Calendar size={24} />
            <h2>Modifica Appuntamento</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Appuntamento corrente */}
        <div className="current-appointment-info">
          <div className="info-badge info-current">
            <AlertCircle size={16} />
            <span>Data attuale: {formatDateItalian(appointment.start_time?.split('T')[0])} alle {formatTime(appointment.start_time?.split('T')[1])}</span>
          </div>
          <p className="info-subtitle">Seleziona una nuova data e orario per riprogrammare l'appuntamento</p>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="calendar-section">
            <h3 className="section-title">Seleziona Nuova Data e Orario</h3>
            {effectiveNotaryId ? (
              <AppointmentCalendar
                notaryId={effectiveNotaryId}
                duration={appointment.duration_minutes || 30}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
                excludeAppointmentId={appointment.id} // Escludi l'appuntamento corrente dal calcolo degli slot
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#EF4444' }}>
                <p>Errore: ID notaio mancante</p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  Impossibile determinare l'ID del notaio dall'appuntamento o dall'utente corrente.
                </p>
              </div>
            )}
          </div>

          {/* Slot selezionato */}
          {selectedSlot && (
            <div className="selected-slot-info">
              <CheckCircle size={20} />
              <div>
                <p className="slot-label">Nuovo appuntamento:</p>
                <p className="slot-value">
                  {formatDateItalian(selectedSlot.date)} alle ore {formatTime(selectedSlot.start_time)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annulla
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || !selectedSlot}
          >
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditAppointmentModal

