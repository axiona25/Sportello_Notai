import React from 'react'
import { TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import './AdminMetrics.css'

function AdminMetrics({ stats }) {
  if (!stats) {
    return <div className="admin-metrics loading">Caricamento...</div>
  }

  const metrics = [
    {
      icon: Users,
      label: 'Notai Attivi',
      value: stats.notaries?.active_licenses || 0,
      total: stats.notaries?.total || 0,
      color: '#1668B0',
      bgColor: 'rgba(22, 104, 176, 0.1)'
    },
    {
      icon: AlertTriangle,
      label: 'Licenze Scadute',
      value: stats.notaries?.expired_licenses || 0,
      total: stats.notaries?.total || 0,
      color: '#e74c3c',
      bgColor: 'rgba(231, 76, 60, 0.1)'
    },
    {
      icon: Calendar,
      label: 'Appuntamenti',
      value: stats.appointments?.pending || 0,
      total: stats.appointments?.total || 0,
      color: '#3498db',
      bgColor: 'rgba(52, 152, 219, 0.1)'
    },
    {
      icon: DollarSign,
      label: 'Revenue Annuale',
      value: `€${(stats.revenue?.projected_annual || 0).toLocaleString('it-IT')}`,
      subtitle: 'Proiezione',
      color: '#27ae60',
      bgColor: 'rgba(39, 174, 96, 0.1)'
    },
    {
      icon: TrendingUp,
      label: 'In Scadenza',
      value: stats.notaries?.expiring_soon || 0,
      total: stats.notaries?.total || 0,
      color: '#f39c12',
      bgColor: 'rgba(243, 156, 18, 0.1)'
    },
    {
      icon: Calendar,
      label: 'Completati',
      value: stats.appointments?.completed || 0,
      total: stats.appointments?.total || 0,
      color: '#9b59b6',
      bgColor: 'rgba(155, 89, 182, 0.1)'
    }
  ]

  return (
    <div className="admin-metrics">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div key={index} className="metric-card">
            <div 
              className="metric-icon" 
              style={{ backgroundColor: metric.bgColor }}
            >
              <Icon size={24} color={metric.color} strokeWidth={2} />
            </div>
            <div className="metric-content">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              {metric.total !== undefined && (
                <div className="metric-subtitle">su {metric.total} totali</div>
              )}
              {metric.subtitle && (
                <div className="metric-subtitle">{metric.subtitle}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminMetrics

