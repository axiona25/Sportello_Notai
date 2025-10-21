import React, { useState, useEffect } from 'react'
import { X, FileText, Upload, Check, XCircle, Clock, AlertCircle, Download } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import './AppointmentDetailModal.css'

function AppointmentDetailModal({ appointment, onClose }) {
  const [activeTab, setActiveTab] = useState('documenti')
  const [documenti, setDocumenti] = useState([])
  const [loadingDocumenti, setLoadingDocumenti] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (appointment && appointment.stato === 'CONFERMATO') {
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

  const handleFileUpload = async (documentoId, file) => {
    try {
      setUploadingDoc(documentoId)
      await appointmentExtendedService.uploadDocumento(documentoId, file)
      showToast('Documento caricato con successo', 'success', 'Caricato!')
      await loadDocumenti() // Ricarica lista documenti
    } catch (error) {
      console.error('Errore upload documento:', error)
      showToast('Errore caricamento file', 'error', 'Errore')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleFileChange = (documentoId, event) => {
    const file = event.target.files[0]
    if (file) {
      // Controlla dimensione max (es. 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File troppo grande. Max 10MB', 'warning', 'Attenzione')
        return
      }
      handleFileUpload(documentoId, file)
    }
  }

  const getStatoBadge = (stato) => {
    switch (stato) {
      case 'DA_CARICARE':
        return { label: 'Da Caricare', icon: Upload, class: 'badge-pending' }
      case 'CARICATO':
        return { label: 'Caricato', icon: Clock, class: 'badge-uploaded' }
      case 'IN_VERIFICA':
        return { label: 'In Verifica', icon: Clock, class: 'badge-verifying' }
      case 'ACCETTATO':
        return { label: 'Accettato', icon: Check, class: 'badge-accepted' }
      case 'RIFIUTATO':
        return { label: 'Rifiutato', icon: XCircle, class: 'badge-rejected' }
      default:
        return { label: 'Sconosciuto', icon: AlertCircle, class: 'badge-unknown' }
    }
  }

  if (!appointment) return null

  return (
    <div className="appointment-modal-overlay" onClick={onClose}>
      <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="appointment-modal-header">
          <div className="appointment-modal-header-content">
            <h2>{appointment.tipologia_atto_nome || appointment.appointment_type}</h2>
            <p className="appointment-modal-subtitle">
              {appointment.date} - {appointment.start_time?.substring(0, 5)}
            </p>
          </div>
          <button className="appointment-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="appointment-modal-tabs">
          <button
            className={`appointment-modal-tab ${activeTab === 'dettagli' ? 'active' : ''}`}
            onClick={() => setActiveTab('dettagli')}
          >
            <FileText size={18} />
            Dettagli
          </button>
          <button
            className={`appointment-modal-tab ${activeTab === 'documenti' ? 'active' : ''}`}
            onClick={() => setActiveTab('documenti')}
          >
            <Upload size={18} />
            Documenti Richiesti
          </button>
        </div>

        {/* Content */}
        <div className="appointment-modal-body">
          {activeTab === 'dettagli' && (
            <div className="appointment-details">
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
                  <span className="detail-label">Note:</span>
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
                  <p>Nessun documento richiesto per questo appuntamento</p>
                </div>
              ) : (
                <div className="documents-list">
                  {documenti.map((doc) => {
                    const statoBadge = getStatoBadge(doc.stato)
                    const StatoIcon = statoBadge.icon
                    
                    return (
                      <div key={doc.id} className="document-item">
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

                        {/* Upload Area */}
                        {(doc.stato === 'DA_CARICARE' || doc.stato === 'RIFIUTATO') && (
                          <div className="document-upload-area">
                            <input
                              type="file"
                              id={`file-${doc.id}`}
                              className="file-input"
                              onChange={(e) => handleFileChange(doc.id, e)}
                              disabled={uploadingDoc === doc.id}
                            />
                            <label htmlFor={`file-${doc.id}`} className="file-upload-label">
                              <Upload size={20} />
                              <span>{uploadingDoc === doc.id ? 'Caricamento...' : 'Carica Documento'}</span>
                            </label>
                          </div>
                        )}

                        {/* File Info */}
                        {doc.file && (
                          <div className="document-file-info">
                            <FileText size={16} />
                            <span className="document-file-name">File caricato</span>
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

                        {/* Note Rifiuto */}
                        {doc.stato === 'RIFIUTATO' && doc.note_rifiuto && (
                          <div className="document-rejection-note">
                            <AlertCircle size={16} />
                            <span>Motivo rifiuto: {doc.note_rifiuto}</span>
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
  )
}

export default AppointmentDetailModal

