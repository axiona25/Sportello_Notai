import React, { useState, useEffect, useCallback } from 'react'
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
  const { showToast: toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(today.getDate())
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'settings', 'documenti', o 'atti'
  const [attiFilter, setAttiFilter] = useState(null) // Filtro per gli atti (cliente)
  const [user, setUser] = useState(initialUser)
  const [provisionalAppointments, setProvisionalAppointments] = useState([]) // Appuntamenti provvisori
  const [currentAppointments, setCurrentAppointments] = useState([]) // Appuntamenti del giorno selezionato
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  
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

  // Carica appuntamenti provvisori dal backend
  const loadProvisionalAppointments = useCallback(async (showLoader = true) => {
    try {
      // Mostra loader solo al primo caricamento, non durante i refresh automatici
      if (showLoader) {
        setLoadingAppointments(true)
      }
      
      // Carica tutti gli appuntamenti e filtra quelli con stato PROVVISORIO
      const result = await appointmentService.getNotaryAppointments()
      if (result.success && Array.isArray(result.data)) {
        const provisional = result.data.filter(app => app.stato === 'PROVVISORIO')
        
        // Aggiorna solo se ci sono effettivi cambiamenti (evita re-render inutili)
        setProvisionalAppointments(prev => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(provisional)
          return hasChanged ? provisional : prev
        })
      }
    } catch (error) {
      console.error('Errore caricamento appuntamenti provvisori:', error)
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

  // ✅ Listener per selezionare appuntamento da notifica
  useEffect(() => {
    const handleSelectAppointment = async (event) => {
      const { appointmentId } = event.detail
      
      // Carica gli appuntamenti se non sono già caricati
      if (provisionalAppointments.length === 0) {
        await loadProvisionalAppointments(true)
      }
      
      // Trova l'appuntamento nella lista
      const appointment = provisionalAppointments.find(app => app.id === appointmentId)
      
      if (appointment) {
        // Seleziona l'appuntamento (apre la card di dettaglio)
        handleAppointmentSelect(appointment)
      }
    }
    
    window.addEventListener('select-appointment', handleSelectAppointment)
    
    return () => {
      window.removeEventListener('select-appointment', handleSelectAppointment)
    }
  }, [provisionalAppointments])

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
    if (user?.notary_profile?.studio_name) {
      return user.notary_profile.studio_name
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
    setSelectedAppointment(null)
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
      const documentiDalBackend = await appointmentExtendedService.getDocumentiAppuntamento(appointment.id)
      // ✅ Conta SOLO documenti con file effettivamente caricato
      const caricati = Array.isArray(documentiDalBackend) 
        ? documentiDalBackend.filter(doc => doc.file || doc.file_path).length 
        : 0
      
      // Conta documenti approvati
      const approvati = Array.isArray(documentiDalBackend) 
        ? documentiDalBackend.filter(doc => 
            doc.stato === 'VERIFICATO' || 
            doc.stato === 'ACCETTATO' || 
            doc.stato === 'APPROVATO'
          ).length 
        : 0
      
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

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false)
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
                    onClick={() => handleAppointmentSelect(appointment)}
                    isSelected={selectedAppointment?.id === appointment.id}
                    showActions={appointment.status === 'PROVVISORIO'}
                    userRole="notary"
                    onApprove={handleApproveAppointment}
                    onEdit={handleEditAppointment}
                    onCancel={handleCancelAppointment}
                    onDelete={handleDeleteAppointment}
                    appointmentData={appointment.rawData}
                  />
                ))
              ) : (
                <>
                  {currentAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      {...appointment}
                      onClick={() => handleAppointmentSelect(appointment)}
                      isSelected={selectedAppointment?.id === appointment.id}
                      showActions={appointment.status === 'PROVVISORIO'}
                      userRole="notary"
                      onApprove={handleApproveAppointment}
                      onEdit={handleEditAppointment}
                      onCancel={handleCancelAppointment}
                      onDelete={handleDeleteAppointment}
                      appointmentData={appointment.rawData}
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

