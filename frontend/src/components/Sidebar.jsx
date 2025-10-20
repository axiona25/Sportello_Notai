import React from 'react'
import { LayoutGrid, FileText, Settings, LogOut, Users, Building2, FileCheck } from 'lucide-react'
import './Sidebar.css'

const DashboardIconActive = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="12" y="2" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="2" y="12" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="12" y="12" width="8" height="8" rx="2" fill="#1668B0" />
  </svg>
);

function Sidebar({ onLogout, userRole, onNavigateToSettings, onNavigateToDashboard, onNavigateToNotaries, onNavigateToPartners, onNavigateToAtti, onNavigateToDocumenti, currentView = 'dashboard' }) {
  const handleLogoutClick = (e) => {
    e.preventDefault()
    if (onLogout) {
      onLogout()
    }
  }

  const handleSettingsClick = (e) => {
    e.preventDefault()
    if (onNavigateToSettings) {
      onNavigateToSettings()
    }
  }

  const handleDashboardClick = (e) => {
    e.preventDefault()
    if (onNavigateToDashboard) {
      onNavigateToDashboard()
    }
  }

  const handleNotariesClick = (e) => {
    e.preventDefault()
    if (onNavigateToNotaries) {
      onNavigateToNotaries()
    }
  }

  const handlePartnersClick = (e) => {
    e.preventDefault()
    if (onNavigateToPartners) {
      onNavigateToPartners()
    }
  }

  const handleAttiClick = (e) => {
    e.preventDefault()
    if (onNavigateToAtti) {
      onNavigateToAtti()
    }
  }

  const handleDocumentiClick = (e) => {
    e.preventDefault()
    if (onNavigateToDocumenti) {
      onNavigateToDocumenti()
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-digital">Digital</span> 
          <div className="logo-notary-container">
            <span className="logo-notary">Notary</span>
            <img src="/assets/element.png" alt="" className="logo-underline" />
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a 
          href="#" 
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={handleDashboardClick}
        >
          {currentView === 'dashboard' ? (
            <DashboardIconActive />
          ) : (
            <LayoutGrid size={22} strokeWidth={2} />
          )}
          <span>Dashboard</span>
        </a>

        {/* Admin-specific navigation */}
        {userRole === 'admin' && (
          <>
            <a 
              href="#" 
              className={`nav-item ${currentView === 'notaries' ? 'active' : ''}`}
              onClick={handleNotariesClick}
            >
              <Users size={22} strokeWidth={2} />
              <span>Notai</span>
            </a>
            <a 
              href="#" 
              className={`nav-item ${currentView === 'partners' ? 'active' : ''}`}
              onClick={handlePartnersClick}
            >
              <Building2 size={22} strokeWidth={2} />
              <span>Partners</span>
            </a>
          </>
        )}

        {/* Cliente-specific navigation */}
        {userRole === 'cliente' && (
          <a 
            href="#" 
            className={`nav-item ${currentView === 'atti' ? 'active' : ''}`}
            onClick={handleAttiClick}
          >
            <FileCheck size={22} strokeWidth={2} />
            <span>I miei Atti</span>
          </a>
        )}

        {/* Notaio-specific navigation - I miei Atti */}
        {userRole === 'notaio' && (
          <a 
            href="#" 
            className={`nav-item ${currentView === 'atti' ? 'active' : ''}`}
            onClick={handleAttiClick}
          >
            <FileCheck size={22} strokeWidth={2} />
            <span>I miei Atti</span>
          </a>
        )}

        {/* Cliente/Notaio navigation - Documenti */}
        {userRole !== 'admin' && (
          <a 
            href="#" 
            className={`nav-item ${currentView === 'documenti' ? 'active' : ''}`}
            onClick={handleDocumentiClick}
          >
            <FileText size={22} strokeWidth={2} />
            <span>Documenti</span>
          </a>
        )}

        {/* Notaio-specific navigation - Impostazioni */}
        {userRole === 'notaio' && (
          <a 
            href="#" 
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={handleSettingsClick}
          >
            <Settings size={22} strokeWidth={2} />
            <span>Impostazioni</span>
          </a>
        )}
      </nav>

      <div className="sidebar-footer">
        <a href="#" className="nav-item logout" onClick={handleLogoutClick}>
          <LogOut size={20} strokeWidth={2} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar

