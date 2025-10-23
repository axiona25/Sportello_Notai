import React, { useState, useEffect, useCallback } from 'react'
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
  const [selectedDate, setSelectedDate] = useState(today.getDate())
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
  
  // Ottieni nome e cognome dell'utente
  const getUserName = () => {
    if (user?.cliente_profile) {
      return `${user.cliente_profile.nome} ${user.cliente_profile.cognome}`
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
        status: app.status,
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
  }, [appointmentToAction])

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
    setSelectedAppointment(null) // Reset appuntamento selezionato
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

  // Handler per apertura modale dal pulsante "Entra"
  const handleEnterAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }

  // Handler per chiusura modale
  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false)
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
                    onClick={() => handleAppointmentSelect(appointment)}
                    isSelected={selectedAppointment?.id === appointment.id}
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
                      onClick={() => handleAppointmentSelect(appointment)}
                      isSelected={selectedAppointment?.id === appointment.id}
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

