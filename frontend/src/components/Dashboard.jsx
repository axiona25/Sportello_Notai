import React, { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import AppointmentDetailModal from './AppointmentDetailModal'
import NotarySelection from './NotarySelection'
import NotaryCards from './NotaryCards'
import AttiSidebar from './AttiSidebar'
import AttiContent from './AttiContent'
import EditAppointmentModal from './EditAppointmentModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { parseDateTimeLocal } from '../utils/dateUtils'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import appointmentExtendedService from '../services/appointmentExtendedService'
import './Dashboard.css'

function Dashboard({ onLogout, user: initialUser }) {
  const today = new Date()
  const isNavigatingFromNotification = useRef(false)
  const [selectedDate, setSelectedDate] = useState(today) // ✅ Deve essere un Date, non un numero!
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' o 'atti'
  const [attiFilter, setAttiFilter] = useState(null) // Filtro per gli atti (notaio/cliente)
  const [user, setUser] = useState(initialUser)
  const [currentAppointments, setCurrentAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Stati per i modali delle azioni
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToAction, setAppointmentToAction] = useState(null)
  
  // Stati per documenti
  const [documentiCaricati, setDocumentiCaricati] = useState(0)
  const [documentiTotali, setDocumentiTotali] = useState(0)
  const [documentiApprovati, setDocumentiApprovati] = useState(0)
  
  // ✅ State per tracciare l'appointment da selezionare da notifica
  const [pendingAppointmentId, setPendingAppointmentId] = useState(null)

  // ✅ Reset selezione quando cambia giorno nel calendario
  // (previene che la detail card mostri un appuntamento di un altro giorno)
  // MA solo se non c'è una navigazione da notifica in corso
  useEffect(() => {
    // Ignora durante navigazione da notifica
    if (isNavigatingFromNotification.current) {
      console.log('📅 [useEffect selectedDate] IGNORATO - navigazione da notifica in corso (Cliente)')
      return
    }
    
    // ✅ Verifica che selectedDate sia un oggetto Date valido
    if (!selectedDate || !(selectedDate instanceof Date)) {
      console.warn('⚠️ selectedDate non è un Date object valido:', selectedDate)
      return
    }
    
    console.log('📅 Data cambiata, reset selezione appuntamento (Cliente)')
    setSelectedAppointment(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Ascolta gli aggiornamenti dell'utente dal localStorage
  useEffect(() => {
    const handleUserUpdate = (event) => {
      setUser(event.detail.user)
    }

    // Listener per aggiornamenti da altre tab/browser tramite localStorage
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        const updatedUser = JSON.parse(event.newValue || '{}')
        setUser(updatedUser)
      }
    }

    window.addEventListener('userUpdated', handleUserUpdate)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // ✅ Listener per selezionare appuntamento da notifica (Cliente)
  useEffect(() => {
    const handleSelectAppointment = async (event) => {
      const { appointmentId, openDetail, notificationType } = event.detail
      console.log('📍 Dashboard (Cliente) - Evento select-appointment ricevuto:', { 
        appointmentId, 
        openDetail, 
        notificationType 
      })
      
      // Salva il pending appointment ID per selezionarlo quando gli appuntamenti vengono caricati
      setPendingAppointmentId(appointmentId)
      
      // Triggera un evento custom per dire al Calendar di selezionare questo appuntamento
      // Il cliente NON apre automaticamente la modale documenti, solo la detail card
      window.dispatchEvent(new CustomEvent('select-appointment-from-calendar', {
        detail: { appointmentId, openDetail: false } // Cliente: sempre false per modale
      }))
    }
    
    window.addEventListener('select-appointment', handleSelectAppointment)
    
    return () => {
      window.removeEventListener('select-appointment', handleSelectAppointment)
    }
  }, [])
  
  // Ottieni nome e cognome dell'utente
  const getUserName = () => {
    if (user?.cliente_profile) {
      // ✅ Usa full_name se disponibile, altrimenti costruisci da first_name e last_name
      if (user.cliente_profile.full_name) {
        return user.cliente_profile.full_name
      }
      
      const firstName = user.cliente_profile.first_name || ''
      const lastName = user.cliente_profile.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      
      if (fullName) {
        return fullName
      }
    }
    return user?.email?.split('@')[0] || 'Utente'
  }

  // Gestisci aggiornamenti appuntamenti dal calendario
  const handleAppointmentsUpdate = useCallback((appointments) => {
    // Trasforma gli appuntamenti in formato compatibile con AppointmentCard
    const formattedAppointments = appointments.map(app => {
      const startDate = parseDateTimeLocal(app.start_time)
      const endDate = parseDateTimeLocal(app.end_time)
      
      // ✅ Determina TUTTI i servizi selezionati (mappatura dal backend)
      const services = []
      if (app.is_in_person) services.push('presence')
      if (app.is_online) services.push('video')
      if (app.is_phone) services.push('phone')
      if (app.has_conservation) services.push('conservation')
      if (app.has_shared_folder) services.push('shared_folder')
      if (app.has_digital_signature) services.push('digital_signature')
      
      // ✅ Normalizza lo stato (può essere 'stato' o 'status' dal backend)
      const normalizedStatus = (app.stato || app.status || 'PROVVISORIO').toUpperCase()
      
      return {
        id: app.id,
        type: 'appointment',
        title: app.titolo || `${app.tipologia_atto_nome || 'Appuntamento'}`,
        appointmentType: app.tipologia_atto_nome || 'Appuntamento',
        tipologia_atto_codice: app.tipologia_atto_codice, // ✅ Codice atto per documenti
        notaryName: app.notaio_nome || 'Notaio',  // ✅ Usa notaio_nome dal backend (Nome e Cognome completo)
        location: app.location || 'Da definire',
        date: startDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), // ✅ Data formattata
        time: `${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
        status: normalizedStatus, // ✅ Status normalizzato a uppercase
        services: services,
        showActions: true, // Abilita azioni per il cliente
        userRole: 'client',
        appointmentData: app, // Dati completi per le azioni
        rawData: app // Dati completi per il dettaglio
      }
    })
    
    // Aggiorna solo se ci sono cambiamenti (evita re-render inutili)
    setCurrentAppointments(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(formattedAppointments)
      return hasChanged ? formattedAppointments : prev
    })
    
  }, [])
  
  // ✅ Funzione per pulire notifiche obsolete (cliente)
  const cleanupObsoleteNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      console.log('🧹 Pulizia automatica notifiche obsolete in corso... (Cliente)')
      
      // ✅ Ottieni TUTTI gli appuntamenti dell'utente (non solo quelli del giorno)
      const appointmentsResult = await appointmentExtendedService.getAppuntamenti()
      if (!appointmentsResult.success || !appointmentsResult.data) {
        console.log('⚠️ Impossibile caricare appuntamenti per pulizia notifiche')
        return
      }
      
      const allAppointments = Array.isArray(appointmentsResult.data) 
        ? appointmentsResult.data 
        : appointmentsResult.data.results || []
      
      console.log('📋 Appuntamenti totali trovati:', allAppointments.length)
      console.log('📋 Stati appuntamenti:', allAppointments.map(a => ({
        id: a.id,
        stato: a.stato,
        status: a.status
      })))
      
      // Ottieni tutte le notifiche dell'utente
      const notificationsResult = await appointmentExtendedService.getNotifiche()
      if (!notificationsResult.success || !notificationsResult.data) {
        console.log('ℹ️ Nessuna notifica da controllare')
        return
      }
      
      const notifications = Array.isArray(notificationsResult.data) 
        ? notificationsResult.data 
        : notificationsResult.data.results || []
      
      console.log('📨 Notifiche totali trovate:', notifications.length)
      
      if (notifications.length === 0) {
        console.log('ℹ️ Nessuna notifica da eliminare')
        return
      }
      
      let deletedCount = 0
      
      // Per ogni notifica, verifica se è obsoleta
      for (const notifica of notifications) {
        let shouldDelete = false
        
        // ✅ DEBUG: Log TUTTE le notifiche per vedere i tipi
        console.log(`📋 Notifica trovata:
          ID: ${notifica.id}
          TIPO: "${notifica.tipo}" (exact: ${JSON.stringify(notifica.tipo)})
          APPOINTMENT_ID: ${notifica.appuntamento_id}
          APPUNTAMENTO: ${notifica.appuntamento}
          LETTA: ${notifica.letta}`)
        
        // Tipo: APPUNTAMENTO_CONFERMATO - elimina se l'appuntamento è confermato
        const tipoUpper = (notifica.tipo || '').toUpperCase()
        const appointmentId = notifica.appuntamento_id || notifica.appuntamento // ✅ Usa il campo corretto
        
        if (tipoUpper === 'APPUNTAMENTO_CONFERMATO' && appointmentId) {
          // ✅ Cerca in TUTTI gli appuntamenti
          const appointment = allAppointments.find(a => a.id === appointmentId)
          const appointmentStatus = appointment ? (appointment.stato || appointment.status || '').toUpperCase() : null
          
          console.log('🔍 Verifica notifica APPUNTAMENTO_CONFERMATO:', {
            notificaId: notifica.id,
            appointmentId: appointmentId,
            appointmentFound: !!appointment,
            appointmentStatus: appointmentStatus,
            appointmentData: appointment ? {
              id: appointment.id,
              stato: appointment.stato,
              status: appointment.status
            } : null
          })
          
          // Elimina se l'appuntamento NON è più provvisorio (cioè è stato gestito)
          if (appointmentStatus && appointmentStatus !== 'PROVVISORIO') {
            shouldDelete = true
            console.log('🗑️ Notifica APPUNTAMENTO_CONFERMATO obsoleta (status:', appointmentStatus, '):', notifica.id)
          } else {
            console.log('ℹ️ Appuntamento ancora provvisorio, mantieni notifica. Status:', appointmentStatus)
          }
        }
        
        // Tipo: DOCUMENTO_APPROVATO o DOCUMENTO_RIFIUTATO - elimina sempre
        if (tipoUpper === 'DOCUMENTO_APPROVATO' || tipoUpper === 'DOCUMENTO_RIFIUTATO') {
          shouldDelete = true
          console.log(`🗑️ Notifica ${notifica.tipo} obsoleta:`, notifica.id)
        }
        
        // Tipo: DOCUMENTI_DA_CARICARE - elimina solo se TUTTI i documenti sono stati caricati
        if (tipoUpper === 'DOCUMENTI_DA_CARICARE' && appointmentId) {
          const appointment = allAppointments.find(a => a.id === appointmentId)
          
          if (appointment) {
            // Ottieni documenti richiesti per questo tipo di atto
            const codiceAtto = appointment.tipologia_atto_codice || appointment.tipologia_atto
            
            try {
              // Carica i documenti per questo appuntamento
              const { default: documentiConfig } = await import('../config/documentiRichiestiConfig.js')
              const documentiRichiesti = documentiConfig[codiceAtto] || []
              const totaleDocs = documentiRichiesti.length
              
              // Conta documenti caricati (usa il campo 'file', non 'file_path')
              const docsResult = await appointmentExtendedService.getDocumentiAppuntamento(appointmentId)
              const documentiDalBackend = docsResult?.data || []
              const documentiCaricati = Array.isArray(documentiDalBackend) 
                ? documentiDalBackend.filter(d => d.file || d.file_path).length 
                : 0
              
              console.log(`📄 DEBUG Documenti backend:`, documentiDalBackend.map(d => ({
                id: d.id,
                nome: d.document_type_name,
                file: d.file,
                file_path: d.file_path,
                hasFile: !!(d.file || d.file_path)
              })))
              
              console.log(`📄 Documenti per appuntamento ${appointmentId}:`, {
                caricati: documentiCaricati,
                totali: totaleDocs,
                codiceAtto: codiceAtto
              })
              
              // Elimina solo se TUTTI i documenti sono stati caricati
              if (totaleDocs > 0 && documentiCaricati >= totaleDocs) {
                shouldDelete = true
                console.log(`🗑️ Notifica ${notifica.tipo} - Tutti i documenti caricati (${documentiCaricati}/${totaleDocs}):`, notifica.id)
              } else {
                console.log(`ℹ️ Notifica ${notifica.tipo} - Documenti non completi (${documentiCaricati}/${totaleDocs}), mantieni notifica`)
              }
            } catch (error) {
              console.warn('⚠️ Errore verifica documenti per notifica:', error)
            }
          }
        }
        
        // Elimina se necessario
        if (shouldDelete) {
          const deleteResult = await appointmentExtendedService.eliminaNotifica(notifica.id)
          if (deleteResult.success) {
            console.log('✅ Notifica eliminata:', notifica.id)
            deletedCount++
          } else {
            console.warn('⚠️ Impossibile eliminare notifica:', notifica.id)
          }
        }
      }
      
      console.log(`✅ Pulizia completata: ${deletedCount} notifiche eliminate`)
      
      // Trigger aggiornamento lista notifiche solo se ci sono state eliminazioni
      if (deletedCount > 0) {
        window.dispatchEvent(new Event('notifications-updated'))
      }
      
    } catch (error) {
      console.error('❌ Errore pulizia notifiche:', error)
    }
  }, [user])
  
  // ✅ Esegui pulizia automatica quando cambiano gli appuntamenti
  useEffect(() => {
    if (currentAppointments.length > 0) {
      cleanupObsoleteNotifications()
    }
  }, [currentAppointments, cleanupObsoleteNotifications])
  
  // ✅ Esegui pulizia anche quando arrivano nuove notifiche
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      console.log('📨 Notifiche aggiornate - Eseguo pulizia automatica (Cliente)')
      // Piccolo delay per dare tempo al backend di aggiornare
      setTimeout(() => {
        cleanupObsoleteNotifications()
      }, 500)
    }
    
    window.addEventListener('notifications-updated', handleNotificationsUpdate)
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate)
    }
  }, [cleanupObsoleteNotifications])
  
  // ✅ Effetto separato per gestire la selezione automatica da notifica
  useEffect(() => {
    if (pendingAppointmentId && currentAppointments.length > 0) {
      // ✅ Attiva il flag per bloccare l'useEffect della data
      isNavigatingFromNotification.current = true
      console.log('🚩 isNavigatingFromNotification = true (Cliente)')
      
      const appointmentToSelect = currentAppointments.find(app => app.id === pendingAppointmentId)
      if (appointmentToSelect) {
        console.log('✅ Selezione automatica appointment da notifica (Cliente):', appointmentToSelect)
        
        // Seleziona l'appointment (questo popola la detail card)
        setSelectedAppointment(appointmentToSelect)
        
        // Scroll alla mini-card con delay maggiore
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-appointment-id="${pendingAppointmentId}"]`)
          if (cardElement) {
            console.log('📜 Scrolling verso mini-card (Cliente)...')
            cardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
            // Aggiungi effetto highlight
            cardElement.classList.add('highlight-from-notification')
            setTimeout(() => {
              cardElement.classList.remove('highlight-from-notification')
            }, 2000)
          }
        }, 500)
        
        // Reset pending appointment ID dopo un delay maggiore per evitare race conditions
        setTimeout(() => {
          console.log('🔄 Reset pendingAppointmentId (Cliente)')
          setPendingAppointmentId(null)
          // ✅ Resetta il flag dopo che la navigazione è completata
          isNavigatingFromNotification.current = false
          console.log('🏁 isNavigatingFromNotification = false (Cliente)')
        }, 2000) // Aumentato a 2000ms per dare tempo alla selezione di stabilizzarsi
      } else {
        // ✅ Resetta il flag anche se appointment non trovato
        isNavigatingFromNotification.current = false
        console.log('🏁 isNavigatingFromNotification = false (appointment not found - Cliente)')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAppointmentId, currentAppointments])

  // Handler per modifica appuntamento (cliente)
  const handleEditAppointment = useCallback((appointment) => {
    setAppointmentToAction(appointment)
    setShowEditModal(true)
  }, [])

  // Handler per eliminazione appuntamento (cliente)
  const handleDeleteAppointment = useCallback((appointment) => {
    setAppointmentToAction(appointment)
    setShowDeleteModal(true)
  }, [])

  // Conferma modifica appuntamento
  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false)
    setAppointmentToAction(null)
    // Trigger calendar refresh
    window.dispatchEvent(new Event('calendarUpdate'))
  }, [])

  // Conferma eliminazione appuntamento
  const handleDeleteConfirm = useCallback(async () => {
    if (!appointmentToAction) return

    try {
      const result = await appointmentExtendedService.eliminaAppuntamento(appointmentToAction.id)
      if (result.success) {
        // Se l'appuntamento eliminato è quello selezionato, chiudi la detail card
        if (selectedAppointment && appointmentToAction.id === selectedAppointment.id) {
          setSelectedAppointment(null)
        }
        
        setShowDeleteModal(false)
        setAppointmentToAction(null)
        // Trigger calendar refresh
        window.dispatchEvent(new Event('calendarUpdate'))
        alert('Appuntamento eliminato con successo')
      } else {
        alert('Errore durante l\'eliminazione dell\'appuntamento')
      }
    } catch (error) {
      console.error('Errore eliminazione appuntamento:', error)
      alert('Errore durante l\'eliminazione dell\'appuntamento')
    }
  }, [appointmentToAction, selectedAppointment])

  // RIMUOVO IL MOCKUP - Database degli appuntamenti per data
  const appointmentsByDate_OLD = {
    2: [
      {
        id: 'doc-2-1',
        type: 'document',
        title: 'Documenti Catastali',
        description: 'Revisionare i documenti allegati',
        deadline: '19/09/25'
      },
      {
        id: 'app-2-1',
        type: 'appointment',
        title: 'Rogito - Notaio Francesco Spada',
        location: 'Piazza Cavour n.19 - Dogana (S. Marino)',
        time: '11:15 - 12:30 AM'
      },
      {
        id: 'doc-2-2',
        type: 'document',
        title: 'Contratto di Compravendita',
        description: 'Verifica documenti preliminari',
        deadline: '22/09/25'
      }
    ],
    6: [
      {
        id: 'app-6-1',
        type: 'appointment',
        title: 'Consulenza - Notaio Dennis Beccari',
        location: 'Via 28 Luglio n.212 - Borgo Maggiore',
        time: '09:00 - 10:00 AM'
      },
      {
        id: 'doc-6-1',
        type: 'document',
        title: 'Visura Camerale',
        description: 'Controllo documenti societari',
        deadline: '10/10/25'
      }
    ],
    16: [
      {
        id: 'app-16-1',
        type: 'appointment',
        title: 'Atto Notarile - Notaio Chiara Benedettini',
        location: 'Via 28 Luglio n.212 - Borgo Maggiore',
        time: '14:30 - 16:00 PM'
      },
      {
        id: 'doc-16-1',
        type: 'document',
        title: 'Certificato di Provenienza',
        description: 'Verifica storico immobile',
        deadline: '18/10/25'
      },
      {
        id: 'doc-16-2',
        type: 'document',
        title: 'Planimetrie Catastali',
        description: 'Aggiornamento planimetrie',
        deadline: '20/10/25'
      }
    ],
    22: [
      {
        id: 'app-22-1',
        type: 'appointment',
        title: 'Firma Atto - Notaio Monica Bernardi',
        location: 'Piazza Marino Tini n.10 - Dogana',
        time: '10:30 - 12:00 AM'
      },
      {
        id: 'doc-22-1',
        type: 'document',
        title: 'Attestato di Prestazione Energetica',
        description: 'Consegna APE aggiornato',
        deadline: '25/10/25'
      }
    ]
  }

  // Handler per cambio data
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    // Il reset è gestito dall'useEffect che monitora selectedDate
    // con protezione isNavigatingFromNotification
  }

  // Calcola i contatori documenti per l'appuntamento selezionato
  const calcolaContatori = useCallback(async (appointment) => {
    try {
      // Ottieni il codice del tipo di atto (cerca in più posti come fallback)
      const codiceAtto = appointment.tipologia_atto_codice || 
                        appointment.appointment_type_code ||
                        appointment.rawData?.tipologia_atto_codice ||
                        appointment.rawData?.appointment_type_code
      
      if (!codiceAtto) {
        console.warn('⚠️ Codice atto mancante per l\'appuntamento. Resettando contatori.')
        setDocumentiTotali(0)
        setDocumentiCaricati(0)
        setDocumentiApprovati(0)
        return
      }
      
      // Ottieni la lista dei documenti richiesti per questo tipo di atto
      const documentiRichiestiConfig = await import('../config/documentiRichiestiConfig')
      const documentiRichiesti = documentiRichiestiConfig.getDocumentiRichiestiPerAtto(codiceAtto)
      const totale = documentiRichiesti.length
      
      // Carica i documenti caricati dal cliente
      const docsResult = await appointmentExtendedService.getDocumentiAppuntamento(appointment.id)
      const documentiDalBackend = docsResult?.data || docsResult
      
      // ✅ Conta SOLO documenti con file effettivamente caricato
      const caricati = Array.isArray(documentiDalBackend) 
        ? documentiDalBackend.filter(doc => doc.file || doc.file_path).length 
        : 0
      
      // Conta documenti approvati (normalizza a uppercase per il confronto)
      const approvati = Array.isArray(documentiDalBackend) 
        ? documentiDalBackend.filter(doc => {
            const statoUpper = (doc.stato || '').toUpperCase()
            return statoUpper === 'VERIFICATO' || 
                   statoUpper === 'ACCETTATO' || 
                   statoUpper === 'APPROVATO'
          }).length
        : 0
      
      console.log('📊 Conteggio documenti (Cliente):', {
        totale,
        caricati,
        approvati,
        documentiDalBackend: documentiDalBackend.map(d => ({
          nome: d.document_type_name,
          stato: d.stato,
          hasFile: !!(d.file || d.file_path)
        }))
      })
      
      setDocumentiTotali(totale)
      setDocumentiCaricati(caricati)
      setDocumentiApprovati(approvati)
    } catch (error) {
      console.error('❌ Errore calcolo contatori documenti (Cliente):', error)
      setDocumentiTotali(0)
      setDocumentiCaricati(0)
      setDocumentiApprovati(0)
    }
  }, [])

  // Handler per selezione appuntamento - aggiorna solo la card di dettaglio
  const handleAppointmentSelect = useCallback(async (appointment) => {
    if (appointment.type !== 'empty') {
      setSelectedAppointment(appointment)
      // ✅ NON aprire la modale - si apre solo dal pulsante "Entra"
      
      // Calcola contatori documenti
      await calcolaContatori(appointment)
    }
  }, [calcolaContatori])

  // ✅ Calcola contatori quando selectedAppointment cambia
  useEffect(() => {
    if (selectedAppointment && selectedAppointment.type !== 'empty') {
      calcolaContatori(selectedAppointment)
    }
  }, [selectedAppointment, calcolaContatori])

  // ✅ Listener per aggiornamenti documenti (DOPO la definizione di calcolaContatori)
  useEffect(() => {
    const handleDocumentsUpdate = async (event) => {
      console.log('📄 Evento documents-updated ricevuto', event.detail)
      // Ricalcola i contatori per l'appuntamento selezionato
      if (selectedAppointment && event.detail?.appointmentId === selectedAppointment.id) {
        await calcolaContatori(selectedAppointment)
      }
    }

    window.addEventListener('documents-updated', handleDocumentsUpdate)
    
    return () => {
      window.removeEventListener('documents-updated', handleDocumentsUpdate)
    }
  }, [selectedAppointment, calcolaContatori])

  // Handler per apertura modale dal pulsante "Entra"
  const handleEnterAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }

  // Handler per chiusura modale
  const handleCloseAppointmentModal = async () => {
    setShowAppointmentModal(false)
    
    // ✅ Ricalcola i contatori per l'appuntamento selezionato quando si chiude la modale
    if (selectedAppointment) {
      await calcolaContatori(selectedAppointment)
    }
  }

  // Handler per ricerca
  const handleSearchChange = (value) => {
    setSearchValue(value)
  }

  // Determina il placeholder in base alla vista corrente
  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'atti':
        return 'Cerca i miei Atti...'
      case 'dashboard':
      default:
        return 'Cerca appuntamenti...'
    }
  }

  return (
    <div className="dashboard">
      <Sidebar 
        onLogout={onLogout} 
        userRole="cliente" 
        currentView={currentView}
        onNavigateToDashboard={() => setCurrentView('dashboard')}
        onNavigateToAtti={() => setCurrentView('atti')}
      />
      <div className="dashboard-main">
        <Header 
          searchValue={searchValue} 
          onSearchChange={handleSearchChange}
          searchPlaceholder={getSearchPlaceholder()}
          user={user}
        />
        <div className="dashboard-content">
          {currentView === 'dashboard' ? (
            <>
              <div className="welcome-section">
                <div className="welcome-container">
                  <div className="welcome-text-group">
                    <h1 className="welcome-title">
                      Benvenuto 
                    </h1>
                    <div className="welcome-name-container">
                      <span className="welcome-name">{getUserName()}</span>
                      <img src="/assets/element.png" alt="" className="welcome-underline" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
            <div className="dashboard-left">
              <Calendar 
                selectedDate={selectedDate} 
                onSelectDate={handleDateSelect}
                onAppointmentsUpdate={handleAppointmentsUpdate}
              />
            </div>

            <div className="dashboard-center">
              {currentAppointments.length === 0 ? (
                // Nessun appuntamento: 1 card vuota occupa tutto
                <AppointmentCard type="empty" emptySlots={4} />
              ) : currentAppointments.length === 4 ? (
                // 4 appuntamenti: mostra tutte e 4 le card
                currentAppointments.map((appointment, index) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    {...appointment}
                    appointmentData={appointment}
                    onClick={() => handleAppointmentSelect(appointment)}
                    isSelected={selectedAppointment?.id === appointment.id}
                    showActions={appointment.status === 'PROVVISORIO'}
                    userRole="client"
                    onEdit={handleEditAppointment}
                    onDelete={handleDeleteAppointment}
                  />
                ))
              ) : (
                // 1-3 appuntamenti: mostra appuntamenti + 1 card vuota che occupa lo spazio rimanente
                <>
                  {currentAppointments.map((appointment, index) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      {...appointment}
                      appointmentData={appointment}
                      onClick={() => handleAppointmentSelect(appointment)}
                      isSelected={selectedAppointment?.id === appointment.id}
                      showActions={appointment.status === 'PROVVISORIO'}
                      userRole="client"
                      onEdit={handleEditAppointment}
                      onDelete={handleDeleteAppointment}
                    />
                  ))}
                  <AppointmentCard 
                    key="empty" 
                    type="empty" 
                    emptySlots={4 - currentAppointments.length} 
                  />
                </>
              )}
            </div>

            <div className="dashboard-right">
              <DeedDetailCard 
                appointment={selectedAppointment} 
                onEnter={handleEnterAppointment}
                documentiCaricati={documentiCaricati}
                documentiTotali={documentiTotali}
                documentiApprovati={documentiApprovati}
              />
            </div>
          </div>

              <div className="notary-section">
                <NotaryCards />
              </div>
            </>
          ) : currentView === 'atti' ? (
            /* Pagina I miei Atti */
            <>
              <div className="welcome-section">
                <div className="welcome-container">
                  <div className="welcome-text-group">
                    <h1 className="welcome-title">
                      I Miei
                    </h1>
                    <div className="welcome-name-container">
                      <span className="welcome-name">Atti</span>
                      <img src="/assets/element.png" alt="" className="welcome-underline" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="atti-container">
                <div className="atti-card">
                  <AttiSidebar 
                    selectedFilter={attiFilter}
                    onFilterChange={setAttiFilter}
                  />
                  <div className="atti-separator-vertical"></div>
                  <div className="atti-content">
                    <AttiContent selectedFilter={attiFilter} searchValue={searchValue} />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modale Dettaglio Appuntamento con Documenti */}
      {showAppointmentModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={handleCloseAppointmentModal}
        />
      )}

      {/* Modale Modifica Appuntamento (Cliente) */}
      {showEditModal && appointmentToAction && (
        <EditAppointmentModal
          appointment={appointmentToAction}
          onClose={() => {
            setShowEditModal(false)
            setAppointmentToAction(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Modale Conferma Eliminazione (Cliente) */}
      {showDeleteModal && appointmentToAction && (
        <ConfirmDeleteModal
          appointment={appointmentToAction}
          onClose={() => {
            setShowDeleteModal(false)
            setAppointmentToAction(null)
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

export default Dashboard

