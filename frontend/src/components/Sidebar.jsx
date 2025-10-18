import React from 'react'
import { LayoutGrid, FileText, MessageSquare, Settings, LogOut } from 'lucide-react'
import './Sidebar.css'

const DashboardIconActive = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="12" y="2" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="2" y="12" width="8" height="8" rx="2" fill="#1668B0" />
    <rect x="12" y="12" width="8" height="8" rx="2" fill="#1668B0" />
  </svg>
);

function Sidebar({ onLogout, userRole, onNavigateToSettings, onNavigateToDashboard, currentView = 'dashboard' }) {
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
        <a 
          href="#" 
          className="nav-item"
          onClick={(e) => {
            e.preventDefault()
            if (onNavigateToDashboard) {
              onNavigateToDashboard()
            }
          }}
        >
          <FileText size={22} strokeWidth={2} />
          <span>Documenti</span>
        </a>
        <a 
          href="#" 
          className="nav-item"
          onClick={(e) => {
            e.preventDefault()
            if (onNavigateToDashboard) {
              onNavigateToDashboard()
            }
          }}
        >
          <MessageSquare size={22} strokeWidth={2} />
          <span>Messaggi</span>
        </a>
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

