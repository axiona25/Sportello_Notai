import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import NotaryMetrics from './NotaryMetrics'
import StudioActivity from './StudioActivity'
import Settings from './Settings'
import ProtectedRoute from './ProtectedRoute'
import DocumentiSidebar from './DocumentiSidebar'
import DocumentiContent from './DocumentiContent'
import AttiSidebarNotaio from './AttiSidebarNotaio'
import AttiContent from './AttiContent'
import './DashboardNotaio.css'

function DashboardNotaio({ onLogout, user: initialUser }) {
  const [selectedDate, setSelectedDate] = useState(2)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'settings', 'documenti', o 'atti'
  const [attiFilter, setAttiFilter] = useState(null) // Filtro per gli atti (cliente)
  const [user, setUser] = useState(initialUser)

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
  const allAppointments = searchValue
    ? Object.values(appointmentsByDate).flat() // Tutti gli appuntamenti dell'anno
    : (appointmentsByDate[selectedDate] || []) // Solo del giorno selezionato
  
  // Filtra appuntamenti in base alla ricerca e limita a 4 risultati
  const currentAppointments = searchValue
    ? allAppointments.filter(appointment => {
        const searchLower = searchValue.toLowerCase()
        return (
          appointment.title?.toLowerCase().includes(searchLower) ||
          appointment.location?.toLowerCase().includes(searchLower) ||
          appointment.description?.toLowerCase().includes(searchLower) ||
          appointment.time?.toLowerCase().includes(searchLower)
        )
      }).slice(0, 4) // Limita a 4 risultati
    : allAppointments

  // Handler per cambio data
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedAppointment(null)
  }

  // Handler per selezione appuntamento
  const handleAppointmentSelect = (appointment) => {
    if (appointment.type !== 'empty') {
      setSelectedAppointment(appointment)
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
              <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />
            </div>

            <div className="dashboard-center">
              {currentAppointments.length === 0 ? (
                <AppointmentCard type="empty" emptySlots={4} />
              ) : currentAppointments.length === 4 ? (
                currentAppointments.map((appointment) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    {...appointment}
                    onClick={() => handleAppointmentSelect(appointment)}
                    isSelected={selectedAppointment?.id === appointment.id}
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
              <DeedDetailCard appointment={selectedAppointment} />
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
    </div>
  )
}

export default DashboardNotaio

