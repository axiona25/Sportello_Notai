import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import './NotaryMetrics.css'

function NotaryMetrics() {
  const metrics = [
    {
      id: 1,
      value: '451',
      label: 'Rogito Immobiliare',
      trend: 2.11,
      isPositive: true
    },
    {
      id: 2,
      value: '137',
      label: 'Costituzioni Societarie',
      trend: 3.52,
      isPositive: false
    },
    {
      id: 3,
      value: '151',
      label: 'Altri Atti Notarili',
      trend: 2.11,
      isPositive: true
    },
    {
      id: 4,
      value: '675',
      label: 'Totale Clienti',
      trend: 5.78,
      isPositive: true
    },
    {
      id: 5,
      value: '193',
      label: 'Totale Aziende',
      trend: 2.11,
      isPositive: true
    },
    {
      id: 6,
      value: '12',
      label: 'Staff di Studio',
      trend: 3.52,
      isPositive: false
    }
  ]

  return (
    <div className="notary-metrics">
      <div className="metrics-grid">
        {metrics.map(metric => (
          <div key={metric.id} className="metric-card">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-trend">
              {metric.isPositive ? (
                <TrendingUp size={14} className="trend-icon trend-up" />
              ) : (
                <TrendingDown size={14} className="trend-icon trend-down" />
              )}
              <span className={metric.isPositive ? 'trend-up' : 'trend-down'}>
                {metric.trend}%
              </span>
            </div>
            <div className="metric-label">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotaryMetrics

