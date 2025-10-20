import React, { useState } from 'react'
import { 
  X, 
  Star,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Share2,
  Printer,
  CheckCircle,
  AlertCircle,
  Archive
} from 'lucide-react'
import './AttoDetailModal.css'

function AttoDetailModal({ atto, onClose, onTogglePreferito }) {
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState({})

  if (!atto) return null

  // Struttura documenti mock con cartelle e file
  const documenti = [
    {
      id: 1,
      nome: 'Documenti Preliminari',
      tipo: 'folder',
      children: [
        {
          id: 11,
          nome: 'Visura Catastale.pdf',
          tipo: 'file',
          dimensione: '2.3 MB',
          firmaDigitale: true,
          conservazione: true,
          dataFirma: '10/01/2025',
          firmatario: 'Francesco Spada'
        },
        {
          id: 12,
          nome: 'Planimetria.pdf',
          tipo: 'file',
          dimensione: '4.1 MB',
          firmaDigitale: true,
          conservazione: false,
          dataFirma: '10/01/2025',
          firmatario: 'Francesco Spada'
        }
      ]
    },
    {
      id: 2,
      nome: 'Contratti',
      tipo: 'folder',
      children: [
        {
          id: 21,
          nome: 'Contratto Preliminare.pdf',
          tipo: 'file',
          dimensione: '1.8 MB',
          firmaDigitale: true,
          conservazione: true,
          dataFirma: '12/01/2025',
          firmatario: 'Antonio Rossi'
        },
        {
          id: 22,
          nome: 'Allegati',
          tipo: 'folder',
          children: [
            {
              id: 221,
              nome: 'Certificato Energetico.pdf',
              tipo: 'file',
              dimensione: '0.9 MB',
              firmaDigitale: false,
              conservazione: false
            }
          ]
        }
      ]
    },
    {
      id: 3,
      nome: 'Atto Definitivo.pdf',
      tipo: 'file',
      dimensione: '3.5 MB',
      firmaDigitale: true,
      conservazione: true,
      dataFirma: '15/01/2025',
      firmatario: 'Francesco Spada'
    }
  ]

  const toggleFolder = (folderId, e) => {
    e.stopPropagation() // Previene la chiusura quando si clicca su una cartella
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }))
  }

  const handleDocumentClick = (doc, e) => {
    e.stopPropagation() // Previene la chiusura quando si clicca su un documento
    if (doc.tipo === 'file') {
      setSelectedDocument(doc)
    }
  }

  const handleLeftSectionClick = () => {
    setSelectedDocument(null) // Chiude la sidebar quando si clicca fuori
  }

  const renderDocumenti = (items, level = 0) => {
    return items.map((item) => (
      <div key={item.id} style={{ marginLeft: `${level * 20}px` }}>
        {item.tipo === 'folder' ? (
          <>
            <div 
              className="atto-doc-item folder"
              onClick={(e) => toggleFolder(item.id, e)}
            >
              <div className="atto-doc-item-left">
                {expandedFolders[item.id] ? (
                  <ChevronDown size={16} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} strokeWidth={2} />
                )}
                <Folder size={18} strokeWidth={2} color="#F59E0B" />
                <span>{item.nome}</span>
              </div>
            </div>
            {expandedFolders[item.id] && item.children && (
              <div className="atto-doc-children">
                {renderDocumenti(item.children, level + 1)}
              </div>
            )}
          </>
        ) : (
          <div 
            className={`atto-doc-item file ${selectedDocument?.id === item.id ? 'selected' : ''}`}
            onClick={(e) => handleDocumentClick(item, e)}
          >
            <div className="atto-doc-item-left">
              <FileText size={18} strokeWidth={2} color="#1668B0" />
              <span>{item.nome}</span>
              <span className="atto-doc-size">{item.dimensione}</span>
            </div>
            <div className="atto-doc-actions">
              <button className="atto-doc-action-btn" title="Condividi">
                <Share2 size={16} strokeWidth={2} />
              </button>
              <button className="atto-doc-action-btn" title="Stampa">
                <Printer size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="atto-modal-overlay" onClick={onClose}>
      <div className="atto-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="atto-modal-header">
          <div className="atto-modal-header-left">
            <h2>{atto.tipologia}</h2>
            <button 
              className={`atto-preferito-btn ${atto.preferito ? 'active' : ''}`}
              onClick={() => onTogglePreferito(atto.id)}
              title={atto.preferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Star 
                size={20} 
                strokeWidth={2} 
                fill={atto.preferito ? '#F59E0B' : 'none'}
                color={atto.preferito ? '#F59E0B' : '#6B7280'}
              />
            </button>
          </div>
          <button className="atto-modal-close" onClick={onClose}>
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="atto-modal-content">
          {/* Left: Dettagli Atto */}
          <div className="atto-modal-left" onClick={handleLeftSectionClick}>
            {/* Dettagli */}
            <div className="atto-detail-section">
              <h3>Dettagli Atto</h3>
              <div className="atto-detail-grid">
                <div className="atto-detail-item">
                  <label>Data Atto</label>
                  <span>{atto.dataAtto}</span>
                </div>
                <div className="atto-detail-item">
                  <label>Valore</label>
                  <span className="atto-detail-value">{atto.valore}</span>
                </div>
                <div className="atto-detail-item full-width">
                  <label>Descrizione</label>
                  <span>{atto.descrizione}</span>
                </div>
                <div className="atto-detail-item">
                  <label>Soggetti Coinvolti</label>
                  <span>{atto.soggettiCoinvolti}</span>
                </div>
                <div className="atto-detail-item">
                  <label>Stato</label>
                  <div className="atto-detail-stato">
                    <span 
                      className="atto-stato-dot" 
                      style={{ backgroundColor: atto.statoColor }}
                    ></span>
                    <span>{atto.stato}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documenti */}
            <div className="atto-detail-section">
              <h3>Documenti</h3>
              <div className="atto-documenti-list">
                {renderDocumenti(documenti)}
              </div>
            </div>
          </div>

          {/* Right: Verifica Firma e Conservazione */}
          {selectedDocument && (
            <div className="atto-modal-right">
              <div className="atto-doc-detail-header">
                <FileText size={20} strokeWidth={2} color="#1668B0" />
                <h3>{selectedDocument.nome}</h3>
              </div>

              {/* Firma Digitale */}
              <div className="atto-verification-section">
                <div className="atto-verification-header">
                  <h4>Firma Digitale</h4>
                  {selectedDocument.firmaDigitale ? (
                    <CheckCircle size={20} strokeWidth={2} color="#10B981" />
                  ) : (
                    <AlertCircle size={20} strokeWidth={2} color="#EF4444" />
                  )}
                </div>
                {selectedDocument.firmaDigitale ? (
                  <div className="atto-verification-info success">
                    <p><strong>Stato:</strong> Firma valida e verificata</p>
                    <p><strong>Firmatario:</strong> {selectedDocument.firmatario}</p>
                    <p><strong>Data Firma:</strong> {selectedDocument.dataFirma}</p>
                    <p><strong>Algoritmo:</strong> SHA-256 con RSA</p>
                  </div>
                ) : (
                  <div className="atto-verification-info error">
                    <p>Documento non firmato digitalmente</p>
                  </div>
                )}
              </div>

              {/* Conservazione */}
              <div className="atto-verification-section">
                <div className="atto-verification-header">
                  <h4>Conservazione</h4>
                  {selectedDocument.conservazione ? (
                    <Archive size={20} strokeWidth={2} color="#10B981" />
                  ) : (
                    <AlertCircle size={20} strokeWidth={2} color="#EF4444" />
                  )}
                </div>
                {selectedDocument.conservazione ? (
                  <div className="atto-verification-info success">
                    <p><strong>Stato:</strong> In conservazione sostitutiva</p>
                    <p><strong>Protocollo:</strong> CONS-2025-{selectedDocument.id.toString().padStart(6, '0')}</p>
                    <p><strong>Data Conservazione:</strong> {selectedDocument.dataFirma}</p>
                    <p><strong>Marca Temporale:</strong> Applicata</p>
                  </div>
                ) : (
                  <div className="atto-verification-info error">
                    <p>Documento non in conservazione sostitutiva</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttoDetailModal

