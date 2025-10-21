import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import './NotificationBell.css'

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifiche, setNotifiche] = useState([])
  const [nonLette, setNonLette] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const { showToast } = useToast()

  // Carica notifiche all'avvio e ogni 30 secondi
  useEffect(() => {
    loadNotifiche()
    const interval = setInterval(loadNotifiche, 30000) // Poll ogni 30 secondi
    return () => clearInterval(interval)
  }, [])

  // Chiudi dropdown se clicco fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadNotifiche = async () => {
    try {
      const data = await appointmentExtendedService.getNotifiche()
      // Gestisci vari formati di risposta
      const notificheArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || [])
      
      setNotifiche(notificheArray)
      
      // Conta notifiche non lette
      const count = notificheArray.filter(n => !n.letta).length
      setNonLette(count)
    } catch (error) {
      console.error('Errore caricamento notifiche:', error)
      setNotifiche([]) // Fallback a array vuoto
      setNonLette(0)
    }
  }

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleNotificaClick = async (notifica) => {
    // Segna come letta se non lo è già
    if (!notifica.letta) {
      try {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
        await loadNotifiche() // Ricarica lista
      } catch (error) {
        console.error('Errore segna notifica letta:', error)
      }
    }

    // Se ha un link, naviga
    if (notifica.link_url) {
      window.location.href = notifica.link_url
    }
  }

  const handleSegnaLette = async () => {
    try {
      setLoading(true)
      await appointmentExtendedService.segnaTutteNotificheLette()
      await loadNotifiche()
      showToast('Tutte le notifiche sono state segnate come lette', 'success', 'Fatto!')
    } catch (error) {
      console.error('Errore segna tutte lette:', error)
      showToast('Errore nell\'operazione', 'error', 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const getNotificaIcon = (tipo) => {
    switch (tipo) {
      case 'APPUNTAMENTO_CREATO':
      case 'APPUNTAMENTO_CONFERMATO':
      case 'APPUNTAMENTO_RIFIUTATO':
        return Calendar
      case 'DOCUMENTO_CARICATO':
      case 'DOCUMENTO_VERIFICATO':
      case 'DOCUMENTO_RIFIUTATO':
      case 'DOCUMENTI_COMPLETI':
        return FileText
      case 'ATTO_ABILITATO':
        return CheckCircle
      default:
        return Bell
    }
  }

  const getNotificaColor = (tipo) => {
    if (tipo.includes('RIFIUTATO')) return 'notifica-rejected'
    if (tipo.includes('CONFERMATO') || tipo.includes('VERIFICATO') || tipo.includes('ABILITATO')) return 'notifica-success'
    if (tipo.includes('CARICATO') || tipo.includes('CREATO')) return 'notifica-info'
    return 'notifica-default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Ora'
    if (diffMins < 60) return `${diffMins}m fa`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h fa`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}g fa`
    
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={handleToggleDropdown}>
        <Bell size={20} />
        {nonLette > 0 && (
          <span className="notification-badge">{nonLette > 99 ? '99+' : nonLette}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-dropdown-header">
            <h3>Notifiche</h3>
            {nonLette > 0 && (
              <button 
                className="notification-mark-all-btn"
                onClick={handleSegnaLette}
                disabled={loading}
              >
                <Check size={14} />
                Segna tutte lette
              </button>
            )}
          </div>

          {/* Lista Notifiche */}
          <div className="notification-list">
            {notifiche.length === 0 ? (
              <div className="notification-empty">
                <Bell size={48} />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              notifiche.map((notifica) => {
                const Icon = getNotificaIcon(notifica.tipo)
                const colorClass = getNotificaColor(notifica.tipo)
                
                return (
                  <div
                    key={notifica.id}
                    className={`notification-item ${!notifica.letta ? 'unread' : ''} ${colorClass}`}
                    onClick={() => handleNotificaClick(notifica)}
                  >
                    <div className="notification-icon">
                      <Icon size={20} />
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title">{notifica.titolo}</h4>
                      <p className="notification-message">{notifica.messaggio}</p>
                      <span className="notification-time">{formatDate(notifica.created_at)}</span>
                    </div>
                    {!notifica.letta && <div className="notification-unread-dot"></div>}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifiche.length > 0 && (
            <div className="notification-dropdown-footer">
              <button className="notification-view-all-btn">
                Vedi tutte le notifiche
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

