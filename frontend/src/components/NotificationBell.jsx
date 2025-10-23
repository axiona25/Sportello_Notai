import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Check, FileText, Calendar, AlertCircle, CheckCircle, CheckCheck, XCircle, Edit2 } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import AppointmentRequestModal from './AppointmentRequestModal'
import { useToast } from '../contexts/ToastContext'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import './NotificationBell.css'

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifiche, setNotifiche] = useState([])
  const [nonLette, setNonLette] = useState(0)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedNotifica, setSelectedNotifica] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const dropdownRef = useRef(null)
  const { showToast } = useToast()
  
  // Get user role from localStorage
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role

  const loadNotifiche = useCallback(async () => {
    try {
      const data = await appointmentExtendedService.getNotifiche()
      // Gestisci vari formati di risposta
      const notificheArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || [])
      
      // Filtra notifiche per appuntamenti ancora gestibili
      const notificheFiltrate = notificheArray.filter(n => {
        // Se non ha appuntamento associato, mostrala sempre
        if (!n.appuntamento) return true
        
        // Se è una notifica di tipo "richiesto", verifica che l'appuntamento sia ancora gestibile
        // Il backend restituisce il tipo in lowercase: "appuntamento_richiesto"
        const tipoLower = (n.tipo || '').toLowerCase()
        if (tipoLower === 'appuntamento_richiesto') {
          // Non mostrare se l'appuntamento è già confermato o rifiutato
          // (ovvero se il notaio ha già preso un'azione)
          if (n.appuntamento_status === 'confermato' || n.appuntamento_status === 'rifiutato') {
            return false
          }
        }
        
        return true
      })
      
      // Aggiorna solo se ci sono effettivi cambiamenti (evita re-render inutili e animazioni)
      setNotifiche(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(notificheFiltrate)
        return hasChanged ? notificheFiltrate : prev
      })
      
      // Conta solo le notifiche NON lette
      const count = notificheFiltrate.filter(n => !n.letta).length
      setNonLette(prev => prev !== count ? count : prev)
    } catch (error) {
      console.error('Errore caricamento notifiche:', error)
      // Non resettare le notifiche in caso di errore per evitare sfarfallio
      // setNotifiche([])
      // setNonLette(0)
    }
  }, [])

  // Caricamento iniziale
  useEffect(() => {
    loadNotifiche()
  }, [loadNotifiche])

  // Auto-refresh intelligente ogni 30 secondi
  // Si ferma automaticamente quando il tab non è visibile
  useAutoRefresh(loadNotifiche, 30000, true)

  // Ascolta evento custom per ricaricare notifiche immediatamente
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      loadNotifiche()
    }
    window.addEventListener('notifications-updated', handleNotificationsUpdate)
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate)
    }
  }, [loadNotifiche])

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

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleNotificaClick = async (notifica) => {
    const isAppuntamentoRichiesto = notifica.tipo === 'APPUNTAMENTO_RICHIESTO' || notifica.tipo === 'appuntamento_richiesto'
    const isNotaio = userRole === 'notaio'
    
    // ✅ Se è una richiesta appuntamento per il notaio, naviga alla dashboard
    if (isAppuntamentoRichiesto && isNotaio && notifica.appuntamento) {
      setIsOpen(false) // Chiudi il dropdown
      
      // Segna come letta
      if (!notifica.letta) {
        try {
          await appointmentExtendedService.segnaNotificaLetta(notifica.id)
          
          // Aggiorna localmente lo stato
          setNotifiche(prev => prev.map(n => 
            n.id === notifica.id ? { ...n, letta: true } : n
          ))
          setNonLette(prev => Math.max(0, prev - 1))
        } catch (error) {
          console.error('Errore segna notifica letta:', error)
        }
      }
      
      // ✅ Dispatch evento per selezionare l'appuntamento nel dashboard
      window.dispatchEvent(new CustomEvent('select-appointment', {
        detail: { appointmentId: notifica.appuntamento }
      }))
      return
    }
    
    // Comportamento standard per altre notifiche
    if (!notifica.letta) {
      try {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
        
        // Aggiorna localmente lo stato (la notifica resta visibile come "letta")
        setNotifiche(prev => prev.map(n => 
          n.id === notifica.id ? { ...n, letta: true } : n
        ))
        setNonLette(prev => Math.max(0, prev - 1))
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
      
      // Aggiorna localmente tutte come lette (restano nella lista)
      setNotifiche(prev => prev.map(n => ({ ...n, letta: true })))
      setNonLette(0)
      
      showToast('Tutte le notifiche sono state segnate come lette', 'success', 'Fatto!')
    } catch (error) {
      console.error('Errore segna tutte lette:', error)
      showToast('Errore nell\'operazione', 'error', 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const handleAccettaAppuntamento = async (e, notifica, appuntamentoId) => {
    e.stopPropagation()
    
    try {
      setActionLoading(appuntamentoId)
      await appointmentExtendedService.confermaAppuntamento(appuntamentoId, {})
      
      // Segna notifica come letta
      if (!notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Appuntamento confermato con successo!', 'success', 'Confermato')
      await loadNotifiche()
      
      // Ricarica il calendario/agenda (evento custom)
      window.dispatchEvent(new CustomEvent('appointment-updated'))
    } catch (error) {
      console.error('Errore conferma appuntamento:', error)
      const errorMessage = error.message || error.response?.data?.error || 'Errore durante la conferma dell\'appuntamento'
      
      // Se l'appuntamento è già stato gestito, ricarica le notifiche
      if (errorMessage.includes('nello stato') || errorMessage.includes('già')) {
        showToast('Questo appuntamento è già stato gestito', 'warning', 'Attenzione')
        await loadNotifiche()
      } else {
        showToast(errorMessage, 'error', 'Errore')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRifiutaAppuntamento = async (e, notifica, appuntamentoId) => {
    e.stopPropagation()
    
    const motivo = prompt('Inserisci il motivo del rifiuto (opzionale):')
    
    // Annulla se l'utente clicca "Annulla" nel prompt
    if (motivo === null) {
      return
    }
    
    try {
      setActionLoading(appuntamentoId)
      await appointmentExtendedService.rifiutaAppuntamento(appuntamentoId, motivo.trim() || '')
      
      // Segna notifica come letta
      if (!notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Appuntamento rifiutato con successo!', 'success', 'Rifiutato')
      await loadNotifiche()
      
      // Ricarica il calendario/agenda
      window.dispatchEvent(new CustomEvent('appointment-updated'))
    } catch (error) {
      console.error('Errore rifiuto appuntamento:', error)
      const errorMessage = error.message || error.response?.data?.error || 'Errore durante il rifiuto dell\'appuntamento'
      
      // Se l'appuntamento è già stato gestito, ricarica le notifiche
      if (errorMessage.includes('nello stato') || errorMessage.includes('già')) {
        showToast('Questo appuntamento è già stato gestito', 'warning', 'Attenzione')
        await loadNotifiche()
      } else {
        showToast(errorMessage, 'error', 'Errore')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleModificaAppuntamento = async (e, notifica, appuntamentoId) => {
    e.stopPropagation()
    
    try {
      // Segna notifica come letta
      if (!notifica.letta) {
        await appointmentExtendedService.segnaNotificaLetta(notifica.id)
      }
      
      showToast('Funzione modifica appuntamento in arrivo', 'info', 'Info')
      await loadNotifiche()
      
      // TODO: Aprire modale per proporre nuova data/ora
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  const getNotificaIcon = (tipo) => {
    const tipoLower = (tipo || '').toLowerCase()
    if (tipoLower.includes('appuntamento')) return Calendar
    if (tipoLower.includes('documento')) return FileText
    if (tipoLower.includes('atto') || tipoLower.includes('abilitato')) return CheckCircle
    return Bell
  }

  const getNotificaColor = (tipo) => {
    const tipoLower = (tipo || '').toLowerCase()
    if (tipoLower.includes('rifiutato')) return 'notifica-rejected'
    if (tipoLower.includes('confermato') || tipoLower.includes('verificato') || tipoLower.includes('abilitato')) return 'notifica-success'
    if (tipoLower.includes('caricato') || tipoLower.includes('creato')) return 'notifica-info'
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
                const isAppuntamentoRichiesto = notifica.tipo === 'APPUNTAMENTO_RICHIESTO' || notifica.tipo === 'appuntamento_richiesto'
                const isNotaio = userRole === 'notaio'
                const showActions = isAppuntamentoRichiesto && isNotaio && notifica.appuntamento
                
                return (
                  <div
                    key={notifica.id}
                    className={`notification-item ${!notifica.letta ? 'unread' : 'read'} ${colorClass}`}
                    onClick={() => handleNotificaClick(notifica)}
                  >
                    {/* ✅ Notifica semplificata per appuntamenti */}
                    {isAppuntamentoRichiesto && isNotaio ? (
                      <div className="notification-content-simplified">
                        {/* Titolo con pallino giallo (stato provvisorio) */}
                        <div className="notification-title-row">
                          <span className="notification-status-dot status-provvisorio"></span>
                          <h4 className="notification-title-simple">Nuova richiesta di appuntamento</h4>
                        </div>
                        
                        {/* Cliente */}
                        {notifica.cliente_nome && (
                          <p className="notification-detail">
                            <span className="notification-label">Cliente:</span> {notifica.cliente_nome}
                          </p>
                        )}
                        
                        {/* Oggetto */}
                        {notifica.servizio_nome && (
                          <p className="notification-detail">
                            <span className="notification-label">Oggetto:</span> {notifica.servizio_nome}
                          </p>
                        )}
                        
                        {/* Tempo - usa data creazione appuntamento */}
                        <span className="notification-time">{formatDate(notifica.appuntamento_created_at || notifica.created_at)}</span>
                      </div>
                    ) : (
                      /* Notifica standard per altri tipi */
                      <>
                        <div className="notification-icon">
                          <Icon size={20} />
                        </div>
                        <div className="notification-content">
                          <h4 className="notification-title">{notifica.titolo}</h4>
                          <p className="notification-message">{notifica.messaggio}</p>
                          <span className="notification-time">{formatDate(notifica.created_at)}</span>
                        </div>
                      </>
                    )}
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
      
      {/* Modale Dettaglio Richiesta Appuntamento */}
      {showRequestModal && selectedNotifica && (
        <AppointmentRequestModal
          notifica={selectedNotifica}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedNotifica(null)
          }}
          onAction={(action) => {
            // Ricarica notifiche dopo un'azione
            loadNotifiche()
            // Dispatch evento per aggiornare il calendario
            window.dispatchEvent(new CustomEvent('appointment-updated'))
          }}
        />
      )}
    </div>
  )
}

export default NotificationBell

