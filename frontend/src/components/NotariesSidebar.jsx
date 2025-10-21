import React, { useState, useEffect } from 'react'
import { 
  Users, 
  ChevronDown, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import './AttiSidebar.css'
import adminService from '../services/adminService'

function NotariesSidebar({ selectedFilter, onFilterChange }) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    disabled: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const result = await adminService.getNotaries()
    if (result.success) {
      const notaries = result.data.results || result.data
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)

      setStats({
        total: notaries.length,
        active: notaries.filter(n => n.license_active && (!n.license_expiry_date || new Date(n.license_expiry_date) > thirtyDaysFromNow)).length,
        expiring: notaries.filter(n => n.license_active && n.license_expiry_date && new Date(n.license_expiry_date) <= thirtyDaysFromNow && new Date(n.license_expiry_date) > now).length,
        expired: notaries.filter(n => n.license_expiry_date && new Date(n.license_expiry_date) <= now).length,
        disabled: notaries.filter(n => !n.license_active).length
      })
    }
    setLoading(false)
  }

  const handleTuttiClick = () => {
    onFilterChange(null)
  }

  const handleActiveClick = () => {
    onFilterChange({ type: 'active' })
  }

  const handleExpiringClick = () => {
    onFilterChange({ type: 'expiring' })
  }

  const handleExpiredClick = () => {
    onFilterChange({ type: 'expired' })
  }

  const handleDisabledClick = () => {
    onFilterChange({ type: 'disabled' })
  }

  return (
    <div className="atti-sidebar">
      {/* Tutti i Notai */}
      <div 
        className={`atti-menu-item ${selectedFilter === null ? 'active' : ''}`}
        onClick={handleTuttiClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <Users size={20} strokeWidth={2} />
          <span>Tutti i Notai</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} />
      </div>

      {/* Licenze Attive */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'active' ? 'active' : ''}`}
        onClick={handleActiveClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <CheckCircle size={20} strokeWidth={2} />
          <span>Licenze Attive</span>
        </div>
        {!loading && <span className="atti-count">{stats.active}</span>}
      </div>

      {/* In Scadenza */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'expiring' ? 'active' : ''}`}
        onClick={handleExpiringClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <Clock size={20} strokeWidth={2} />
          <span>In Scadenza</span>
        </div>
        {!loading && <span className="atti-count">{stats.expiring}</span>}
      </div>

      {/* Scadute */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'expired' ? 'active' : ''}`}
        onClick={handleExpiredClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <AlertCircle size={20} strokeWidth={2} />
          <span>Scadute</span>
        </div>
        {!loading && <span className="atti-count">{stats.expired}</span>}
      </div>

      {/* Disattivate */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'disabled' ? 'active' : ''}`}
        onClick={handleDisabledClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <XCircle size={20} strokeWidth={2} />
          <span>Disattivate</span>
        </div>
        {!loading && <span className="atti-count">{stats.disabled}</span>}
      </div>

      {/* Separatore */}
      <div className="atti-separator"></div>

      {/* Totale Notai */}
      <div className="atti-total">
        <div className="atti-total-header">
          <Users size={20} strokeWidth={2} />
          <span>Totale Notai</span>
        </div>
        <div className="atti-total-bar">
          <div 
            className="atti-total-bar-fill" 
            style={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : '0%' }}
          ></div>
        </div>
        <div className="atti-total-text">
          {stats.active} Attivi su {stats.total} totali
        </div>
      </div>
    </div>
  )
}

export default NotariesSidebar
