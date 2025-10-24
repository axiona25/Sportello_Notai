import React, { useState, useEffect } from 'react'
import { X, FileText } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import { getDocumentiRichiestiPerAtto } from '../config/documentiRichiestiConfig'
import DocumentItem from './DocumentItem'
import ConfirmDeleteDocumentModal from './ConfirmDeleteDocumentModal'
import DocumentUploadProgressModal from './DocumentUploadProgressModal'
import './AppointmentDetailModal.css'

function AppointmentDetailModal({ appointment, onClose }) {
  const [documentiRichiesti, setDocumentiRichiesti] = useState([])
  const [documentiCaricati, setDocumentiCaricati] = useState([])
  const [loadingDocumenti, setLoadingDocumenti] = useState(false)
  const [uploadingDocName, setUploadingDocName] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const { showToast } = useToast()

  // ✅ Carica documenti richiesti e documenti caricati all'apertura
  useEffect(() => {
    if (appointment) {
      console.log('📦 AppointmentDetailModal - Appointment ricevuto:', appointment)
      
      // Carica documenti richiesti in base al tipo di atto
      const appointmentData = appointment.rawData || appointment
      const codiceAtto = appointment.tipologia_atto_codice || 
                        appointmentData.tipologia_atto_codice ||
                        appointment.appointment_type_code ||
                        appointmentData.appointment_type_code
      
      console.log('🔍 Codice atto trovato:', codiceAtto)
      
      const docRichiesti = getDocumentiRichiestiPerAtto(codiceAtto)
      console.log('📄 Documenti richiesti caricati:', docRichiesti.length, 'documenti')
      setDocumentiRichiesti(docRichiesti)

      // Carica documenti già caricati dal cliente
      const stato = appointment.status || appointmentData.status || appointmentData.stato
      console.log('🔍 Stato appuntamento per caricamento documenti:', stato)
      
      // Controlla stato (case-insensitive)
      const statoUpper = stato?.toUpperCase()
      console.log('🔍 Stato uppercase:', statoUpper)
      
      // ✅ Tutti gli stati che permettono accesso ai documenti
      if (statoUpper === 'CONFERMATO' || 
          statoUpper === 'DOCUMENTI_IN_CARICAMENTO' ||
          statoUpper === 'DOCUMENTI_IN_VERIFICA' ||
          statoUpper === 'DOCUMENTI_PARZIALI' ||  // ✅ Importante per documenti rifiutati
          statoUpper === 'DOCUMENTI_VERIFICATI' ||
          statoUpper === 'PRONTO_ATTO_VIRTUALE' ||
          statoUpper === 'IN_CORSO' ||
          statoUpper === 'COMPLETATO') {
        console.log('✅ Stato valido, carico documenti dal backend...')
        loadDocumentiCaricati()
      } else {
        console.log('❌ Stato non valido per caricare documenti:', stato)
      }
    }
  }, [appointment])

  // ✅ Listener per ricaricamento documenti quando vengono aggiornati da altre parti
  useEffect(() => {
    const handleDocumentsUpdate = () => {
      console.log('🔄 AppointmentDetailModal - Evento documents-updated ricevuto, ricarico documenti')
      if (appointment) {
        loadDocumentiCaricati()
      }
    }

    window.addEventListener('documents-updated', handleDocumentsUpdate)
    return () => window.removeEventListener('documents-updated', handleDocumentsUpdate)
  }, [appointment])

  const loadDocumentiCaricati = async () => {
    try {
      setLoadingDocumenti(true)
      const docsResult = await appointmentExtendedService.getDocumentiAppuntamento(appointment.id)
      const docs = docsResult?.data || docsResult
      const docsArray = Array.isArray(docs) ? docs : []
      console.log('📦 Documenti caricati dal backend:', docsArray.length, 'documenti')
      console.log('📋 Dettagli documenti caricati:', docsArray)
      
      // Log dettagliato di OGNI documento
      docsArray.forEach((doc, index) => {
        console.log(`📄 Documento #${index + 1}:`, {
          id: doc.id,
          document_type_name: doc.document_type_name,
          nome_documento: doc.nome_documento,
          nome_file: doc.nome_file,
          stato: doc.stato,
          file: doc.file || doc.file_path
        })
      })
      
      setDocumentiCaricati(docsArray)
    } catch (error) {
      console.error('Errore caricamento documenti:', error)
      showToast('Errore caricamento documenti', 'error', 'Errore')
    } finally {
      setLoadingDocumenti(false)
    }
  }

  const handleUpload = async (nomeDocumento, file) => {
    try {
      setUploadingDocName(nomeDocumento)
      
      console.log('📤 Upload documento:', {
        appuntamentoId: appointment.id,
        nomeDocumento,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      // Controlla dimensione max (es. 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File troppo grande (max 10MB)', 'error', 'Errore')
        return
      }

      // Upload documento
      await appointmentExtendedService.uploadDocumentoPerNome(
        appointment.id, 
        nomeDocumento, 
        file
      )
      
      showToast('Documento caricato con successo', 'success', 'Caricato!')
      await loadDocumentiCaricati() // Ricarica lista documenti
      
      // ✅ Notifica l'aggiornamento dei documenti
      window.dispatchEvent(new CustomEvent('documents-updated', { 
        detail: { appointmentId: appointment.id } 
      }))
    } catch (error) {
      console.error('❌ Errore upload documento:', error)
      console.error('❌ Dettagli errore:', error.message, error.response)
      
      // Mostra messaggio di errore specifico dal backend
      const errorMessage = error.response?.data?.error || error.message || 'Errore caricamento file'
      showToast(errorMessage, 'error', 'Errore')
    } finally {
      setUploadingDocName(null)
    }
  }

  const handleRename = async (documentoId, nuovoNome) => {
    try {
      await appointmentExtendedService.rinominaDocumento(documentoId, nuovoNome)
      showToast('Documento rinominato', 'success', 'Fatto!')
      await loadDocumentiCaricati()
    } catch (error) {
      console.error('Errore rinomina documento:', error)
      showToast('Errore durante la rinomina', 'error', 'Errore')
    }
  }

  const handleDelete = (documentoId, nomeDocumento) => {
    setDocumentToDelete({ id: documentoId, nome: nomeDocumento })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return

    try {
      console.log('🗑️ Eliminazione documento:', documentToDelete)
      await appointmentExtendedService.eliminaDocumento(documentToDelete.id)
      
      // Ricarica i documenti PRIMA di mostrare il toast e chiudere la modale
      await loadDocumentiCaricati()
      
      // ✅ Notifica l'aggiornamento dei documenti
      window.dispatchEvent(new CustomEvent('documents-updated', { 
        detail: { appointmentId: appointment.id } 
      }))
      
      showToast('Documento eliminato', 'success', 'Fatto!')
      
      // Chiudi la modale dopo aver aggiornato i dati
      setShowDeleteModal(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Errore eliminazione documento:', error)
      showToast('Errore durante l\'eliminazione', 'error', 'Errore')
    }
  }

  const handleSubmitDocuments = async () => {
    // Verifica che ci siano documenti da inviare
    const documentiConFile = documentiCaricati.filter(doc => doc.file || doc.file_path)
    
    if (documentiConFile.length === 0) {
      showToast('Nessun documento da inviare', 'warning', 'Attenzione')
      return
    }

    // ✅ Apri la modale di progress
    setShowProgressModal(true)

    try {
      // Invia notifica al notaio che i documenti sono pronti per la verifica
      await appointmentExtendedService.inviaDocumentiPerVerifica(appointment.id)
      
      // Ricarica documenti per aggiornare gli stati
      await loadDocumentiCaricati()
      
      // ✅ Notifica l'aggiornamento dei documenti per ricaricare i contatori
      window.dispatchEvent(new CustomEvent('documents-updated', { 
        detail: { appointmentId: appointment.id } 
      }))
    } catch (error) {
      console.error('Errore invio documenti:', error)
      setShowProgressModal(false)
      showToast('Errore durante l\'invio', 'error', 'Errore')
    }
  }

  const handleProgressComplete = () => {
    // Chiamato quando la modale progress completa l'animazione
    setShowProgressModal(false)
    onClose() // Chiudi la modale principale
  }

  // Helper per trovare documento caricato corrispondente
  const trovaDocumentoCaricato = (nomeDocumento) => {
    const found = documentiCaricati.find(doc => 
      doc.document_type_name === nomeDocumento || 
      doc.nome_documento === nomeDocumento
    )
    console.log(`🔍 Cerca documento "${nomeDocumento}":`, found ? '✅ Trovato' : '❌ Non trovato')
    if (found) {
      console.log('   📄 Documento trovato:', {
        nome: found.document_type_name || found.nome_documento,
        stato: found.stato,
        file: found.file || found.file_path
      })
    }
    return found
  }

  if (!appointment) return null

  // Estrai dati da rawData se disponibile
  const appointmentData = appointment.rawData || appointment
  const appointmentType = appointment.appointmentType || appointmentData.tipologia_atto_nome || appointmentData.appointment_type || 'Appuntamento'
  const notaryName = appointment.notaryName || appointmentData.notaio_nome || 'Notaio'
  const appointmentDate = appointment.date || appointmentData.date || ''
  const appointmentTime = appointment.time || appointmentData.time || ''
  
  // DEBUG: Log dati estratti
  console.log('📊 AppointmentDetailModal - Dati estratti:', {
    appointmentType,
    notaryName,
    appointmentDate,
    appointmentTime,
    hasRawData: !!appointment.rawData,
    rawDataKeys: appointment.rawData ? Object.keys(appointment.rawData) : []
  })

  return (
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
              {appointmentType}
              {' | '}
              {notaryName}
              {appointmentDate && (
                <>
                  {' - '}
                  {appointmentDate}
                  {appointmentTime && ` alle ${appointmentTime.split(' - ')[0]}`}
                </>
              )}
            </p>
          </div>
          <button className="appointment-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
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
                  <small>Contatta il notaio per maggiori informazioni</small>
                </div>
              ) : (
                <div className="documents-list">
                  {documentiRichiesti.map((docRichiesto, index) => {
                    const docCaricato = trovaDocumentoCaricato(docRichiesto.nome)
                    
                    console.log(`🎨 Render DocumentItem #${index + 1}:`, {
                      nome: docRichiesto.nome,
                      haDocCaricato: !!docCaricato,
                      stato: docCaricato?.stato
                    })
                    
                    return (
                      <DocumentItem
                        key={index}
                        documento={docRichiesto}
                        documentoCaricato={docCaricato}
                        userRole="client"
                        onUpload={handleUpload}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        isUploading={uploadingDocName === docRichiesto.nome}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Footer con contatore e pulsante Invia Documenti */}
            <div className="appointment-modal-footer">
              {/* Contatore documenti caricati */}
              <div className="documents-counter">
                <span className="counter-badge">
                  {documentiCaricati.filter(doc => doc.file || doc.file_path).length}/{documentiRichiesti.length}
                </span>
                <span className="counter-label">documenti caricati</span>
              </div>
              
              {/* Pulsante Invia - Solo se ci sono documenti con file */}
              {documentiCaricati.filter(doc => doc.file || doc.file_path).length > 0 && (
                <button 
                  className="btn-submit-documents"
                  onClick={handleSubmitDocuments}
                  disabled={loadingDocumenti}
                >
                  <FileText size={18} />
                  <span>Invia Documenti</span>
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Modale Conferma Eliminazione Documento */}
      {showDeleteModal && documentToDelete && (
        <ConfirmDeleteDocumentModal
          documentName={documentToDelete.nome}
          onClose={() => {
            setShowDeleteModal(false)
            setDocumentToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modale Progress Invio Documenti */}
      <DocumentUploadProgressModal
        isOpen={showProgressModal}
        totalDocuments={documentiCaricati.filter(doc => doc.file || doc.file_path).length}
        onComplete={handleProgressComplete}
      />
    </div>
  )
}

export default AppointmentDetailModal

