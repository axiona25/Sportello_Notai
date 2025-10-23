import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import './Calendar.css'

function Calendar({ selectedDate, onSelectDate, onAppointmentsUpdate }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [appointmentsByDay, setAppointmentsByDay] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentSelectedDay, setCurrentSelectedDay] = useState(selectedDate)

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const loadAppointmentsForMonth = useCallback(async (showLoader = true) => {
    // Mostra loader solo al primo caricamento, non durante i refresh automatici
    if (showLoader) {
      setLoading(true)
    }
    try {
      const appuntamenti = await appointmentExtendedService.getAppuntamentiMese(currentYear, currentMonth + 1)
      
      // Organizza appuntamenti per giorno
      const byDay = {}
      appuntamenti.forEach(app => {
        // IMPORTANTE: Estrai solo la data senza conversioni timezone
        // app.start_time è in formato ISO (es. "2025-10-23T09:00:00Z")
        // Estraiamo solo la parte della data locale dell'appuntamento
        const date = new Date(app.start_time)
        // Usa le componenti locali della data per evitare problemi di timezone
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()
        
        // Verifica che appartiene al mese corrente
        if (year === currentYear && month === currentMonth) {
          if (!byDay[day]) {
            byDay[day] = { provvisorio: 0, confermato: 0, appointments: [] }
          }
          byDay[day].appointments.push(app)
          if (app.status === 'provvisorio') {
            byDay[day].provvisorio++
          } else if (app.status === 'confermato' || app.status === 'documenti_in_caricamento' || app.status === 'documenti_verificati') {
            byDay[day].confermato++
          }
        }
      })
      
      setAppointmentsByDay(byDay)
      
      // Aggiorna le mini-cards del giorno selezionato (se c'è)
      if (onAppointmentsUpdate && currentSelectedDay) {
        if (byDay[currentSelectedDay]) {
          onAppointmentsUpdate(byDay[currentSelectedDay].appointments)
        } else {
          onAppointmentsUpdate([])
        }
      }
      
      // Aggiorna solo se ci sono cambiamenti (evita re-render inutili)
      setAppointmentsByDay(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(byDay)
        return hasChanged ? byDay : prev
      })
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error)
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [currentYear, currentMonth, currentSelectedDay, onAppointmentsUpdate])

  // Caricamento iniziale (con loader)
  useEffect(() => {
    loadAppointmentsForMonth(true)
  }, [currentMonth, currentYear, loadAppointmentsForMonth])

  // Funzione di refresh silenziosa per il polling (senza loader)
  const silentRefresh = useCallback(() => {
    loadAppointmentsForMonth(false)
  }, [loadAppointmentsForMonth])

  // Auto-refresh intelligente ogni 30 secondi (silenzioso, senza loader)
  // Si ferma automaticamente quando il tab non è visibile
  useAutoRefresh(silentRefresh, 30000, true)

  // Ascolta eventi di aggiornamento appuntamenti
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      loadAppointmentsForMonth(true)
    }
    window.addEventListener('appointment-updated', handleAppointmentUpdate)
    return () => window.removeEventListener('appointment-updated', handleAppointmentUpdate)
  }, [loadAppointmentsForMonth])

  const getIndicatorType = (day) => {
    const dayData = appointmentsByDay[day]
    if (!dayData) return null
    
    if (dayData.provvisorio > 0 && dayData.confermato > 0) {
      return 'mixed' // Gradient giallo + celeste
    } else if (dayData.provvisorio > 0) {
      return 'provisional' // Giallo
    } else if (dayData.confermato > 0) {
      return 'confirmed' // Celeste
    }
    return null
  }

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const daysInPrevMonth = getDaysInMonth(currentMonth - 1, currentYear)
    
    const days = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true
      })
    }

    // Next month days to fill the grid (5 settimane = 35 giorni invece di 42)
    const remainingDays = 35 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false
      })
    }

    return days.slice(0, 35) // Limita a 35 giorni (5 settimane)
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDayClick = (day) => {
    setCurrentSelectedDay(day)
    onSelectDate(day)
    
    // Notifica il componente padre degli appuntamenti del giorno selezionato
    if (onAppointmentsUpdate && appointmentsByDay[day]) {
      onAppointmentsUpdate(appointmentsByDay[day].appointments)
    } else if (onAppointmentsUpdate) {
      onAppointmentsUpdate([])
    }
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">
          <ChevronLeft size={20} />
        </button>
        <h3 className="calendar-month">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button onClick={handleNextMonth} className="calendar-nav-btn">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-body">
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((dayObj, index) => {
            const indicatorType = dayObj.isCurrentMonth ? getIndicatorType(dayObj.day) : null
            return (
              <button
                key={index}
                className={`calendar-day ${
                  dayObj.isCurrentMonth ? 'current-month' : 'other-month'
                } ${dayObj.day === selectedDate && dayObj.isCurrentMonth ? 'selected' : ''} ${
                  indicatorType ? 'has-appointment' : ''
                }`}
                onClick={() => dayObj.isCurrentMonth && handleDayClick(dayObj.day)}
              >
                {dayObj.day}
                {indicatorType && (
                  <span className={`appointment-indicator ${indicatorType}`}></span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar

