import React from 'react'
import { Check, X, AlertTriangle, Clock, MoreVertical } from 'lucide-react'
import './AdminSystemSummary.css'

function AdminSystemSummary({ stats }) {
  // Mock data per ora - stile identico a StudioActivity
  const systemActivities = [
    {
      id: 1,
      date: 'Oggi 14:30',
      title: 'Licenze Attive',
      value: stats?.notaries?.active_licenses || 0,
      total: stats?.notaries?.total || 0,
      description: 'Notai con licenza valida',
      status: 'success'
    },
    {
      id: 2,
      date: 'Oggi 14:30',
      title: 'Licenze Scadute',
      value: stats?.notaries?.expired_licenses || 0,
      total: stats?.notaries?.total || 0,
      description: 'Richiedono rinnovo immediato',
      status: 'danger'
    },
    {
      id: 3,
      date: 'Oggi 14:30',
      title: 'In Scadenza',
      value: stats?.notaries?.expiring_soon || 0,
      total: stats?.notaries?.total || 0,
      description: 'Scadenza entro 30 giorni',
      status: 'warning'
    },
    {
      id: 4,
      date: 'Oggi 14:30',
      title: 'Appuntamenti Pending',
      value: stats?.appointments?.pending || 0,
      total: stats?.appointments?.total || 0,
      description: 'In attesa di conferma',
      status: 'warning'
    },
    {
      id: 5,
      date: 'Oggi 14:30',
      title: 'Revenue Proiettata',
      value: `€${(stats?.revenue?.projected_annual || 0).toLocaleString('it-IT')}`,
      total: null,
      description: 'Stima annuale corrente',
      status: 'success'
    }
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Check size={16} />
      case 'danger':
        return <X size={16} />
      case 'warning':
        return <AlertTriangle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  return (
    <div className="admin-system-summary">
      <div className="summary-header">
        <h3 className="summary-title">Riepilogo Gestione Sistema</h3>
        <button className="summary-menu-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="summary-list">
        {systemActivities.map((activity) => (
          <div key={activity.id} className="summary-item">
            <div className="summary-time">{activity.date}</div>
            
            <div className="summary-content">
              <div className="summary-info">
                <div className="summary-value-badge">
                  {typeof activity.value === 'number' && activity.total !== null 
                    ? `${activity.value}/${activity.total}`
                    : activity.value
                  }
                </div>
                <div className="summary-text">
                  <div className="summary-item-title">{activity.title}</div>
                  <div className="summary-description">
                    {activity.description}
                  </div>
                </div>
              </div>

              <div className="summary-actions">
                <button 
                  className={`summary-status-btn status-${activity.status}`}
                >
                  {getStatusIcon(activity.status)}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminSystemSummary

