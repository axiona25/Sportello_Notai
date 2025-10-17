import React from 'react'
import { Clock, User, FileText, Phone, Video, Calendar as CalendarIcon } from 'lucide-react'
import './AppointmentCard.css'

function AppointmentCard({ type, title, description, location, time, deadline, isActive }) {
  if (type === 'empty') {
    return (
      <div className="appointment-card empty">
        <CalendarIcon size={48} className="empty-icon" />
        <p className="empty-text">Nessun altro Appuntamento</p>
      </div>
    )
  }

  return (
    <div className={`appointment-card ${isActive ? 'active' : ''}`}>
      <h3 className="appointment-title">{title}</h3>
      
      {description && (
        <p className="appointment-description">{description}</p>
      )}
      
      {location && (
        <p className="appointment-location">{location}</p>
      )}

      <div className="appointment-footer">
        <div className="appointment-icons">
          <User size={16} className="icon-gray" />
          <FileText size={16} className="icon-gray" />
          {type === 'appointment' && (
            <>
              <Phone size={16} className="icon-gray" />
              <Video size={16} className="icon-gray" />
            </>
          )}
        </div>

        {time && (
          <div className="appointment-time">
            <Clock size={16} />
            <span>{time}</span>
          </div>
        )}
        {deadline && (
          <div className="appointment-deadline">
            <Clock size={16} />
            <span>Scadenza {deadline}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard

