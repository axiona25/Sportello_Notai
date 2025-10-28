import React from 'react'
import { FileText, Download } from 'lucide-react'
import LibreOfficeViewer from './LibreOfficeViewer'
import './OfficeViewer.css'

/**
 * Visualizzatore documenti Office (Word, Excel, PowerPoint)
 * Usa LibreOffice Collabora Online per visualizzazione professionale con pagine A4 separate
 * Download diretto per Excel e PowerPoint
 */
function OfficeViewer({ document, onClose, userRole, currentUser, fileType, appointmentId }) {
  const documentUrl = document?.file_path || document?.file || document?.document_url
  
  // Download documento
  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = documentUrl
    link.download = document?.filename || 'document.docx'
    link.click()
  }
  
  // 📄 DOCX → Viewer professionale con pagine A4 separate (stile OnlyOffice)
  if (fileType === 'office_word') {
    return (
      <div className="office-viewer-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* ✅ Collabora Online gestisce la propria toolbar internamente nell'iframe
            Non serve aggiungere toolbar custom che potrebbe nasconderla */}
        
        {/* Viewer con LibreOffice Collabora Online - occupa tutto lo spazio */}
        <LibreOfficeViewer
          documentId={document?.id}
          documentPath={documentUrl}
          appointmentId={appointmentId}
          editable={false}
        />
      </div>
    )
  }
  
  // Fallback: Download placeholder per Excel, PowerPoint o editor disabilitato
  return (
    <div className="office-viewer-container">
      {/* Toolbar controlli principali */}
      <div className="office-viewer-toolbar">
        <div className="office-toolbar-left">
          <FileText size={18} />
          <span className="office-document-name">
            {document?.filename || 'Documento Office'}
          </span>
        </div>
        
        <div className="office-toolbar-right">
          <button 
            className="office-toolbar-btn"
            onClick={handleDownload}
            title="Scarica documento"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {/* Contenitore documento */}
      <div className="office-viewer-content">
        <div className="office-viewer-notice">
          <FileText size={64} className="office-notice-icon" />
          <h3>{document?.filename || 'Documento Office'}</h3>
          <p className="office-doc-type">
            {fileType === 'office_word' ? '📄 Documento Word (.docx)' : 
            fileType === 'office_excel' ? '📊 Foglio Excel (.xlsx)' : 
            '📊 Presentazione PowerPoint (.pptx)'}
          </p>
          
          <div className="office-preview-info">
            <p className="office-notice-text">
              ℹ️ Scarica il documento per aprirlo con Excel o PowerPoint.
            </p>
            <p className="office-notice-text" style={{ marginTop: '8px', fontSize: '13px', color: '#9CA3AF' }}>
              💡 <strong>Suggerimento:</strong> Per i documenti Word (.doc/.docx) è disponibile il viewer LibreOffice integrato.
            </p>
          </div>
          
          <button 
            className="office-download-primary"
            onClick={handleDownload}
          >
            <Download size={18} />
            Scarica Documento
          </button>
        </div>
      </div>
      
      {/* Info footer */}
      <div className="office-viewer-footer">
        <span>
          {fileType === 'office_word' && '📄 Documento Word'}
          {fileType === 'office_excel' && '📊 Foglio Excel'}
          {fileType === 'office_powerpoint' && '📊 Presentazione PowerPoint'}
        </span>
        <span className="office-separator">•</span>
        <span>{document?.filename || 'Documento'}</span>
      </div>
    </div>
  )
}

export default OfficeViewer

