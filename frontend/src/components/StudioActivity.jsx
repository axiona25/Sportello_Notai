import React from 'react'
import { Check, X, MoreVertical } from 'lucide-react'
import './StudioActivity.css'

function StudioActivity() {
  const activities = [
    {
      id: 1,
      date: 'Mercoledi 08 Ottobre 22:54',
      user: {
        name: 'Armando Carli',
        avatar: '/assets/avatar-1.png'
      },
      action: 'Documento Revisionato',
      subject: 'Rogito Sig.ra Elena Russo',
      status: 'approved'
    },
    {
      id: 2,
      date: 'Mercoledi 08 Ottobre 22:54',
      user: {
        name: 'Sandro Pertini',
        avatar: '/assets/avatar-2.png'
      },
      action: 'Documento Revisionato',
      subject: 'Rogito Sig.ra Elena Russo',
      status: 'approved'
    },
    {
      id: 3,
      date: 'Mercoledi 08 Ottobre 22:54',
      user: {
        name: 'Carla Dolfi',
        avatar: '/assets/avatar-3.png'
      },
      action: 'Documento Revisionato',
      subject: 'Rogito Sig.ra Elena Russo',
      status: 'approved'
    },
    {
      id: 4,
      date: 'Mercoledi 08 Ottobre 22:54',
      user: {
        name: 'Amira Keys',
        avatar: '/assets/avatar-4.png'
      },
      action: 'Documento Revisionato',
      subject: 'Rogito Sig.ra Elena Russo',
      status: 'rejected'
    },
    {
      id: 5,
      date: 'Mercoledi 08 Ottobre 22:54',
      user: {
        name: 'Gaetano Ronzino',
        avatar: '/assets/avatar-5.png'
      },
      action: 'Documento Revisionato',
      subject: 'Rogito Sig.ra Elena Russo',
      status: 'approved'
    }
  ]

  return (
    <div className="studio-activity">
      <div className="activity-header">
        <h3 className="activity-title">Attività di Studio</h3>
        <button className="activity-menu-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-time">{activity.date}</div>
            
            <div className="activity-content">
              <div className="activity-user">
                <div className="activity-avatar">
                  {activity.user.name.charAt(0)}
                </div>
                <div className="activity-user-info">
                  <div className="activity-user-name">{activity.user.name}</div>
                  <div className="activity-description">
                    {activity.action} - {activity.subject}
                  </div>
                </div>
              </div>

              <div className="activity-actions">
                <button 
                  className={`activity-status-btn ${activity.status === 'approved' ? 'status-approved' : 'status-rejected'}`}
                >
                  {activity.status === 'approved' ? (
                    <Check size={16} />
                  ) : (
                    <X size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudioActivity

