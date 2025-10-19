import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import NotaryMetrics from './NotaryMetrics'
import StudioActivity from './StudioActivity'
import Settings from './Settings'
import ProtectedRoute from './ProtectedRoute'
import './DashboardNotaio.css'

function DashboardNotaio({ onLogout, user }) {
  const [selectedDate, setSelectedDate] = useState(2)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' o 'settings'
  
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

  // Handler per navigazione a Settings
  const handleNavigateToSettings = () => {
    setCurrentView('settings')
  }

  // Handler per tornare alla dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
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

  // Altrimenti mostra la dashboard normale
  return (
    <div className="dashboard-notaio">
      <Sidebar 
        onLogout={onLogout} 
        userRole="notaio" 
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToDashboard={handleBackToDashboard}
        currentView={currentView}
      />
      <div className="dashboard-notaio-main">
        <Header searchValue={searchValue} onSearchChange={handleSearchChange} />
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

