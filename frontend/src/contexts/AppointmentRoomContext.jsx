import React, { createContext, useContext, useState } from 'react'

const AppointmentRoomContext = createContext()

export function AppointmentRoomProvider({ children }) {
  const [activeAppointment, setActiveAppointment] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false) // true = nascosta in background, false = visibile
  const [isFloating, setIsFloating] = useState(false) // true = finestra ridotta, false = fullscreen

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

