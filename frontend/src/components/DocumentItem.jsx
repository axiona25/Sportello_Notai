import React, { useState } from 'react'
import { FileText, Upload, Edit2, Trash2, Check, X, Download, AlertCircle, FileCheck } from 'lucide-react'
import './DocumentItem.css'

function DocumentItem({ 
  documento, 
  documentoCaricato = null,
  userRole = 'client',
  onUpload, 
  onRename, 
  onDelete,
  onVerify,
  onReject,
  isUploading = false
}) {
  // Verifica se c'è realmente un documento caricato (con ID E file)
  const hasValidDocument = documentoCaricato && 
                          documentoCaricato.id && 
                          (documentoCaricato.file || documentoCaricato.file_path)
  
  // Debug log dettagliato
  console.log(`📄 DocumentItem "${documento?.nome}":`, {
    hasDocumentoCaricato: !!documentoCaricato,
    hasId: !!documentoCaricato?.id,
    hasFile: !!(documentoCaricato?.file || documentoCaricato?.file_path),
    hasValidDocument: hasValidDocument,
    stato: documentoCaricato?.stato,
    buttonsEnabled: hasValidDocument
  })

  // Determina lo stato del documento
  const getStatoDocumento = () => {
    if (!documentoCaricato) {
      return { 
        label: 'Non caricato', 
        color: 'gray', 
        icon: null,
        tooltip: 'Carica Documento'
      }
    }
    
    const stato = documentoCaricato.stato?.toUpperCase()
    
    switch (stato) {
      case 'CARICATO':
      case 'BOZZA':
        // Documento caricato dal cliente → giallo
        return { 
          label: 'In lavorazione', 
          color: 'yellow', 
          icon: <AlertCircle size={14} />,
          tooltip: 'Documento Caricato'
        }
      case 'IN_ATTESA':
      case 'IN_VERIFICA':
      case 'IN_REVISIONE':
        // Documento in verifica da parte del notaio → giallo
        return { 
          label: 'In lavorazione', 
          color: 'yellow', 
          icon: <AlertCircle size={14} />,
          tooltip: 'In lavorazione'
        }
      case 'VERIFICATO':
      case 'ACCETTATO':
      case 'APPROVATO':
        // Documento approvato → verde
        return { 
          label: 'Approvato', 
          color: 'green', 
          icon: <Check size={14} />,
          tooltip: 'Documento verificato e approvato dal notaio'
        }
      case 'RIFIUTATO':
        // Documento rifiutato → rosso
        return { 
          label: 'Rifiutato', 
          color: 'red', 
          icon: <X size={14} />,
          tooltip: 'Documento rifiutato dal notaio. Verifica il motivo e ricarica.'
        }
      default:
        return { 
          label: 'Non caricato', 
          color: 'gray', 
          icon: null,
          tooltip: 'Carica Documento'
        }
    }
  }

  const stato = getStatoDocumento()

  const handleUploadClick = () => {
    if (onUpload) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          onUpload(documento.nome, file)
        }
      }
      input.click()
    }
  }

  return (
    <div className={`document-item ${stato.color}`}>
      {/* Layout compatto: tutto su una riga */}
      <div className="document-item-row">
        {/* Icona documento */}
        <FileText size={18} className="document-icon" />
        
        {/* Nome documento */}
        {userRole === 'notary' && documentoCaricato?.file_path ? (
          <a 
            href={documentoCaricato.file_path} 
            target="_blank" 
            rel="noopener noreferrer"
            className="document-name document-name-clickable"
            title="Clicca per aprire il documento"
          >
            {documento.nome}
          </a>
        ) : (
          <span className="document-name">{documento.nome}</span>
        )}
        
        {/* Pallino di stato (sempre visibile: grigio se non caricato, colorato in base allo stato) */}
        <div 
          className={`document-status-dot ${hasValidDocument ? `status-dot-${stato.color}` : 'status-dot-gray'}`}
          title={hasValidDocument ? stato.tooltip : 'Carica Documento'}
        >
          <span className="status-dot-tooltip">{hasValidDocument ? stato.tooltip : 'Carica Documento'}</span>
        </div>
        
        {/* Azioni */}
        <div className="document-actions">
          {userRole === 'client' && (
            <>
              {/* Primo pulsante: Upload o PDF preview */}
              {hasValidDocument && documentoCaricato.file_path ? (
                // Se documento caricato: mostra icona PDF che apre il file
                <button 
                  className="document-action-btn"
                  onClick={() => window.open(documentoCaricato.file_path, '_blank')}
                  title="Visualizza documento"
                >
                  <FileCheck size={16} />
                </button>
              ) : (
                // Se documento NON caricato: mostra icona Upload
                <button 
                  className="document-action-btn"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  title={isUploading ? 'Caricamento...' : 'Carica documento'}
                >
                  <Upload size={16} />
                </button>
              )}
              
              {/* Modifica: sostituisce il documento caricato */}
              <button 
                className="document-action-btn"
                onClick={handleUploadClick}
                disabled={!hasValidDocument || isUploading}
                title={hasValidDocument ? "Sostituisci documento" : "Carica prima un documento"}
              >
                <Edit2 size={16} />
              </button>
              
              {/* Elimina: abilitato solo se documento caricato */}
              <button 
                className="document-action-btn action-delete"
                onClick={() => onDelete && hasValidDocument && onDelete(documentoCaricato.id, documento.nome)}
                disabled={!hasValidDocument}
                title={hasValidDocument ? "Elimina documento" : "Carica prima un documento"}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {userRole === 'notary' && documentoCaricato && documentoCaricato.stato !== 'VERIFICATO' && documentoCaricato.stato !== 'ACCETTATO' && (
            <>
              <button 
                className="document-action-btn action-verify"
                onClick={() => onVerify && onVerify(documentoCaricato.id)}
                title="Verifica"
              >
                <Check size={16} />
              </button>
              <button 
                className="document-action-btn action-reject"
                onClick={() => onReject && onReject(documentoCaricato.id)}
                title="Rifiuta"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note rifiuto (se presente) - sotto la riga principale */}
      {documentoCaricato?.stato === 'RIFIUTATO' && documentoCaricato.note_rifiuto && (
        <div className="document-rejection-note">
          <AlertCircle size={16} />
          <span><strong>Motivo rifiuto:</strong> {documentoCaricato.note_rifiuto}</span>
        </div>
      )}
    </div>
  )
}

export default DocumentItem

