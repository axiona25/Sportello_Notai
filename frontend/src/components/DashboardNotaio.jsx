import React, { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import ProvisionalAppointmentCard from './ProvisionalAppointmentCard'
import DocumentVerificationModal from './DocumentVerificationModal'
import DeedDetailCard from './DeedDetailCard'
import NotaryMetrics from './NotaryMetrics'
import StudioActivity from './StudioActivity'
import Settings from './Settings'
import ProtectedRoute from './ProtectedRoute'
import DocumentiSidebar from './DocumentiSidebar'
import DocumentiContent from './DocumentiContent'
import AttiSidebarNotaio from './AttiSidebarNotaio'
import AttiContent from './AttiContent'
import NotificationBell from './NotificationBell'
import EditAppointmentModal from './EditAppointmentModal'
import ConfirmCancelModal from './ConfirmCancelModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import ConfirmApproveModal from './ConfirmApproveModal'
import appointmentService from '../services/appointmentService'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { parseDateTimeLocal } from '../utils/dateUtils'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useToast } from '../contexts/ToastContext'
import './DashboardNotaio.css'

function DashboardNotaio({ onLogout, user: initialUser }) {
  const today = new Date()
  const isNavigatingFromNotification = useRef(false)
  const { showToast: toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(today) // ✅ Deve essere un Date, non un numero!
  const [selectedAppointment, setSelectedAppointmentRaw] = useState(null)
  
  // ✅ Wrapper per tracciare OGNI modifica di selectedAppointment
  const setSelectedAppointment = useCallback((value) => {
    const stack = new Error().stack
    console.log('🎯 setSelectedAppointment chiamato:', {
      value: value ? { id: value.id, type: value.appointmentType } : null,
      stack: stack?.split('\n').slice(1, 4).join('\n') // Prime 3 righe dello stack
    })
    setSelectedAppointmentRaw(value)
  }, [])
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'settings', 'documenti', o 'atti'
  const [attiFilter, setAttiFilter] = useState(null) // Filtro per gli atti (cliente)
  const [user, setUser] = useState(initialUser)
  const [provisionalAppointments, setProvisionalAppointments] = useState([]) // Appuntamenti provvisori
  const [currentAppointments, setCurrentAppointments] = useState([]) // Appuntamenti del giorno selezionato
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [pendingAppointmentId, setPendingAppointmentId] = useState(null) // ✅ ID appuntamento da selezionare dopo caricamento
  const [pendingOpenDetail, setPendingOpenDetail] = useState(false) // ✅ Flag per aprire modale dopo selezione
  
  // Stati per le modali di azione
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [appointmentToAction, setAppointmentToAction] = useState(null)
  
  // Stati per documenti
  const [documentiCaricati, setDocumentiCaricati] = useState(0)
  const [documentiTotali, setDocumentiTotali] = useState(0)
  const [documentiApprovati, setDocumentiApprovati] = useState(0)

  // ✅ Carica TUTTI gli appuntamenti dal backend (non solo provvisori)
  // Necessario perché le notifiche possono riguardare appuntamenti in qualsiasi stato
  const loadProvisionalAppointments = useCallback(async (showLoader = true) => {
    try {
      // Mostra loader solo al primo caricamento, non durante i refresh automatici
      if (showLoader) {
      setLoadingAppointments(true)
      }
      
      console.log('📥 Caricando appuntamenti provvisori...')
      
      // Carica tutti gli appuntamenti e filtra quelli con stato PROVVISORIO
      const result = await appointmentService.getNotaryAppointments()
      console.log('📦 Risposta backend appuntamenti:', result)
      console.log('📦 Tipo result.data:', typeof result.data, Array.isArray(result.data))
      console.log('📦 Contenuto result.data:', result.data)
      
      if (result.success) {
        // Gestisci vari formati di risposta
        let appointments = []
        
        if (Array.isArray(result.data)) {
          appointments = result.data
          console.log('✅ Formato: array diretto')
        } else if (result.data && Array.isArray(result.data.results)) {
          appointments = result.data.results
          console.log('✅ Formato: oggetto con results')
        } else if (result.data && Array.isArray(result.data.data)) {
          appointments = result.data.data
          console.log('✅ Formato: oggetto con data')
        } else {
          console.warn('⚠️ Formato risposta non riconosciuto:', result.data)
        }
        
        console.log('📋 Appuntamenti totali:', appointments.length)
        console.log('📋 Stati di tutti gli appuntamenti:', appointments.map(a => ({ 
          id: a.id, 
          stato: a.stato || a.status || a.appointment_status,
          tipologia: a.tipologia_atto_nome,
          client: a.client_name
        })))
        
        // ✅ Verifica duplicati
        const ids = appointments.map(a => a.id)
        const uniqueIds = [...new Set(ids)]
        if (ids.length !== uniqueIds.length) {
          console.warn('⚠️ ATTENZIONE: ID duplicati trovati negli appuntamenti!')
          const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
          console.warn('⚠️ IDs duplicati:', duplicates)
        }
        
        // ✅ Carica TUTTI gli appuntamenti (non solo provvisori) perché le notifiche possono riguardare qualsiasi stato
        // Il notaio deve poter navigare a qualsiasi appuntamento da notifica
        const provisional = appointments.filter(app => {
          const stato = app.stato || app.status || app.appointment_status || ''
          // Escludi solo gli appuntamenti ANNULLATI/RIFIUTATI/CANCELLATI
          const isExcluded = ['ANNULLATO', 'RIFIUTATO', 'CANCELLATO', 'CANCELLED', 'REJECTED'].includes(stato.toUpperCase())
          return !isExcluded
        })
        
        console.log('📋 Appuntamenti validi (non annullati) trovati:', provisional.length)
        console.log('📋 IDs appuntamenti validi:', provisional.map(a => ({ 
          id: a.id, 
          stato: a.stato || a.status 
        })))
        
        // Aggiorna solo se ci sono effettivi cambiamenti (evita re-render inutili)
        setProvisionalAppointments(prev => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(provisional)
          if (hasChanged) {
            console.log('✅ Appuntamenti aggiornati:', provisional.length)
          }
          return hasChanged ? provisional : prev
        })
      } else {
        console.error('❌ Errore nella risposta:', result.error)
      }
    } catch (error) {
      console.error('❌ Errore caricamento appuntamenti provvisori:', error)
    } finally {
      if (showLoader) {
      setLoadingAppointments(false)
    }
    }
  }, [])

  // Caricamento iniziale (con loader)
  useEffect(() => {
    loadProvisionalAppointments(true)
  }, [loadProvisionalAppointments])

  // ✅ Reset selezione quando cambia giorno
  // (previene che la detail card mostri un appuntamento di un altro giorno)
  // MA solo se l'appuntamento selezionato NON appartiene al giorno attuale
  // E solo se NON c'è una navigazione da notifica in corso
  useEffect(() => {
    // Ignora durante navigazione da notifica
    if (isNavigatingFromNotification.current) {
      console.log('📅 [useEffect selectedDate] IGNORATO - navigazione da notifica in corso')
      return
    }
    
    // ✅ Verifica che selectedDate sia un oggetto Date valido
    if (!selectedDate || !(selectedDate instanceof Date)) {
      console.warn('⚠️ selectedDate non è un Date object valido:', selectedDate)
      return
    }
    
    if (selectedAppointment && selectedAppointment.date) {
      const appointmentDate = new Date(selectedAppointment.date.split('/').reverse().join('-'))
      const selectedDateStr = selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      
      if (selectedAppointment.date !== selectedDateStr) {
        console.log('📅 [useEffect selectedDate] Data cambiata e appointment non appartiene a questo giorno, reset selezione')
        setSelectedAppointment(null)
      } else {
        console.log('📅 [useEffect selectedDate] Data cambiata ma appointment appartiene a questo giorno, mantieni selezione')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // ✅ Listener per selezionare appuntamento da notifica
  useEffect(() => {
    console.log('📌 DashboardNotaio - Listener select-appointment ATTIVO')
    
    const handleSelectAppointment = async (event) => {
      const { appointmentId, openDetail, notificationType } = event.detail
      console.log('📍 DashboardNotaio - Evento select-appointment ricevuto:', { 
        appointmentId, 
        openDetail,
        notificationType,
        provisionalAppointmentsCount: provisionalAppointments.length,
        provisionalAppointments: provisionalAppointments.map(a => ({ id: a.id, type: a.appointmentType }))
      })
      
      // Salva il pending appointment ID e il flag per aprire il dettaglio
      console.log('💾 Salvando pending appointment:', appointmentId, '- Apri modale:', openDetail)
      setPendingAppointmentId(appointmentId)
      setPendingOpenDetail(openDetail || false)
      
      // Carica gli appuntamenti se non sono già caricati
      if (provisionalAppointments.length === 0) {
        console.log('📂 Caricamento appuntamenti...')
        await loadProvisionalAppointments(true)
      } else {
        console.log('✅ Appuntamenti già caricati:', provisionalAppointments.length)
      }
    }
    
    window.addEventListener('select-appointment', handleSelectAppointment)
    console.log('✅ Listener select-appointment aggiunto')
    
    return () => {
      window.removeEventListener('select-appointment', handleSelectAppointment)
      console.log('❌ Listener select-appointment rimosso')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provisionalAppointments])

  // ✅ Effetto separato per gestire la selezione automatica da notifica (dopo caricamento)
  useEffect(() => {
    console.log('🔍 Checking pending appointment:', {
      pendingAppointmentId,
      pendingOpenDetail,
      provisionalAppointmentsLength: provisionalAppointments.length
    })
    
    if (pendingAppointmentId && provisionalAppointments.length > 0) {
      // ✅ Attiva il flag per bloccare l'useEffect della data
      isNavigatingFromNotification.current = true
      console.log('🚩 isNavigatingFromNotification = true')
      console.log('🔎 Cercando appointment con ID:', pendingAppointmentId)
      console.log('📋 IDs disponibili:', provisionalAppointments.map(a => ({ 
        id: a.id, 
        stato: a.stato || a.status,
        tipo: a.tipologia_atto_nome 
      })))
      
      const appointmentToSelect = provisionalAppointments.find(app => {
        const match = app.id === pendingAppointmentId
        if (match) {
          console.log('✅ Match trovato:', {
            id: app.id,
            stato: app.stato || app.status,
            tipo: app.tipologia_atto_nome,
            client: app.client_name
          })
        }
        return match
      })
      
      if (appointmentToSelect) {
        console.log('✅ Selezione automatica appointment da notifica (Notaio):', {
          id: appointmentToSelect.id,
          stato: appointmentToSelect.stato || appointmentToSelect.status,
          tipologia: appointmentToSelect.tipologia_atto_nome,
          client: appointmentToSelect.client_name,
          rawStatus: appointmentToSelect.status
        })
        
        // ⚠️ Verifica che lo stato corrisponda al tipo di notifica
        const appointmentStatus = (appointmentToSelect.stato || appointmentToSelect.status || '').toUpperCase()
        
        if (pendingOpenDetail === false && appointmentStatus !== 'PROVVISORIO') {
          console.warn('⚠️ Attenzione: Notifica "Nuova richiesta" ma appuntamento con stato:', appointmentStatus)
          console.warn('⚠️ Potrebbe essere un errore. ID cercato:', pendingAppointmentId)
        }
        
        // ✅ Formatta l'appointment usando la stessa logica di handleAppointmentsUpdate
        const startDate = parseDateTimeLocal(appointmentToSelect.start_time)
        const endDate = parseDateTimeLocal(appointmentToSelect.end_time)
        
        // Estrai servizi selezionati
        const services = []
        if (appointmentToSelect.is_in_person) services.push('presence')
        if (appointmentToSelect.is_online) services.push('video')
        if (appointmentToSelect.is_phone) services.push('phone')
        if (appointmentToSelect.has_conservation) services.push('conservation')
        if (appointmentToSelect.has_shared_folder) services.push('shared_folder')
        if (appointmentToSelect.has_digital_signature) services.push('digital_signature')
        
        // Normalizza lo stato
        const normalizedStatus = (appointmentToSelect.stato || appointmentToSelect.status || 'PROVVISORIO').toUpperCase()
        
        const formattedAppointment = {
          id: appointmentToSelect.id,
          type: 'appointment',
          appointmentType: appointmentToSelect.tipologia_atto_nome || 'Appuntamento',
          tipologia_atto_codice: appointmentToSelect.tipologia_atto_codice,
          clientName: appointmentToSelect.client_name || 'Cliente',
          date: startDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: `${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
          services: services,
          status: normalizedStatus,
          userRole: 'notary', // ✅ Vista notaio
          rawData: appointmentToSelect
        }
        
        console.log('📌 Appointment formattato:', formattedAppointment)
        
        // ✅ Seleziona la data dell'appuntamento nel calendario
        // IMPORTANTE: Senza questo, la mini-card non viene mostrata se il calendario mostra un altro giorno
        console.log('📅 Selezione data nel calendario:', startDate)
        setSelectedDate(startDate)
        
        // ✅ Popola currentAppointments con gli appuntamenti di quel giorno
        // Filtra provisionalAppointments per mostrare solo quelli della data selezionata
        const appointmentsForDay = provisionalAppointments
          .filter(app => {
            const appStartDate = parseDateTimeLocal(app.start_time)
            return appStartDate.toDateString() === startDate.toDateString()
          })
          .map(app => {
            const appStartDate = parseDateTimeLocal(app.start_time)
            const appEndDate = parseDateTimeLocal(app.end_time)
            
            const appServices = []
            if (app.is_in_person) appServices.push('presence')
            if (app.is_online) appServices.push('video')
            if (app.is_phone) appServices.push('phone')
            if (app.has_conservation) appServices.push('conservation')
            if (app.has_shared_folder) appServices.push('shared_folder')
            if (app.has_digital_signature) appServices.push('digital_signature')
            
            const appStatus = (app.stato || app.status || 'PROVVISORIO').toUpperCase()
            
            return {
              id: app.id,
              type: 'appointment',
              appointmentType: app.tipologia_atto_nome || 'Appuntamento',
              tipologia_atto_codice: app.tipologia_atto_codice,
              clientName: app.client_name || 'Cliente',
              date: appStartDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              time: `${appStartDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${appEndDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
              services: appServices,
              status: appStatus,
              userRole: 'notary',
              rawData: app
            }
          })
        
        console.log('📋 Appuntamenti per il giorno selezionato:', appointmentsForDay.length)
        setCurrentAppointments(appointmentsForDay)
        
        // ✅ NON selezionare ancora - aspetta che currentAppointments sia renderizzato
        // Il prossimo useEffect lo farà automaticamente
      } else {
        console.warn('⚠️ Appuntamento non trovato nella lista. Cercavo:', pendingAppointmentId)
        console.warn('⚠️ IDs disponibili:', provisionalAppointments.map(a => a.id))
        // ✅ Resetta il flag anche in caso di errore
        isNavigatingFromNotification.current = false
        console.log('🏁 isNavigatingFromNotification = false (appointment not found)')
        setPendingAppointmentId(null)
        setPendingOpenDetail(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAppointmentId, provisionalAppointments])

  // ✅ Effetto separato per selezionare l'appuntamento DOPO che currentAppointments è stato renderizzato
  useEffect(() => {
    if (pendingAppointmentId && currentAppointments.length > 0) {
      const appointmentToSelect = currentAppointments.find(app => app.id === pendingAppointmentId)
      
      if (appointmentToSelect) {
        // ✅ Seleziona l'appointment (questo popola la detail card)
        setSelectedAppointment(appointmentToSelect)
        
        // Scroll alla mini-card con delay per dare tempo al rendering
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-appointment-id="${pendingAppointmentId}"]`)
          
          if (cardElement) {
            cardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
            // Effetto highlight
            cardElement.classList.add('highlight-from-notification')
            setTimeout(() => {
              cardElement.classList.remove('highlight-from-notification')
            }, 2000)
          }
        }, 500)
        
        // Se richiesto, apri anche la modale documenti
        if (pendingOpenDetail) {
          setTimeout(() => {
            handleOpenVerificationModal(appointmentToSelect)
          }, 800)
        }
        
        // Reset pending states dopo un delay maggiore per evitare race conditions
        setTimeout(() => {
          console.log('🔄 Reset pendingAppointmentId e pendingOpenDetail (Notaio)')
          setPendingAppointmentId(null)
          setPendingOpenDetail(false)
          // ✅ Resetta il flag dopo che la navigazione è completata
          isNavigatingFromNotification.current = false
          console.log('🏁 isNavigatingFromNotification = false')
        }, 2000) // Aumentato a 2000ms per dare tempo alla selezione di stabilizzarsi
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAppointmentId, currentAppointments])

  // Funzione di refresh silenziosa per il polling (senza loader)
  const silentRefresh = useCallback(() => {
    loadProvisionalAppointments(false)
  }, [loadProvisionalAppointments])

  // Gestisci aggiornamenti appuntamenti dal calendario
  const handleAppointmentsUpdate = useCallback((appointments) => {
    // Trasforma gli appuntamenti in formato compatibile con AppointmentCard
    const formattedAppointments = appointments.map(app => {
      const startDate = parseDateTimeLocal(app.start_time)
      const endDate = parseDateTimeLocal(app.end_time)
      
      // Estrai servizi selezionati (modalità)
      // ✅ Determina TUTTI i servizi selezionati (mappatura dal backend)
      const services = []
      if (app.is_in_person) services.push('presence')
      if (app.is_online) services.push('video')
      if (app.is_phone) services.push('phone')
      if (app.has_conservation) services.push('conservation')
      if (app.has_shared_folder) services.push('shared_folder')
      if (app.has_digital_signature) services.push('digital_signature')
      
      // Normalizza lo stato
      const normalizedStatus = (app.stato || app.status || 'PROVVISORIO').toUpperCase()
      
      return {
        id: app.id,
        type: 'appointment',
        appointmentType: app.tipologia_atto_nome || 'Appuntamento', // Tipo atto
        tipologia_atto_codice: app.tipologia_atto_codice, // ✅ Codice atto per documenti
        clientName: app.client_name || 'Cliente', // Nome cliente
        date: startDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), // Data formattata
        time: `${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
        services: services, // Servizi selezionati
        status: normalizedStatus, // ✅ Normalizza a maiuscolo
        userRole: 'notary', // ✅ Vista notaio
        rawData: app // Dati completi per il dettaglio
      }
    })
    
    setCurrentAppointments(formattedAppointments)
  }, [])

  // Auto-refresh intelligente ogni 30 secondi (silenzioso, senza loader)
  // Si ferma automaticamente quando il tab non è visibile
  useAutoRefresh(silentRefresh, 30000, currentView === 'dashboard')

  const handleAppointmentConfirm = (appointmentId) => {
    // Rimuovi l'appuntamento dalla lista provvisori
    setProvisionalAppointments(prev => prev.filter(app => app.id !== appointmentId))
  }

  const handleAppointmentReject = (appointmentId) => {
    // Rimuovi l'appuntamento dalla lista provvisori
    setProvisionalAppointments(prev => prev.filter(app => app.id !== appointmentId))
  }

  // Gestori per le azioni delle mini card
  const handleApproveAppointment = (appointmentData) => {
    setAppointmentToAction(appointmentData)
    setShowApproveModal(true)
  }

  const handleApproveConfirm = async (note) => {
    try {
      const result = await appointmentExtendedService.confermaAppuntamento(
        appointmentToAction.id,
        { note }
      )
      
      if (result.success) {
        toast('Appuntamento approvato con successo', 'success', 'Approvazione Completata')
        
        // ✅ Elimina automaticamente la notifica "Nuova richiesta" associata a questo appuntamento
        try {
          console.log('🗑️ Eliminazione notifica nuova richiesta per appuntamento:', appointmentToAction.id)
          const result = await appointmentExtendedService.getNotifiche()
          const notifiche = result?.data || result
          const notificheArray = Array.isArray(notifiche) ? notifiche : (notifiche?.results || notifiche?.data || [])
          
          console.log('📋 Notifiche totali:', notificheArray.length)
          console.log('📋 Tipi notifiche:', notificheArray.map(n => ({ id: n.id, tipo: n.tipo, appuntamento: n.appuntamento })))
          
          // Trova la notifica di tipo "appuntamento_richiesto" per questo appuntamento
          const notificaDaEliminare = notificheArray.find(n => {
            const tipoLower = (n.tipo || '').toLowerCase()
            const tipoUpper = (n.tipo || '').toUpperCase()
            const isMatch = n.appuntamento === appointmentToAction.id && 
              (tipoLower === 'appuntamento_richiesto' ||  // ✅ Tipo backend
               tipoUpper === 'APPUNTAMENTO_RICHIESTO' ||
               tipoUpper === 'NUOVA_RICHIESTA' || 
               tipoUpper === 'RICHIESTA_APPUNTAMENTO' ||
               tipoUpper === 'NUOVO_APPUNTAMENTO')
            
            if (isMatch) {
              console.log('✅ Notifica match trovata:', { id: n.id, tipo: n.tipo, appuntamento: n.appuntamento })
            }
            return isMatch
          })
          
          if (notificaDaEliminare) {
            console.log('✅ Notifica trovata, eliminazione in corso:', notificaDaEliminare.id, 'tipo:', notificaDaEliminare.tipo)
            await appointmentExtendedService.eliminaNotifica(notificaDaEliminare.id)
            console.log('✅ Notifica eliminata con successo')
            
            // Aggiorna le notifiche nel NotificationBell
            window.dispatchEvent(new CustomEvent('notifications-updated'))
          } else {
            console.warn('⚠️ Nessuna notifica di richiesta trovata per questo appuntamento')
            console.warn('⚠️ Appuntamento cercato:', appointmentToAction.id)
            console.warn('⚠️ Notifiche per questo appuntamento:', 
              notificheArray.filter(n => n.appuntamento === appointmentToAction.id)
            )
          }
        } catch (error) {
          console.error('⚠️ Errore eliminazione notifica:', error)
          // Non bloccare il flusso se l'eliminazione notifica fallisce
        }
        
        // ✅ Chiudi modale
        setShowApproveModal(false)
        
        // ✅ Ricarica appuntamenti provvisori
        await loadProvisionalAppointments()
        
        // ✅ Aggiorna calendario
        window.dispatchEvent(new CustomEvent('appointment-updated'))
        
        // ✅ Se l'appuntamento è selezionato, ricarica i dati completi dal backend
        if (selectedAppointment?.id === appointmentToAction.id) {
          console.log('🔄 Ricaricamento appuntamento dopo approvazione...')
          const updatedAppointment = await appointmentService.getAppointment(appointmentToAction.id)
          if (updatedAppointment.success) {
            const app = updatedAppointment.data
            console.log('✅ Dati appuntamento aggiornato:', {
              stato: app.stato,
              status: app.status,
              is_in_person: app.is_in_person,
              has_conservation: app.has_conservation
            })
            
            const startDate = parseDateTimeLocal(app.start_time)
            const endDate = parseDateTimeLocal(app.end_time)
            
            // Estrai servizi selezionati (mappatura completa dal backend)
            const services = []
            if (app.is_in_person) services.push('presence')
            if (app.is_online) services.push('video')
            if (app.is_phone) services.push('phone')
            if (app.has_conservation) services.push('conservation')
            if (app.has_shared_folder) services.push('shared_folder')
            if (app.has_digital_signature) services.push('digital_signature')
            
            const normalizedStatus = (app.stato || app.status || 'CONFERMATO').toUpperCase()
            console.log('📌 Status normalizzato:', normalizedStatus)
            
            // Formato completo come le mini-card
            const newAppointmentData = {
              id: app.id,
              type: 'appointment',
              appointmentType: app.tipologia_atto_nome || 'Appuntamento',
              tipologia_atto_codice: app.tipologia_atto_codice, // ✅ Codice atto per documenti
              clientName: app.client_name || 'Cliente',
              date: startDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              time: `${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
              services: services,
              status: normalizedStatus, // ✅ Normalizza a maiuscolo
              rawData: app // Dati completi per il dettaglio
            }
            console.log('💾 Aggiornamento selectedAppointment con:', newAppointmentData)
            setSelectedAppointment(newAppointmentData)
          }
        }
      } else {
        toast('Errore nell\'approvazione dell\'appuntamento', 'error', 'Errore')
      }
    } catch (error) {
      console.error('Errore approvazione appuntamento:', error)
      toast('Errore nell\'approvazione dell\'appuntamento', 'error', 'Errore')
    }
  }

  const handleEditAppointment = (appointmentData) => {
    setAppointmentToAction(appointmentData)
    setShowEditModal(true)
  }

  const handleCancelAppointment = (appointmentData) => {
    setAppointmentToAction(appointmentData)
    setShowCancelModal(true)
  }

  const handleDeleteAppointment = (appointmentData) => {
    setAppointmentToAction(appointmentData)
    setShowDeleteModal(true)
  }

  const handleActionSuccess = () => {
    // Se l'appuntamento eliminato è quello selezionato, chiudi la detail card
    if (appointmentToAction && selectedAppointment && appointmentToAction.id === selectedAppointment.id) {
      setSelectedAppointment(null)
    }
    
    // Ricarica i dati del calendario
    window.dispatchEvent(new Event('appointment-updated'))
  }

  const closeAllModals = () => {
    setShowEditModal(false)
    setShowCancelModal(false)
    setShowDeleteModal(false)
    setShowApproveModal(false)
    setAppointmentToAction(null)
  }

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
  
  // Ottieni nome del notaio
  const getNotaryName = () => {
    if (user?.notary_profile) {
      const studioName = user.notary_profile.studio_name || ''
      
      // Se ha studio_name, usalo; altrimenti fallback a email
      if (studioName.trim()) {
        return studioName
      }
    }
    return user?.email?.split('@')[0] || 'Notaio'
  }

  // Database degli appuntamenti per data (stessi del cliente, ma prospettiva notaio)
  const appointmentsByDate = {
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
        title: 'Rogito - Cliente Antonio Russo',
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
        title: 'Consulenza - Cliente Mario Bianchi',
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
        title: 'Atto Notarile - Cliente Laura Verdi',
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
        title: 'Firma Atto - Cliente Paolo Neri',
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

  // Ottieni gli appuntamenti per la data selezionata o tutti se si sta cercando
  // Handler per cambio data
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    // Il reset è gestito dall'useEffect che monitora selectedDate
    // con protezione isNavigatingFromNotification
  }

  // Handler per selezione appuntamento
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
      
      console.log('📊 Conteggio documenti (Notaio):', {
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
      console.error('❌ Errore calcolo contatori documenti:', error)
      setDocumentiTotali(0)
      setDocumentiCaricati(0)
      setDocumentiApprovati(0)
    }
  }, [])

  const handleAppointmentSelect = useCallback(async (appointment) => {
    if (appointment && appointment.type !== 'empty') {
      setSelectedAppointment(appointment)
      // Non aprire automaticamente modale - lascia che l'utente veda i dettagli nella card destra
      
      // Calcola contatori documenti
      await calcolaContatori(appointment)
    }
  }, [calcolaContatori])

  // ✅ Calcola contatori quando selectedAppointment cambia
  useEffect(() => {
    if (selectedAppointment && selectedAppointment.type !== 'empty') {
      console.log('🔢 Ricalcolo contatori per appointment selezionato:', selectedAppointment.id)
      calcolaContatori(selectedAppointment)
    }
  }, [selectedAppointment, calcolaContatori])

  // ✅ Listener per aggiornamenti documenti (DOPO la definizione di calcolaContatori)
  useEffect(() => {
    const handleDocumentsUpdate = async (event) => {
      console.log('📄 Evento documents-updated ricevuto (Notaio)', event.detail)
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

  const handleOpenVerificationModal = (appointment) => {
    console.log('🚀 DashboardNotaio - handleOpenVerificationModal chiamato!', appointment)
    if (appointment) {
      console.log('✅ Appointment valido, aprendo modale...')
      setSelectedAppointment(appointment)
      setShowVerificationModal(true)
    } else {
      console.log('❌ Appointment non valido!')
    }
  }

  const handleCloseVerificationModal = async () => {
    setShowVerificationModal(false)
    
    // ✅ Ricalcola i contatori per l'appuntamento selezionato quando si chiude la modale
    if (selectedAppointment) {
      await calcolaContatori(selectedAppointment)
    }
  }

  const handleDocumentVerified = () => {
    // Ricarica gli appuntamenti dopo la verifica di un documento
    loadProvisionalAppointments()
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
      case 'documenti':
        return 'Cerca documenti...'
      case 'settings':
        return 'Cerca nelle impostazioni...'
      case 'dashboard':
      default:
        return 'Cerca appuntamenti...'
    }
  }

  // Handler per navigazione a Settings
  const handleNavigateToSettings = () => {
    setCurrentView('settings')
  }

  // Handler per tornare alla dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  // Handler per navigazione a Documenti
  const handleNavigateToDocumenti = () => {
    setCurrentView('documenti')
  }

  // Handler per navigazione ad Atti
  const handleNavigateToAtti = () => {
    setCurrentView('atti')
  }

  // Se siamo nella vista Settings, mostra Settings (protetto solo per notai)
  if (currentView === 'settings') {
    return (
      <div className="dashboard-notaio">
        <Sidebar 
          onLogout={onLogout} 
          userRole="notaio" 
          onNavigateToSettings={handleNavigateToSettings}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigateToDocumenti={handleNavigateToDocumenti}
          onNavigateToAtti={handleNavigateToAtti}
          currentView={currentView}
        />
        <ProtectedRoute allowedRoles={['notaio']}>
          <Settings 
            searchValue={searchValue} 
            onSearchChange={handleSearchChange}
            user={user}
          />
        </ProtectedRoute>
      </div>
    )
  }

  // Se siamo nella vista Documenti, mostra la pagina Documenti
  if (currentView === 'documenti') {
    return (
      <div className="dashboard-notaio">
        <Sidebar 
          onLogout={onLogout} 
          userRole="notaio" 
          onNavigateToSettings={handleNavigateToSettings}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigateToDocumenti={handleNavigateToDocumenti}
          onNavigateToAtti={handleNavigateToAtti}
          currentView={currentView}
        />
        <div className="dashboard-notaio-main">
          <Header 
            searchValue={searchValue} 
            onSearchChange={handleSearchChange}
            searchPlaceholder={getSearchPlaceholder()}
            user={user}
          />
          <div className="dashboard-notaio-content">
            {/* Titolo Pagina Documenti */}
            <div className="welcome-section">
              <div className="welcome-container">
                <div className="welcome-text-group">
                  <h1 className="welcome-title">
                    I Miei
                  </h1>
                  <div className="welcome-name-container">
                    <span className="welcome-name">Documenti</span>
                    <img src="/assets/element.png" alt="" className="welcome-underline" />
                  </div>
                </div>
              </div>
            </div>

            {/* Container Card Documenti */}
            <div className="documenti-container">
              <div className="documenti-card">
                <DocumentiSidebar />
                <div className="documenti-separator-vertical"></div>
                <div className="documenti-content">
                  <DocumentiContent searchValue={searchValue} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se siamo nella vista Atti, mostra la pagina Atti
  if (currentView === 'atti') {
    return (
      <div className="dashboard-notaio">
        <Sidebar 
          onLogout={onLogout} 
          userRole="notaio" 
          onNavigateToSettings={handleNavigateToSettings}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigateToDocumenti={handleNavigateToDocumenti}
          onNavigateToAtti={handleNavigateToAtti}
          currentView={currentView}
        />
        <div className="dashboard-notaio-main">
          <Header 
            searchValue={searchValue} 
            onSearchChange={handleSearchChange}
            searchPlaceholder={getSearchPlaceholder()}
            user={user}
          />
          <div className="dashboard-notaio-content">
            {/* Titolo Pagina Atti */}
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

            {/* Container Card Atti */}
            <div className="atti-container">
              <div className="atti-card">
                <AttiSidebarNotaio 
                  selectedFilter={attiFilter}
                  onFilterChange={setAttiFilter}
                />
                <div className="atti-separator-vertical"></div>
                <div className="atti-content">
                  <AttiContent selectedFilter={attiFilter} searchValue={searchValue} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Altrimenti mostra la dashboard normale
  return (
    <div className="dashboard-notaio">
      <Sidebar 
        onLogout={onLogout} 
        userRole="notaio" 
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToDashboard={handleBackToDashboard}
        onNavigateToDocumenti={handleNavigateToDocumenti}
        onNavigateToAtti={handleNavigateToAtti}
        currentView={currentView}
      />
      <div className="dashboard-notaio-main">
        <Header 
          searchValue={searchValue} 
          onSearchChange={handleSearchChange}
          searchPlaceholder={getSearchPlaceholder()}
          user={user}
        />
        <div className="dashboard-notaio-content">
          <div className="welcome-section">
            <div className="welcome-container">
              <div className="welcome-text-group">
                <h1 className="welcome-title">
                  Benvenuto 
                </h1>
                <div className="welcome-name-container">
                  <span className="welcome-name">{getNotaryName()}</span>
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
              {/* Appuntamenti del giorno selezionato */}
              {currentAppointments.length === 0 ? (
                <AppointmentCard type="empty" emptySlots={4} />
              ) : currentAppointments.length === 4 ? (
                currentAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    {...appointment}
                    appointmentData={appointment}
                    onClick={() => handleAppointmentSelect(appointment)}
                    isSelected={selectedAppointment?.id === appointment.id}
                    showActions={appointment.status === 'PROVVISORIO'}
                    userRole="notary"
                    onApprove={handleApproveAppointment}
                    onEdit={handleEditAppointment}
                    onCancel={handleCancelAppointment}
                    onDelete={handleDeleteAppointment}
                  />
                ))
              ) : (
                <>
                  {currentAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      {...appointment}
                      appointmentData={appointment}
                      onClick={() => handleAppointmentSelect(appointment)}
                      isSelected={selectedAppointment?.id === appointment.id}
                      showActions={appointment.status === 'PROVVISORIO'}
                      userRole="notary"
                      onApprove={handleApproveAppointment}
                      onEdit={handleEditAppointment}
                      onCancel={handleCancelAppointment}
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
                onEnter={handleOpenVerificationModal}
                documentiCaricati={documentiCaricati}
                documentiTotali={documentiTotali}
                documentiApprovati={documentiApprovati}
              />
            </div>
          </div>

          {/* Sezione specifica Notaio: Metriche + Attività Studio */}
          <div className="notary-section">
            <div className="notary-section-grid">
              <div className="notary-section-left">
                <h2 className="section-title">Riepilogo Attività Notarile</h2>
                <NotaryMetrics />
              </div>
              <div className="notary-section-right">
                <h2 className="section-title">Attività di Studio</h2>
                <StudioActivity />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale Verifica Documenti */}
      {showVerificationModal && selectedAppointment && (
        <DocumentVerificationModal
          appointment={selectedAppointment}
          onClose={handleCloseVerificationModal}
          onDocumentVerified={handleDocumentVerified}
        />
      )}

      {/* Modali Gestione Appuntamenti */}
      {showEditModal && appointmentToAction && (
        <EditAppointmentModal
          appointment={appointmentToAction}
          notaryId={user?.notary_profile?.id}
          onClose={closeAllModals}
          onSuccess={handleActionSuccess}
        />
      )}

      {showCancelModal && appointmentToAction && (
        <ConfirmCancelModal
          appointment={appointmentToAction}
          onClose={closeAllModals}
          onSuccess={handleActionSuccess}
        />
      )}

      {showDeleteModal && appointmentToAction && (
        <ConfirmDeleteModal
          appointment={appointmentToAction}
          onClose={closeAllModals}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Modale Approva Appuntamento */}
      {showApproveModal && appointmentToAction && (
        <ConfirmApproveModal
          appointment={appointmentToAction}
          onClose={closeAllModals}
          onConfirm={handleApproveConfirm}
        />
      )}
    </div>
  )
}

export default DashboardNotaio

