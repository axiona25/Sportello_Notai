import React from 'react'
import { Video } from 'lucide-react'
import { useAppointmentRoom } from '../contexts/AppointmentRoomContext'
import './AppointmentIndicator.css'

function AppointmentIndicator() {
  const { activeAppointment, isMinimized, restoreAppointment } = useAppointmentRoom()

  // Mostra l'indicatore solo se c'è un appuntamento attivo E è minimizzato
  if (!activeAppointment || !isMinimized) {
    return null
  }

  return (
    <button 
      className="appointment-indicator"
      onClick={restoreAppointment}
      title="Torna all'appuntamento"
    >
      <Video size={20} className="appointment-indicator-icon" />
      <span className="appointment-indicator-pulse"></span>
    </button>
  )
}

export default AppointmentIndicator

