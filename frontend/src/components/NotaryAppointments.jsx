import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, FileText, Trash2 } from 'lucide-react'
import appointmentService from '../services/appointmentService'
import { formatDateItalian } from '../utils/dateUtils'
import './NotaryAppointments.css'

function NotaryAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [filter])

  const loadAppointments = async () => {
    setLoading(true)
    const filters = filter !== 'all' ? { status: filter } : {}
    const result = await appointmentService.getAppointments(filters)
    
    if (result.success) {
      setAppointments(result.data)
    } else {
    }
    
    setLoading(false)
  }

  const handleAccept = async (appointmentId) => {
    setActionLoading(true)
    const result = await appointmentService.acceptAppointment(appointmentId)
    
    if (result.success) {
      await loadAppointments()
    } else {
      alert('Errore nell\'accettazione: ' + result.error)
    }
    
    setActionLoading(false)
  }

  const handleReject = (appointment) => {
    setSelectedAppointment(appointment)
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!selectedAppointment) return
    
    setActionLoading(true)
    const result = await appointmentService.rejectAppointment(
      selectedAppointment.id,
      rejectionReason
    )
    
    if (result.success) {
      setShowRejectModal(false)
      setSelectedAppointment(null)
      setRejectionReason('')
      await loadAppointments()
    } else {
      alert('Errore nel rifiuto: ' + result.error)
    }
    
    setActionLoading(false)
  }

  const formatDate = (dateStr) => {
    // Usa la funzione utility che gestisce correttamente il timezone
    return formatDateItalian(dateStr, {
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    return timeStr?.substring(0, 5) // HH:MM
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'In attesa', color: 'warning', icon: AlertCircle },
      accepted: { label: 'Confermato', color: 'success', icon: CheckCircle },
      rejected: { label: 'Rifiutato', color: 'danger', icon: XCircle },
      cancelled: { label: 'Annullato', color: 'secondary', icon: XCircle },
      completed: { label: 'Completato', color: 'info', icon: CheckCircle }
    }
    
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`status-badge status-${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const types = {
      rogito: 'Rogito',
      consulenza: 'Consulenza',
      revisione: 'Revisione',
      altro: 'Altro'
    }
    return types[type] || type
  }

  return (
    <div className="notary-appointments">
      <div className="appointments-header">
        <div className="header-title">
          <Calendar size={24} />
          <h2>Gestione Appuntamenti</h2>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <AlertCircle size={16} />
            In attesa
          </button>
          <button
            className={`filter-tab ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            <CheckCircle size={16} />
            Confermati
          </button>
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutti
          </button>
        </div>
      </div>

      {loading ? (
        <div className="appointments-loading">
          <div className="spinner"></div>
          <p>Caricamento appuntamenti...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="appointments-empty">
          <Calendar size={48} />
          <h3>Nessun appuntamento</h3>
          <p>Non ci sono appuntamenti per questo filtro.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-date">
                  <Calendar size={18} />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="appointment-time">
                  <Clock size={18} />
                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="appointment-body">
                <div className="appointment-client">
                  <User size={18} />
                  <div>
                    <p className="client-name">{appointment.client_name}</p>
                    <p className="client-email">{appointment.client_email}</p>
                  </div>
                </div>

                <div className="appointment-type">
                  <FileText size={18} />
                  <span>{getTypeBadge(appointment.appointment_type)}</span>
                  <span className="duration">({appointment.duration_minutes} min)</span>
                </div>

                {appointment.notes && (
                  <div className="appointment-notes">
                    <p className="notes-label">Note del cliente:</p>
                    <p className="notes-content">{appointment.notes}</p>
                  </div>
                )}

                {appointment.rejection_reason && (
                  <div className="appointment-rejection">
                    <p className="rejection-label">Motivo del rifiuto:</p>
                    <p className="rejection-content">{appointment.rejection_reason}</p>
                  </div>
                )}
              </div>

              {appointment.status === 'pending' && (
                <div className="appointment-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleAccept(appointment.id)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={18} />
                    Accetta
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(appointment)}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} />
                    Rifiuta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rifiuta appuntamento</h3>
              <button className="btn-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Sei sicuro di voler rifiutare questo appuntamento?</p>
              <textarea
                className="rejection-textarea"
                placeholder="Motivo del rifiuto (opzionale)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Annulla
              </button>
              <button
                className="btn-confirm-reject"
                onClick={confirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rifiuto in corso...' : 'Conferma rifiuto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotaryAppointments

