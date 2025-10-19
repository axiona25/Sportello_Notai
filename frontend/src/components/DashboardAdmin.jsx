import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import AdminMetrics from './AdminMetrics'
import AdminQuickActions from './AdminQuickActions'
import NotariesManagement from './NotariesManagement'
import PartnersManagement from './PartnersManagement'
import adminService from '../services/adminService'
import './DashboardAdmin.css'

function DashboardAdmin({ onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [searchValue, setSearchValue] = useState('')
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

  const handleNavigateToNotaries = () => {
    setCurrentView('notaries')
  }

  const handleNavigateToPartners = () => {
    setCurrentView('partners')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
  }

  // Render condizionale per sottopagine
  if (currentView === 'notaries') {
    return <NotariesManagement searchValue={searchValue} onBack={handleBackToDashboard} />
  }

  if (currentView === 'partners') {
    return <PartnersManagement searchValue={searchValue} onBack={handleBackToDashboard} />
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
        <Header 
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          userRole="admin"
        />
        
        <div className="dashboard-admin-content">
          {/* Welcome Section - Stile identico alle altre dashboard */}
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

          {/* Dashboard Grid - Stile identico */}
          <div className="dashboard-grid">
            <div className="dashboard-left">
              <AdminQuickActions 
                onNavigateToNotaries={handleNavigateToNotaries}
                onNavigateToPartners={handleNavigateToPartners}
                onRefresh={loadStats}
              />
            </div>

            <div className="dashboard-center">
              {loading ? (
                <div className="admin-loading-state">
                  <div className="loading-spinner"></div>
                  <p>Caricamento statistiche...</p>
                </div>
              ) : !stats ? (
                <div className="admin-error-state">
                  <p>Errore nel caricamento delle statistiche</p>
                  <button onClick={loadStats} className="btn-retry">Riprova</button>
                </div>
              ) : (
                <div className="admin-stats-info">
                  <div className="stats-summary-card">
                    <h3>Riepilogo Sistema</h3>
                    <div className="stats-summary-content">
                      <div className="summary-item">
                        <span className="summary-label">Notai Totali</span>
                        <span className="summary-value">{stats.notaries.total}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Licenze Attive</span>
                        <span className="summary-value success">{stats.notaries.active_licenses}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">In Scadenza</span>
                        <span className="summary-value warning">{stats.notaries.expiring_soon}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Scadute</span>
                        <span className="summary-value danger">{stats.notaries.expired_licenses}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stats-summary-card">
                    <h3>Revenue</h3>
                    <div className="stats-summary-content">
                      <div className="summary-item">
                        <span className="summary-label">Mensile</span>
                        <span className="summary-value">
                          €{stats.revenue.monthly.toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Annuale</span>
                        <span className="summary-value">
                          €{stats.revenue.annual.toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div className="summary-item full-width">
                        <span className="summary-label">Proiezione Totale</span>
                        <span className="summary-value success large">
                          €{stats.revenue.projected_annual.toLocaleString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alert per licenze in scadenza/scadute */}
                  {(stats.notaries.expiring_soon > 0 || stats.notaries.expired_licenses > 0) && (
                    <div className="stats-alerts">
                      {stats.notaries.expiring_soon > 0 && (
                        <div className="alert-card warning">
                          <span className="alert-icon">⚠️</span>
                          <div className="alert-content">
                            <strong>{stats.notaries.expiring_soon}</strong> licenze scadranno nei prossimi 30 giorni
                          </div>
                        </div>
                      )}
                      {stats.notaries.expired_licenses > 0 && (
                        <div className="alert-card danger">
                          <span className="alert-icon">❌</span>
                          <div className="alert-content">
                            <strong>{stats.notaries.expired_licenses}</strong> licenze sono scadute
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dashboard-right">
              <div className="stats-summary-card appointments-card">
                <h3>Appuntamenti</h3>
                <div className="stats-summary-content">
                  <div className="summary-item">
                    <span className="summary-label">Totali</span>
                    <span className="summary-value">{stats?.appointments.total || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">In Attesa</span>
                    <span className="summary-value warning">{stats?.appointments.pending || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Completati</span>
                    <span className="summary-value success">{stats?.appointments.completed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Metriche - Stile identico a NotarySection */}
          <div className="admin-section">
            <h2 className="section-title">Metriche Dettagliate</h2>
            <AdminMetrics stats={stats} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin
