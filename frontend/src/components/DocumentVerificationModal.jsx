import React, { useState, useEffect } from 'react'
import { X, FileText, Check, XCircle, Clock, AlertCircle, Download, Eye } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { getDocumentiRichiestiPerAtto } from '../config/documentiRichiestiConfig'
import DocumentItem from './DocumentItem'
import './AppointmentDetailModal.css'
import './DocumentVerificationModal.css'

function DocumentVerificationModal({ appointment, onClose, onDocumentVerified }) {
  console.log('🔍 DocumentVerificationModal - Appointment:', appointment)
  
  const [documentiRichiesti, setDocumentiRichiesti] = useState([])
  const [documentiCaricati, setDocumentiCaricati] = useState([])
  const [loadingDocumenti, setLoadingDocumenti] = useState(false)
  const [verifyingDoc, setVerifyingDoc] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (appointment) {
      console.log('📦 DocumentVerificationModal - Appointment ricevuto:', appointment)
      
      // Carica documenti richiesti in base al tipo di atto
      const appointmentData = appointment.rawData || appointment
      const codiceAtto = appointment.tipologia_atto_codice || 
                        appointmentData.tipologia_atto_codice ||
                        appointment.appointment_type_code ||
                        appointmentData.appointment_type_code
      
      console.log('🔍 Codice atto trovato (Notaio):', codiceAtto)
      
      const docRichiesti = getDocumentiRichiestiPerAtto(codiceAtto)
      console.log('📄 Documenti richiesti caricati (Notaio):', docRichiesti.length, 'documenti')
      setDocumentiRichiesti(docRichiesti)

      // Carica documenti già caricati dal cliente
      loadDocumentiCaricati()
    }
  }, [appointment])

  const loadDocumentiCaricati = async () => {
    try {
      setLoadingDocumenti(true)
      const docs = await appointmentExtendedService.getDocumentiAppuntamento(appointment.id)
      setDocumentiCaricati(Array.isArray(docs) ? docs : [])
    } catch (error) {
      console.error('Errore caricamento documenti:', error)
      showToast('Errore caricamento documenti', 'error', 'Errore')
    } finally {
      setLoadingDocumenti(false)
    }
  }

  const handleVerify = async (documentoId) => {
    try {
      setVerifyingDoc(documentoId)
      await appointmentExtendedService.verificaDocumento(documentoId, 'accetta', '', '')
      showToast('Documento accettato', 'success', 'Accettato!')
      await loadDocumentiCaricati()
      if (onDocumentVerified) onDocumentVerified()
    } catch (error) {
      console.error('Errore accettazione documento:', error)
      showToast('Errore nell\'accettazione', 'error', 'Errore')
    } finally {
      setVerifyingDoc(null)
    }
  }

  const handleReject = (documentoId) => {
    const doc = documentiCaricati.find(d => d.id === documentoId)
    if (doc) {
      setSelectedDoc(doc)
      setShowRejectModal(true)
    }
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
        ''
      )
      showToast('Documento rifiutato', 'success', 'Rifiutato')
      setShowRejectModal(false)
      setRejectNote('')
      setSelectedDoc(null)
      await loadDocumentiCaricati()
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
    setSelectedDoc(null)
  }

  // Helper per trovare documento caricato corrispondente
  const trovaDocumentoCaricato = (nomeDocumento) => {
    return documentiCaricati.find(doc => 
      doc.document_type_name === nomeDocumento || 
      doc.nome_documento === nomeDocumento
    )
  }


  const getDocumentsStats = () => {
    const total = documentiCaricati.length
    const accepted = documentiCaricati.filter(d => d.stato === 'ACCETTATO' || d.stato === 'VERIFICATO').length
    const rejected = documentiCaricati.filter(d => d.stato === 'RIFIUTATO').length
    const pending = documentiCaricati.filter(d => ['CARICATO', 'IN_VERIFICA', 'BOZZA', 'IN_ATTESA'].includes(d.stato)).length
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
              <div className="appointment-modal-title-with-icon">
                <FileText size={20} className="modal-title-icon" />
                <h2>Documenti Richiesti</h2>
              </div>
              <p className="appointment-modal-subtitle">
                {appointment.appointmentType || appointment.tipologia_atto_nome || appointment.appointment_type || 'Appuntamento'}
                {' | '}
                {appointment.clientName || appointment.cliente_nome || 'Cliente'}
                {' - '}
                {appointment.date || 'Data non disponibile'}
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

          {/* Content */}
          <div className="appointment-modal-body">
            {/* Documenti */}
            <div className="appointment-documents">
                {loadingDocumenti ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Caricamento documenti...</p>
                  </div>
                ) : documentiRichiesti.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>Nessun documento configurato per questo tipo di atto</p>
                    <small>Verifica la configurazione dell'atto</small>
                  </div>
                ) : (
                  <div className="documents-list">
                    {documentiRichiesti.map((docRichiesto, index) => {
                      const docCaricato = trovaDocumentoCaricato(docRichiesto.nome)
                      
                      return (
                        <DocumentItem
                          key={index}
                          documento={docRichiesto}
                          documentoCaricato={docCaricato}
                          userRole="notary"
                          onVerify={handleVerify}
                          onReject={handleReject}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
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

