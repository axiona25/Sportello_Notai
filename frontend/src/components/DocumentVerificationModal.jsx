import React, { useState, useEffect } from 'react'
import { X, FileText, Check, XCircle, Clock, AlertCircle, Download, Eye } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import './AppointmentDetailModal.css'
import './DocumentVerificationModal.css'

function DocumentVerificationModal({ appointment, onClose, onDocumentVerified }) {
  const [activeTab, setActiveTab] = useState('documenti')
  const [documenti, setDocumenti] = useState([])
  const [loadingDocumenti, setLoadingDocumenti] = useState(false)
  const [verifyingDoc, setVerifyingDoc] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (appointment) {
      loadDocumenti()
    }
  }, [appointment])

  const loadDocumenti = async () => {
    try {
      setLoadingDocumenti(true)
      const docs = await appointmentExtendedService.getDocumentiAppuntamento(appointment.id)
      setDocumenti(Array.isArray(docs) ? docs : [])
    } catch (error) {
      console.error('Errore caricamento documenti:', error)
      showToast('Errore caricamento documenti', 'error', 'Errore')
    } finally {
      setLoadingDocumenti(false)
    }
  }

  const handleAcceptDocument = async (documentoId) => {
    try {
      setVerifyingDoc(documentoId)
      await appointmentExtendedService.verificaDocumento(documentoId, 'accetta', '', internalNote)
      showToast('Documento accettato', 'success', 'Accettato!')
      await loadDocumenti()
      if (onDocumentVerified) onDocumentVerified()
    } catch (error) {
      console.error('Errore accettazione documento:', error)
      showToast('Errore nell\'accettazione', 'error', 'Errore')
    } finally {
      setVerifyingDoc(null)
      setInternalNote('')
    }
  }

  const handleRejectClick = (documento) => {
    setSelectedDoc(documento)
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectNote.trim()) {
      showToast('Inserisci un motivo del rifiuto', 'warning', 'Attenzione')
      return
    }

    try {
      setVerifyingDoc(selectedDoc.id)
      await appointmentExtendedService.verificaDocumento(
        selectedDoc.id,
        'rifiuta',
        rejectNote,
        internalNote
      )
      showToast('Documento rifiutato', 'success', 'Rifiutato')
      setShowRejectModal(false)
      setRejectNote('')
      setInternalNote('')
      setSelectedDoc(null)
      await loadDocumenti()
      if (onDocumentVerified) onDocumentVerified()
    } catch (error) {
      console.error('Errore rifiuto documento:', error)
      showToast('Errore nel rifiuto', 'error', 'Errore')
    } finally {
      setVerifyingDoc(null)
    }
  }

  const handleRejectCancel = () => {
    setShowRejectModal(false)
    setRejectNote('')
    setInternalNote('')
    setSelectedDoc(null)
  }

  const getStatoBadge = (stato) => {
    switch (stato) {
      case 'DA_CARICARE':
        return { label: 'Da Caricare', icon: AlertCircle, class: 'badge-pending' }
      case 'CARICATO':
      case 'IN_VERIFICA':
        return { label: 'Da Verificare', icon: Clock, class: 'badge-verifying' }
      case 'ACCETTATO':
        return { label: 'Accettato', icon: Check, class: 'badge-accepted' }
      case 'RIFIUTATO':
        return { label: 'Rifiutato', icon: XCircle, class: 'badge-rejected' }
      default:
        return { label: 'Sconosciuto', icon: AlertCircle, class: 'badge-unknown' }
    }
  }

  const getDocumentsStats = () => {
    const total = documenti.length
    const accepted = documenti.filter(d => d.stato === 'ACCETTATO').length
    const rejected = documenti.filter(d => d.stato === 'RIFIUTATO').length
    const pending = documenti.filter(d => ['CARICATO', 'IN_VERIFICA'].includes(d.stato)).length
    return { total, accepted, rejected, pending }
  }

  if (!appointment) return null

  const stats = getDocumentsStats()

  return (
    <>
      <div className="appointment-modal-overlay" onClick={onClose}>
        <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="appointment-modal-header">
            <div className="appointment-modal-header-content">
              <h2>Verifica Documenti - {appointment.cliente_nome}</h2>
              <p className="appointment-modal-subtitle">
                {appointment.tipologia_atto_nome || appointment.appointment_type}
                {' | '}
                {appointment.date} - {appointment.start_time?.substring(0, 5)}
              </p>
            </div>
            <button className="appointment-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="verification-stats">
            <div className="stat-item">
              <FileText size={18} />
              <span>Totali: {stats.total}</span>
            </div>
            <div className="stat-item stat-accepted">
              <Check size={18} />
              <span>Accettati: {stats.accepted}</span>
            </div>
            <div className="stat-item stat-rejected">
              <XCircle size={18} />
              <span>Rifiutati: {stats.rejected}</span>
            </div>
            <div className="stat-item stat-pending">
              <Clock size={18} />
              <span>Da Verificare: {stats.pending}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="appointment-modal-tabs">
            <button
              className={`appointment-modal-tab ${activeTab === 'documenti' ? 'active' : ''}`}
              onClick={() => setActiveTab('documenti')}
            >
              <FileText size={18} />
              Verifica Documenti
            </button>
            <button
              className={`appointment-modal-tab ${activeTab === 'dettagli' ? 'active' : ''}`}
              onClick={() => setActiveTab('dettagli')}
            >
              <Eye size={18} />
              Dettagli Appuntamento
            </button>
          </div>

          {/* Content */}
          <div className="appointment-modal-body">
            {activeTab === 'dettagli' && (
              <div className="appointment-details">
                <div className="detail-row">
                  <span className="detail-label">Cliente:</span>
                  <span className="detail-value">{appointment.cliente_nome}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tipo Atto:</span>
                  <span className="detail-value">{appointment.tipologia_atto_nome}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Data:</span>
                  <span className="detail-value">{appointment.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Orario:</span>
                  <span className="detail-value">
                    {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}
                  </span>
                </div>
                {appointment.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Note Cliente:</span>
                    <span className="detail-value">{appointment.notes}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documenti' && (
              <div className="appointment-documents">
                {loadingDocumenti ? (
                  <div className="loading-state">Caricamento documenti...</div>
                ) : documenti.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>Nessun documento per questo appuntamento</p>
                  </div>
                ) : (
                  <div className="documents-list">
                    {documenti.map((doc) => {
                      const statoBadge = getStatoBadge(doc.stato)
                      const StatoIcon = statoBadge.icon
                      const needsVerification = ['CARICATO', 'IN_VERIFICA'].includes(doc.stato)
                      
                      return (
                        <div key={doc.id} className={`document-item ${needsVerification ? 'needs-verification' : ''}`}>
                          <div className="document-item-header">
                            <div className="document-item-info">
                              <FileText size={20} />
                              <div>
                                <h4 className="document-item-name">
                                  {doc.document_type_name}
                                  {doc.is_obbligatorio && <span className="required-badge">Obbligatorio</span>}
                                </h4>
                                {doc.document_type_description && (
                                  <p className="document-item-description">{doc.document_type_description}</p>
                                )}
                              </div>
                            </div>
                            <div className={`stato-badge ${statoBadge.class}`}>
                              <StatoIcon size={14} />
                              <span>{statoBadge.label}</span>
                            </div>
                          </div>

                          {/* File Info */}
                          {doc.file && (
                            <div className="document-file-info">
                              <FileText size={16} />
                              <span className="document-file-name">
                                {doc.file_name || 'Documento caricato'}
                              </span>
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="document-download-btn"
                                >
                                  <Download size={16} />
                                  Scarica
                                </a>
                              )}
                            </div>
                          )}

                          {/* Verification Actions */}
                          {needsVerification && (
                            <div className="verification-actions">
                              <textarea
                                className="internal-note-input"
                                placeholder="Note interne (opzionali, visibili solo allo studio)..."
                                value={verifyingDoc === doc.id ? internalNote : ''}
                                onChange={(e) => setInternalNote(e.target.value)}
                                rows={2}
                              />
                              <div className="verification-buttons">
                                <button
                                  className="verify-btn verify-btn-accept"
                                  onClick={() => handleAcceptDocument(doc.id)}
                                  disabled={verifyingDoc === doc.id}
                                >
                                  <Check size={16} />
                                  Accetta
                                </button>
                                <button
                                  className="verify-btn verify-btn-reject"
                                  onClick={() => handleRejectClick(doc)}
                                  disabled={verifyingDoc === doc.id}
                                >
                                  <XCircle size={16} />
                                  Rifiuta
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Previous Notes */}
                          {doc.note_interne && (
                            <div className="document-internal-note">
                              <AlertCircle size={16} />
                              <span>Note interne: {doc.note_interne}</span>
                            </div>
                          )}
                          {doc.note_rifiuto && (
                            <div className="document-rejection-note">
                              <AlertCircle size={16} />
                              <span>Motivo rifiuto (inviato al cliente): {doc.note_rifiuto}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale Rifiuto */}
      {showRejectModal && selectedDoc && (
        <div className="provisional-modal-overlay" onClick={handleRejectCancel}>
          <div className="provisional-modal" onClick={(e) => e.stopPropagation()}>
            <div className="provisional-modal-header">
              <h3>Rifiuta Documento</h3>
              <button className="provisional-modal-close" onClick={handleRejectCancel}>
                <X size={20} />
              </button>
            </div>
            <div className="provisional-modal-body">
              <p className="provisional-modal-label">Motivo del rifiuto (sarà inviato al cliente):</p>
              <textarea
                className="provisional-modal-textarea"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Es: Il documento non è leggibile, ricarica una scansione più nitida..."
                rows={3}
                autoFocus
              />
              <p className="provisional-modal-label" style={{ marginTop: '16px' }}>Note interne (opzionali, visibili solo allo studio):</p>
              <textarea
                className="provisional-modal-textarea"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Note private per lo studio..."
                rows={2}
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
                disabled={!rejectNote.trim()}
              >
                Conferma Rifiuto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DocumentVerificationModal

