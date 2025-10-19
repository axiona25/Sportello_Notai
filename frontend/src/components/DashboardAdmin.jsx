import React, { useState, useEffect } from 'react'
import { Users, Building2, TrendingUp, AlertCircle, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
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
    loadStats()
  }, [])

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
    loadStats() // Ricarica stats quando torna alla dashboard
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
  }

  // Render condizionale del contenuto
  const renderContent = () => {
    switch (currentView) {
      case 'notaries':
        return <NotariesManagement searchValue={searchValue} onBack={handleBackToDashboard} />
      case 'partners':
        return <PartnersManagement searchValue={searchValue} onBack={handleBackToDashboard} />
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Caricamento statistiche...</p>
        </div>
      )
    }

    if (!stats) {
      return (
        <div className="admin-error">
          <AlertCircle size={48} color="#e74c3c" />
          <p>Errore nel caricamento delle statistiche</p>
          <button onClick={loadStats} className="btn-reload">Riprova</button>
        </div>
      )
    }

    return (
      <div className="admin-dashboard-content">
        {/* Titolo principale */}
        <div className="admin-welcome-section">
          <h1 className="admin-main-title">Dashboard Amministratore</h1>
          <p className="admin-subtitle">Gestione notai, partners e licenze</p>
        </div>

        {/* Cards principali - Notai e Licenze */}
        <div className="admin-stats-grid">
          {/* Card Notai */}
          <div className="admin-stat-card admin-card-primary">
            <div className="admin-card-icon">
              <Users size={32} />
            </div>
            <div className="admin-card-content">
              <h3>Notai Registrati</h3>
              <div className="admin-card-number">{stats.notaries.total}</div>
              <div className="admin-card-details">
                <div className="admin-detail-item">
                  <CheckCircle size={16} color="#27ae60" />
                  <span>{stats.notaries.active_licenses} Attive</span>
                </div>
                <div className="admin-detail-item">
                  <AlertCircle size={16} color="#f39c12" />
                  <span>{stats.notaries.expiring_soon} In scadenza</span>
                </div>
                <div className="admin-detail-item">
                  <XCircle size={16} color="#e74c3c" />
                  <span>{stats.notaries.expired_licenses} Scadute</span>
                </div>
              </div>
              <button className="admin-card-action" onClick={handleNavigateToNotaries}>
                Gestisci Notai →
              </button>
            </div>
          </div>

          {/* Card Revenue */}
          <div className="admin-stat-card admin-card-success">
            <div className="admin-card-icon">
              <DollarSign size={32} />
            </div>
            <div className="admin-card-content">
              <h3>Revenue Licenze</h3>
              <div className="admin-card-number">
                €{stats.revenue.projected_annual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </div>
              <div className="admin-card-details">
                <div className="admin-detail-item">
                  <span>Mensile: €{stats.revenue.monthly.toLocaleString('it-IT')}</span>
                </div>
                <div className="admin-detail-item">
                  <span>Annuale: €{stats.revenue.annual.toLocaleString('it-IT')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Appuntamenti */}
          <div className="admin-stat-card admin-card-info">
            <div className="admin-card-icon">
              <Calendar size={32} />
            </div>
            <div className="admin-card-content">
              <h3>Appuntamenti</h3>
              <div className="admin-card-number">{stats.appointments.total}</div>
              <div className="admin-card-details">
                <div className="admin-detail-item">
                  <span>In attesa: {stats.appointments.pending}</span>
                </div>
                <div className="admin-detail-item">
                  <span>Completati: {stats.appointments.completed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Partners */}
          <div className="admin-stat-card admin-card-warning">
            <div className="admin-card-icon">
              <Building2 size={32} />
            </div>
            <div className="admin-card-content">
              <h3>Partners</h3>
              <div className="admin-card-number">-</div>
              <div className="admin-card-details">
                <div className="admin-detail-item">
                  <span>Gestione completa partners</span>
                </div>
              </div>
              <button className="admin-card-action" onClick={handleNavigateToPartners}>
                Gestisci Partners →
              </button>
            </div>
          </div>
        </div>

        {/* Sezione Licenze in Scadenza */}
        {stats.notaries.expiring_soon > 0 && (
          <div className="admin-alert-section">
            <div className="admin-alert admin-alert-warning">
              <AlertCircle size={24} />
              <div className="admin-alert-content">
                <h4>Attenzione: Licenze in Scadenza</h4>
                <p>
                  Ci sono <strong>{stats.notaries.expiring_soon}</strong> licenze che scadranno nei prossimi 30 giorni.
                  Contatta i notai per il rinnovo.
                </p>
                <button className="btn-outline-sm" onClick={handleNavigateToNotaries}>
                  Visualizza Dettagli
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sezione Licenze Scadute */}
        {stats.notaries.expired_licenses > 0 && (
          <div className="admin-alert-section">
            <div className="admin-alert admin-alert-danger">
              <XCircle size={24} />
              <div className="admin-alert-content">
                <h4>Licenze Scadute</h4>
                <p>
                  Ci sono <strong>{stats.notaries.expired_licenses}</strong> licenze scadute.
                  I notai con licenza scaduta non possono accettare nuovi appuntamenti.
                </p>
                <button className="btn-outline-sm" onClick={handleNavigateToNotaries}>
                  Gestisci Licenze
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sezione Quick Actions */}
        <div className="admin-quick-actions">
          <h2>Azioni Rapide</h2>
          <div className="admin-actions-grid">
            <button className="admin-action-btn" onClick={handleNavigateToNotaries}>
              <Users size={20} />
              <span>Aggiungi Notaio</span>
            </button>
            <button className="admin-action-btn" onClick={handleNavigateToPartners}>
              <Building2 size={20} />
              <span>Aggiungi Partner</span>
            </button>
            <button className="admin-action-btn" onClick={loadStats}>
              <TrendingUp size={20} />
              <span>Aggiorna Statistiche</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        userRole="admin"
        onNavigateToNotaries={handleNavigateToNotaries}
        onNavigateToPartners={handleNavigateToPartners}
        onNavigateToDashboard={handleBackToDashboard}
        currentView={currentView}
        onLogout={onLogout}
      />
      
      <div className="main-content">
        <Header 
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          userRole="admin"
        />
        
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin

