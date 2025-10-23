import React, { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import './ConfirmModal.css'

function ConfirmDeleteDocumentModal({ documentName, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      // Non chiudere qui, lascia che lo faccia il parent dopo aver aggiornato i dati
    } catch (error) {
      console.error('Errore eliminazione documento:', error)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal confirm-modal-compact" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="confirm-modal-header delete">
          <div className="modal-icon-container delete">
            <Trash2 size={28} />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="confirm-modal-body">
          <h2 className="confirm-title">Elimina Documento</h2>
          <p className="confirm-description">
            Sei sicuro di voler eliminare il documento <strong>{documentName}</strong>?
          </p>

          <div className="info-box warning">
            <AlertTriangle size={18} />
            <p>Questa azione è irreversibile. Il documento sarà eliminato definitivamente.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annulla
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteDocumentModal

