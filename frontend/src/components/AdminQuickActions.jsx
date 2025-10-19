import React from 'react'
import { Users, Building2, Shield, TrendingUp } from 'lucide-react'
import './AdminQuickActions.css'

function AdminQuickActions({ onNavigateToNotaries, onNavigateToPartners, onRefresh }) {
  const actions = [
    {
      icon: Users,
      title: 'Gestione Notai',
      description: 'Visualizza e gestisci tutti i notai registrati',
      action: onNavigateToNotaries,
      color: '#1668B0'
    },
    {
      icon: Shield,
      title: 'Gestione Licenze',
      description: 'Attiva, rinnova o disattiva licenze notai',
      action: onNavigateToNotaries,
      color: '#27ae60'
    },
    {
      icon: Building2,
      title: 'Gestione Partners',
      description: 'Visualizza e gestisci partners registrati',
      action: onNavigateToPartners,
      color: '#f39c12'
    },
    {
      icon: TrendingUp,
      title: 'Aggiorna Statistiche',
      description: 'Ricarica i dati della dashboard',
      action: onRefresh,
      color: '#9b59b6'
    }
  ]

  return (
    <div className="admin-quick-actions">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <div 
            key={index} 
            className="action-card"
            onClick={action.action}
          >
            <div className="action-icon" style={{ color: action.color }}>
              <Icon size={24} strokeWidth={2} />
            </div>
            <div className="action-content">
              <div className="action-title">{action.title}</div>
              <div className="action-description">{action.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminQuickActions

