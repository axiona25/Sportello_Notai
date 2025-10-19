import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import NotarySelection from './NotarySelection'
import NotaryCards from './NotaryCards'
import './Dashboard.css'

function Dashboard({ onLogout }) {
  const [selectedDate, setSelectedDate] = useState(2)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' o 'atti'

  // Database degli appuntamenti per data
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
    setSelectedAppointment(null) // Reset appuntamento selezionato
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
        <Header searchValue={searchValue} onSearchChange={handleSearchChange} />
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
                      <span className="welcome-name">Antonio Rossi</span>
                      <img src="/assets/element.png" alt="" className="welcome-underline" />
                    </div>
                  </div>
                  <button className="btn-primary">Nuovo</button>
                </div>
              </div>

              <div className="dashboard-grid">
            <div className="dashboard-left">
              <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />
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

              <div className="notary-section">
                <NotaryCards />
              </div>
            </>
          ) : (
            /* Pagina I miei Atti */
            <div className="welcome-section">
              <div className="welcome-container">
                <div className="welcome-text-group">
                  <h1 className="welcome-title">
                    I miei Atti
                  </h1>
                  <div className="welcome-name-container">
                    <span className="welcome-name">Antonio Rossi</span>
                    <img src="/assets/element.png" alt="" className="welcome-underline" />
                  </div>
                </div>
              </div>
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>Sezione in costruzione - Qui verranno mostrati tutti i tuoi atti notarili</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

