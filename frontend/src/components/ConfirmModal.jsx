import React from 'react'
import { AlertTriangle, Lock, Unlock, Trash2, X } from 'lucide-react'
import './ConfirmModal.css'

/**
 * Modale di conferma generica e riutilizzabile
 * 
 * @param {boolean} isOpen - Se la modale è aperta
 * @param {function} onClose - Callback per chiudere
 * @param {function} onConfirm - Callback per confermare
 * @param {string} type - Tipo: 'delete', 'block', 'unblock', 'warning'
 * @param {string} title - Titolo della modale
 * @param {string} message - Messaggio principale
 * @param {string} itemName - Nome elemento da modificare (es. "Francesco Spada")
 * @param {string} itemLabel - Label elemento (es. "Notaio", "Partner", default: "Elemento")
 * @param {string} confirmText - Testo pulsante conferma (default: "Conferma")
 * @param {string} cancelText - Testo pulsante annulla (default: "Annulla")
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'warning',
  title,
  message,
  itemName,
  itemLabel = 'Elemento',
  confirmText = 'Conferma',
  cancelText = 'Annulla'
}) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 size={48} strokeWidth={1.5} />
      case 'block':
        return <Lock size={48} strokeWidth={1.5} />
      case 'unblock':
        return <Unlock size={48} strokeWidth={1.5} />
      default:
        return <AlertTriangle size={48} strokeWidth={1.5} />
    }
  }

  const getColorClass = () => {
    switch (type) {
      case 'delete':
        return 'danger'
      case 'block':
        return 'danger'
      case 'unblock':
        return 'success'
      default:
        return 'warning'
    }
  }

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="confirm-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Icon */}
        <div className={`confirm-modal-icon ${getColorClass()}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <h3 className="confirm-modal-title">{title}</h3>
          
          {itemName && (
            <div className="confirm-modal-item">
              <span className="confirm-modal-item-label">{itemLabel}:</span>
              <span className="confirm-modal-item-name">{itemName}</span>
            </div>
          )}
          
          <p className="confirm-modal-message">{message}</p>
        </div>

        {/* Actions */}
        <div className="confirm-modal-actions">
          <button 
            className="confirm-btn-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-btn-confirm ${getColorClass()}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

