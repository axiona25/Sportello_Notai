import React from 'react'
import { LayoutGrid, FileText, MessageSquare, LogOut } from 'lucide-react'
import './Sidebar.css'

const DashboardIconActive = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#83E0F7" />
        <stop offset="100%" stopColor="#1668B0" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="8" height="8" rx="2" fill="url(#dashboardGradient)" />
    <rect x="12" y="2" width="8" height="8" rx="2" fill="url(#dashboardGradient)" />
    <rect x="2" y="12" width="8" height="8" rx="2" fill="url(#dashboardGradient)" />
    <rect x="12" y="12" width="8" height="8" rx="2" fill="url(#dashboardGradient)" />
  </svg>
);

function Sidebar() {
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
        <a href="#" className="nav-item active">
          <DashboardIconActive />
          <span>Dashboard</span>
        </a>
        <a href="#" className="nav-item">
          <FileText size={22} strokeWidth={2} />
          <span>Documenti</span>
        </a>
        <a href="#" className="nav-item">
          <MessageSquare size={22} strokeWidth={2} />
          <span>Messaggi</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <a href="#" className="nav-item logout">
          <LogOut size={20} strokeWidth={2} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar

