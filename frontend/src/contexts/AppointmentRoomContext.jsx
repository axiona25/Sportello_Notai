import React, { createContext, useContext, useState, useEffect } from 'react'

const AppointmentRoomContext = createContext()

export function AppointmentRoomProvider({ children }) {
  // ✅ Ripristina activeAppointment dal sessionStorage se disponibile
  const [activeAppointment, setActiveAppointment] = useState(() => {
    const saved = sessionStorage.getItem('appointmentRoom_activeAppointment')
    return saved ? JSON.parse(saved) : null
  })
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = sessionStorage.getItem('appointmentRoom_isMinimized')
    return saved === 'true'
  })
  const [isFloating, setIsFloating] = useState(() => {
    const saved = sessionStorage.getItem('appointmentRoom_isFloating')
    return saved === 'true'
  })

  // ✅ Salva lo stato nel sessionStorage quando cambia
  useEffect(() => {
    if (activeAppointment) {
      sessionStorage.setItem('appointmentRoom_activeAppointment', JSON.stringify(activeAppointment))
    } else {
      sessionStorage.removeItem('appointmentRoom_activeAppointment')
    }
  }, [activeAppointment])

  useEffect(() => {
    sessionStorage.setItem('appointmentRoom_isMinimized', isMinimized)
  }, [isMinimized])

  useEffect(() => {
    sessionStorage.setItem('appointmentRoom_isFloating', isFloating)
  }, [isFloating])

  const enterAppointment = (appointment) => {
    console.log('🎯 AppointmentRoomContext - enterAppointment chiamato:', appointment)
    setActiveAppointment(appointment)
    setIsMinimized(false)
    setIsFloating(false)
  }

  const exitAppointment = () => {
    console.log('🚪 AppointmentRoomContext - exitAppointment chiamato')
    setActiveAppointment(null)
    setIsMinimized(false)
    setIsFloating(false)
    // ✅ Pulisci lo storage quando si esce dall'appuntamento
    sessionStorage.removeItem('appointmentRoom_activeAppointment')
    sessionStorage.removeItem('appointmentRoom_isMinimized')
    sessionStorage.removeItem('appointmentRoom_isFloating')
  }

  const minimizeAppointment = () => {
    console.log('➖ AppointmentRoomContext - minimizeAppointment chiamato - mette in background')
    setIsMinimized(true)
  }

  const restoreAppointment = () => {
    console.log('⬆️ AppointmentRoomContext - restoreAppointment chiamato - ripristina dalla topbar')
    setIsMinimized(false)
  }

  const toggleFloating = () => {
    console.log('🔄 AppointmentRoomContext - toggleFloating chiamato - alterna floating/fullscreen')
    setIsFloating(!isFloating)
  }

  const value = {
    activeAppointment,
    isMinimized,
    isFloating,
    enterAppointment,
    exitAppointment,
    minimizeAppointment,
    restoreAppointment,
    toggleFloating
  }

  return (
    <AppointmentRoomContext.Provider value={value}>
      {children}
    </AppointmentRoomContext.Provider>
  )
}

export function useAppointmentRoom() {
  const context = useContext(AppointmentRoomContext)
  if (!context) {
    throw new Error('useAppointmentRoom must be used within AppointmentRoomProvider')
  }
  return context
}

