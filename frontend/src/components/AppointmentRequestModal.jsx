import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, FileText, MapPin, CheckCircle, XCircle, Edit2 } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { parseDateTimeLocal } from '../utils/dateUtils'
import './AppointmentRequestModal.css'

function AppointmentRequestModal({ notifica, onClose, onAction }) {
  const [loading, setLoading] = useState(false)
  const [appuntamento, setAppuntamento] = useState(null)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (notifica?.appuntamento) {
      loadAppuntamentoDettaglio()
    }
  }, [notifica])

  const loadAppuntamentoDettaglio = async () => {
    if (!notifica?.appuntamento) {
      showToast('Errore: notifica non valida', 'error', 'Errore')
      onClose()
      return
    }

    try {
      setLoading(true)
      const data = await appointmentExtendedService.getAppuntamentoDettaglio(notifica.appuntamento)
      
      if (!data || !data.id) {
        throw new Error('Dati appuntamento non validi')
      }
      
      setAppuntamento(data)
    } catch (error) {
      console.error('Errore caricamento dettagli appuntamento:', error)
      showToast('Errore caricamento dettagli appuntamento', 'error', 'Errore')
      setTimeout(() => onClose(), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    try {
      setLoading(true)
      await appointmentExtendedService.confermaAppuntamento(appuntamento.id, {})
      
      // Segna notifica come letta
      if (notifica && !notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Appuntamento confermato con successo!', 'success', 'Confermato')
      
      // Ricarica calendario e notifiche
      window.dispatchEvent(new CustomEvent('appointment-updated'))
      window.dispatchEvent(new CustomEvent('notifications-updated'))
      
      onAction && onAction('accepted')
      onClose()
    } catch (error) {
      console.error('Errore conferma:', error)
      const errorMessage = error.message || error.response?.data?.error || 'Errore durante la conferma dell\'appuntamento'
      
      // Se l'appuntamento è già stato gestito, chiudi modale e ricarica
      if (errorMessage.includes('nello stato') || errorMessage.includes('già')) {
        showToast('Questo appuntamento è già stato gestito', 'warning', 'Attenzione')
        window.dispatchEvent(new CustomEvent('notifications-updated'))
        onClose()
      } else {
        showToast(errorMessage, 'error', 'Errore')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      await appointmentExtendedService.rifiutaAppuntamento(appuntamento.id, rejectReason.trim() || '')
      
      // Segna notifica come letta
      if (notifica && !notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Appuntamento rifiutato con successo!', 'success', 'Rifiutato')
      
      // Ricarica calendario e notifiche
      window.dispatchEvent(new CustomEvent('appointment-updated'))
      window.dispatchEvent(new CustomEvent('notifications-updated'))
      
      onAction && onAction('rejected')
      onClose()
    } catch (error) {
      console.error('Errore rifiuto:', error)
      const errorMessage = error.message || error.response?.data?.error || 'Errore durante il rifiuto dell\'appuntamento'
      
      // Se l'appuntamento è già stato gestito, chiudi modale e ricarica
      if (errorMessage.includes('nello stato') || errorMessage.includes('già')) {
        showToast('Questo appuntamento è già stato gestito', 'warning', 'Attenzione')
        window.dispatchEvent(new CustomEvent('notifications-updated'))
        onClose()
      } else {
        showToast(errorMessage, 'error', 'Errore')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleModify = async () => {
    try {
      // Segna notifica come letta
      if (notifica && !notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Funzione modifica appuntamento in arrivo', 'info', 'Info')
      
      // Ricarica notifiche per farla scomparire
      window.dispatchEvent(new CustomEvent('notifications-updated'))
      
      onAction && onAction('modified')
      onClose()
      
      // TODO: Implementare modale per proporre nuova data/ora
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  if (!notifica || !notifica.appuntamento) {
    return null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    // Usa parseDateTimeLocal per gestire correttamente il timezone
    const date = parseDateTimeLocal(dateString)
    if (!date) return 'N/A'
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = parseDateTimeLocal(dateString)
    if (!date) return 'N/A'
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const getDuration = () => {
    if (!appuntamento?.start_time || !appuntamento?.end_time) return 'N/A'
    const start = parseDateTimeLocal(appuntamento.start_time)
    const end = parseDateTimeLocal(appuntamento.end_time)
    if (!start || !end) return 'N/A'
    const minutes = Math.floor((end - start) / 1000 / 60)
    return `${minutes} minuti`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="appointment-request-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Calendar className="modal-header-icon" size={24} />
            <h2>Richiesta Appuntamento</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Caricamento dettagli...</p>
            </div>
          ) : appuntamento ? (
            <>
              {/* Cliente Info */}
              <div className="detail-section">
                <div className="detail-section-header">
                  <User size={20} />
                  <h3>Informazioni Cliente</h3>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nome:</span>
                  <span className="detail-value">{appuntamento.client_name || 'N/A'}</span>
                </div>
                {appuntamento.created_by_email && (
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{appuntamento.created_by_email}</span>
                  </div>
                )}
              </div>

              {/* Appuntamento Info */}
              <div className="detail-section">
                <div className="detail-section-header">
                  <FileText size={20} />
                  <h3>Dettagli Appuntamento</h3>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tipologia Atto:</span>
                  <span className="detail-value highlight">{appuntamento.tipologia_atto_nome || 'Consulenza generica'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tipo:</span>
                  <span className="detail-value">{appuntamento.tipo_display || appuntamento.tipo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data:</span>
                  <span className="detail-value">{formatDate(appuntamento.start_time)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Orario Inizio:</span>
                  <span className="detail-value">{formatTime(appuntamento.start_time)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Orario Fine:</span>
                  <span className="detail-value">{formatTime(appuntamento.end_time)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Durata Totale:</span>
                  <span className="detail-value">{getDuration()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Stato:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${appuntamento.status === 'provvisorio' ? 'provisional' : ''}`}>
                      {appuntamento.status_display || appuntamento.status || 'N/A'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Richiesto il:</span>
                  <span className="detail-value">{formatDate(appuntamento.created_at)}</span>
                </div>
              </div>

              {/* Location Info */}
              {appuntamento.location && (
                <div className="detail-section">
                  <div className="detail-section-header">
                    <MapPin size={20} />
                    <h3>Luogo</h3>
                  </div>
                  <div className="detail-item">
                    <span className="detail-value">{appuntamento.location}</span>
                  </div>
                </div>
              )}

              {/* Note */}
              {appuntamento.descrizione && (
                <div className="detail-section">
                  <div className="detail-section-header">
                    <FileText size={20} />
                    <h3>Note Cliente</h3>
                  </div>
                  <div className="detail-item">
                    <p className="detail-notes">{appuntamento.descrizione}</p>
                  </div>
                </div>
              )}

              {/* Reject Reason Input */}
              {showRejectReason && (
                <div className="detail-section reject-section">
                  <div className="detail-section-header">
                    <XCircle size={20} />
                    <h3>Motivo Rifiuto</h3>
                  </div>
                  <textarea
                    className="reject-textarea"
                    placeholder="Inserisci il motivo del rifiuto (opzionale)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="modal-error">
              <p>Impossibile caricare i dettagli dell'appuntamento</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {!showRejectReason ? (
            <>
              <button
                className="modal-action-btn accept"
                onClick={handleAccept}
                disabled={loading || !appuntamento}
              >
                <CheckCircle size={20} />
                <span>Accetta</span>
              </button>
              
              <button
                className="modal-action-btn modify"
                onClick={handleModify}
                disabled={loading || !appuntamento}
              >
                <Edit2 size={20} />
                <span>Modifica</span>
              </button>
              
              <button
                className="modal-action-btn reject"
                onClick={() => setShowRejectReason(true)}
                disabled={loading || !appuntamento}
              >
                <XCircle size={20} />
                <span>Rifiuta</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="modal-action-btn cancel"
                onClick={() => {
                  setShowRejectReason(false)
                  setRejectReason('')
                }}
                disabled={loading}
              >
                <span>Annulla</span>
              </button>
              
              <button
                className="modal-action-btn reject"
                onClick={handleReject}
                disabled={loading}
              >
                <XCircle size={20} />
                <span>Conferma Rifiuto</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentRequestModal

