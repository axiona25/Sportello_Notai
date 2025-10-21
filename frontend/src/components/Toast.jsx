import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import './Toast.css'

function Toast({ id, message, type = 'success', title, onRemove }) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Progress bar countdown
    const duration = 5000 // 5 secondi
    const interval = 50 // Aggiorna ogni 50ms
    const decrement = (100 / duration) * interval

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement
        return next <= 0 ? 0 : next
      })
    }, interval)

    // Trigger exit animation prima della rimozione
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 300) // Inizia l'animazione 300ms prima

    return () => {
      clearInterval(progressTimer)
      clearTimeout(exitTimer)
    }
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(id)
    }, 300) // Durata animazione exit
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />
      case 'error':
        return <XCircle size={24} />
      case 'warning':
        return <AlertTriangle size={24} />
      case 'info':
        return <Info size={24} />
      default:
        return <Info size={24} />
    }
  }

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-text">
          <div className="toast-title">{title}</div>
          <div className="toast-message">{message}</div>
        </div>
        <button className="toast-close" onClick={handleClose}>
          <X size={18} />
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default Toast

