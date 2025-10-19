import React, { useState } from 'react'
import { X, Calendar, User, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import AppointmentCalendar from './AppointmentCalendar'
import appointmentService from '../services/appointmentService'
import './AppointmentBooking.css'

function AppointmentBooking({ notary, onClose, onSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [appointmentType, setAppointmentType] = useState('consulenza')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const appointmentTypes = [
    { value: 'rogito', label: 'Rogito Notarile', duration: 90 },
    { value: 'consulenza', label: 'Consulenza', duration: 45 },
    { value: 'revisione', label: 'Revisione Documenti', duration: 30 },
    { value: 'altro', label: 'Altro', duration: 30 }
  ]

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedSlot) {
      setError('Seleziona un orario disponibile')
      return
    }

    setLoading(true)
    setError(null)

    const appointmentData = {
      notary: notary.id,
      appointment_type: appointmentType,
      date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      duration_minutes: selectedSlot.duration_minutes,
      notes: notes
    }

    const result = await appointmentService.createAppointment(appointmentData)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.data)
        }
        onClose()
      }, 2000)
    } else {
      setError(result.error || 'Errore nella prenotazione. Riprova.')
    }

    setLoading(false)
  }

  const formatTime = (timeStr) => {
    return timeStr?.substring(0, 5) // HH:MM
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  return (
    <div className="appointment-booking-overlay">
      <div className="appointment-booking-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Calendar size={24} />
            <h2>Prenota un appuntamento</h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* Notary Info */}
          <div className="notary-info-card">
            <User size={20} />
            <div>
              <h3>{notary.name}</h3>
              <p>{notary.address}</p>
            </div>
          </div>

          {success ? (
            <div className="success-message">
              <CheckCircle size={48} />
              <h3>Appuntamento prenotato!</h3>
              <p>Riceverai una conferma via email appena il notaio accetterà la richiesta.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="booking-form">
              {/* Appointment Type */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={18} />
                  <span>Tipo di appuntamento</span>
                </label>
                <select 
                  className="form-select" 
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  required
                >
                  {appointmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({type.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={18} />
                  <span>Seleziona data e ora</span>
                </label>
                <AppointmentCalendar
                  notaryId={notary.id}
                  onSlotSelect={handleSlotSelect}
                />
              </div>

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <div className="selected-slot-summary">
                  <CheckCircle size={20} />
                  <div>
                    <p className="summary-label">Appuntamento selezionato:</p>
                    <p className="summary-value">
                      {formatDate(selectedSlot.date)} alle {formatTime(selectedSlot.start_time)}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={18} />
                  <span>Note aggiuntive (opzionale)</span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Descrivi brevemente il motivo dell'appuntamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Annulla
                </button>
                <button type="submit" className="btn-primary" disabled={loading || !selectedSlot}>
                  {loading ? 'Prenotazione in corso...' : 'Conferma prenotazione'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentBooking

