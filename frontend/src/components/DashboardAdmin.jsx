import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import AdminSystemSummary from './AdminSystemSummary'
import NotariesManagement from './NotariesManagement'
import PartnersManagement from './PartnersManagement'
import adminService from '../services/adminService'
import './DashboardAdmin.css'

function DashboardAdmin({ onLogout }) {
  const [selectedDate, setSelectedDate] = useState(2)
  const [selectedStat, setSelectedStat] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadStats()
    }
  }, [currentView])

  const loadStats = async () => {
    setLoading(true)
    const result = await adminService.getStats()
    if (result.success) {
      setStats(result.data)
    }
    setLoading(false)
  }

  // Database delle statistiche per "data" (simula calendario appuntamenti)
  const statsByDate = {
    2: [
      {
        id: 'stat-2-1',
        type: 'stat',
        title: 'Licenze Attive',
        description: `${stats?.notaries.active_licenses || 0} licenze attive`,
        deadline: 'Aggiornato ora'
      },
      {
        id: 'stat-2-2',
        type: 'stat',
        title: 'Revenue Mensile',
        description: `€${(stats?.revenue.monthly || 0).toLocaleString('it-IT')}`,
        deadline: 'Proiezione'
      },
      {
        id: 'stat-2-3',
        type: 'stat',
        title: 'Appuntamenti Pending',
        description: `${stats?.appointments.pending || 0} in attesa`,
        deadline: 'Da gestire'
      },
      {
        id: 'stat-2-4',
        type: 'stat',
        title: 'Licenze in Scadenza',
        description: `${stats?.notaries.expiring_soon || 0} entro 30 giorni`,
        deadline: 'Alert'
      }
    ],
    6: [
      {
        id: 'stat-6-1',
        type: 'stat',
        title: 'Notai Totali',
        description: `${stats?.notaries.total || 0} registrati`,
        deadline: 'Database'
      },
      {
        id: 'stat-6-2',
        type: 'stat',
        title: 'Licenze Scadute',
        description: `${stats?.notaries.expired_licenses || 0} da rinnovare`,
        deadline: 'Urgente'
      }
    ],
    16: [
      {
        id: 'stat-16-1',
        type: 'stat',
        title: 'Revenue Annuale',
        description: `€${(stats?.revenue.annual || 0).toLocaleString('it-IT')}`,
        deadline: 'Contratti attivi'
      },
      {
        id: 'stat-16-2',
        type: 'stat',
        title: 'Appuntamenti Completati',
        description: `${stats?.appointments.completed || 0} totali`,
        deadline: 'Storico'
      }
    ],
    22: [
      {
        id: 'stat-22-1',
        type: 'stat',
        title: 'Proiezione Revenue',
        description: `€${(stats?.revenue.projected_annual || 0).toLocaleString('it-IT')}`,
        deadline: 'Anno corrente'
      }
    ]
  }

  const allStats = searchValue
    ? Object.values(statsByDate).flat()
    : (statsByDate[selectedDate] || [])
  
  const currentStats = searchValue
    ? allStats.filter(stat => {
        const searchLower = searchValue.toLowerCase()
        return (
          stat.title?.toLowerCase().includes(searchLower) ||
          stat.description?.toLowerCase().includes(searchLower)
        )
      }).slice(0, 4)
    : allStats

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedStat(null)
  }

  const handleStatSelect = (stat) => {
    if (stat.type !== 'empty') {
      setSelectedStat(stat)
    }
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
  }

  const handleNavigateToNotaries = () => {
    setCurrentView('notaries')
  }

  const handleNavigateToPartners = () => {
    setCurrentView('partners')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  // Render sottopagine
  if (currentView === 'notaries') {
    return (
      <NotariesManagement 
        onLogout={onLogout} 
        onBack={handleBackToDashboard}
        onNavigateToDashboard={handleBackToDashboard}
        onNavigateToNotaries={handleNavigateToNotaries}
        onNavigateToPartners={handleNavigateToPartners}
      />
    )
  }

  if (currentView === 'partners') {
    return (
      <PartnersManagement 
        onLogout={onLogout} 
        onBack={handleBackToDashboard}
        onNavigateToDashboard={handleBackToDashboard}
        onNavigateToNotaries={handleNavigateToNotaries}
        onNavigateToPartners={handleNavigateToPartners}
      />
    )
  }

  // Dashboard principale
  return (
    <div className="dashboard-admin">
      <Sidebar 
        onLogout={onLogout} 
        userRole="admin"
        onNavigateToNotaries={handleNavigateToNotaries}
        onNavigateToPartners={handleNavigateToPartners}
        onNavigateToDashboard={handleBackToDashboard}
        currentView={currentView}
      />
      
      <div className="dashboard-admin-main">
        <Header searchValue={searchValue} onSearchChange={handleSearchChange} user={user} />
        
        <div className="dashboard-admin-content">
          {/* Welcome Section - IDENTICA */}
          <div className="welcome-section">
            <div className="welcome-container">
              <div className="welcome-text-group">
                <h1 className="welcome-title">
                  Benvenuto 
                </h1>
                <div className="welcome-name-container">
                  <span className="welcome-name">Amministratore</span>
                  <img src="/assets/element.png" alt="" className="welcome-underline" />
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid - IDENTICA */}
          <div className="dashboard-grid">
            <div className="dashboard-left">
              <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />
            </div>

            <div className="dashboard-center">
              {loading ? (
                <>
                  <AppointmentCard type="empty" emptySlots={4} />
                </>
              ) : currentStats.length === 0 ? (
                <AppointmentCard type="empty" emptySlots={4} />
              ) : currentStats.length === 4 ? (
                currentStats.map((stat) => (
                  <AppointmentCard 
                    key={stat.id} 
                    {...stat}
                    type="document"
                    onClick={() => handleStatSelect(stat)}
                    isSelected={selectedStat?.id === stat.id}
                  />
                ))
              ) : (
                <>
                  {currentStats.map((stat) => (
                    <AppointmentCard 
                      key={stat.id} 
                      {...stat}
                      type="document"
                      onClick={() => handleStatSelect(stat)}
                      isSelected={selectedStat?.id === stat.id}
                    />
                  ))}
                  <AppointmentCard 
                    key="empty" 
                    type="empty" 
                    emptySlots={4 - currentStats.length}
                  />
                </>
              )}
            </div>

            <div className="dashboard-right">
              <DeedDetailCard appointment={selectedStat} />
            </div>
          </div>

          {/* Sezione Admin (identica a notary-section) */}
          <div className="admin-section">
            <div className="admin-section-grid">
              <div className="admin-section-left">
                <h2 className="section-title">Riepilogo Gestione Sistema</h2>
                <AdminSystemSummary stats={stats} />
              </div>
              <div className="admin-section-right">
                <h2 className="section-title">Azioni Rapide</h2>
                <div className="admin-quick-actions-card">
                  <button 
                    className="admin-action-button" 
                    onClick={handleNavigateToNotaries}
                  >
                    <span className="action-icon">👥</span>
                    <span className="action-text">Gestisci Notai</span>
                  </button>
                  <button 
                    className="admin-action-button"
                    onClick={handleNavigateToPartners}
                  >
                    <span className="action-icon">🏢</span>
                    <span className="action-text">Gestisci Partners</span>
                  </button>
                  <button 
                    className="admin-action-button"
                    onClick={loadStats}
                  >
                    <span className="action-icon">🔄</span>
                    <span className="action-text">Aggiorna Stats</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin
