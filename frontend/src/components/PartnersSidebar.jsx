import React, { useState, useEffect } from 'react'
import { 
  Briefcase, 
  ChevronDown, 
  CheckCircle,
  XCircle
} from 'lucide-react'
import './AttiSidebar.css'
import adminService from '../services/adminService'

function PartnersSidebar({ selectedFilter, onFilterChange }) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    disabled: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const result = await adminService.getPartners()
    if (result.success) {
      const partners = result.data.results || result.data
      
      setStats({
        total: partners.length,
        active: partners.filter(p => p.is_active).length,
        disabled: partners.filter(p => !p.is_active).length
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

  const handleDisabledClick = () => {
    onFilterChange({ type: 'disabled' })
  }

  return (
    <div className="atti-sidebar">
      {/* Tutti i Partners */}
      <div 
        className={`atti-menu-item ${selectedFilter === null ? 'active' : ''}`}
        onClick={handleTuttiClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <Briefcase size={20} strokeWidth={2} />
          <span>Tutti i Partners</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} />
      </div>

      {/* Attivi */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'active' ? 'active' : ''}`}
        onClick={handleActiveClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <CheckCircle size={20} strokeWidth={2} />
          <span>Attivi</span>
        </div>
        {!loading && <span className="atti-count">{stats.active}</span>}
      </div>

      {/* Disattivati */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'disabled' ? 'active' : ''}`}
        onClick={handleDisabledClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <XCircle size={20} strokeWidth={2} />
          <span>Disattivati</span>
        </div>
        {!loading && <span className="atti-count">{stats.disabled}</span>}
      </div>

      {/* Separatore */}
      <div className="atti-separator"></div>

      {/* Totale Partners */}
      <div className="atti-total">
        <div className="atti-total-header">
          <Briefcase size={20} strokeWidth={2} />
          <span>Totale Partners</span>
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

export default PartnersSidebar
