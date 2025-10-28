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
  
  // ✅ Converti selectedDate se è un Date object, altrimenti usa il valore così com'è
  const selectedDay = selectedDate instanceof Date ? selectedDate.getDate() : selectedDate
  const [currentSelectedDay, setCurrentSelectedDay] = useState(selectedDay)
  
  // ✅ Sincronizza currentSelectedDay quando cambia selectedDay
  useEffect(() => {
    if (selectedDay !== currentSelectedDay) {
      console.log('📅 Calendar - Aggiornamento selectedDay:', selectedDay)
      setCurrentSelectedDay(selectedDay)
    }
  }, [selectedDay, currentSelectedDay])

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
      console.log('📅 Calendar - Caricamento appuntamenti per mese:', currentYear, currentMonth + 1)
      const appuntamenti = await appointmentExtendedService.getAppuntamentiMese(currentYear, currentMonth + 1)
      console.log('📅 Calendar - Appuntamenti ricevuti dal backend:', appuntamenti.length, appuntamenti)
      
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
          
          // ✅ Normalizza lo status a lowercase per confronto case-insensitive
          const statusLower = (app.status || app.stato || '').toLowerCase()
          
          console.log(`📅 Giorno ${day}: Appuntamento con status="${app.status}" stato="${app.stato}" → statusLower="${statusLower}"`)
          
          // ✅ GIALLO: Provvisorio o Documenti in caricamento (non ancora caricati)
          if (
            statusLower === 'provvisorio' || 
            statusLower === 'documenti_in_caricamento' ||
            statusLower === 'documenti_parziali'  // ✅ Documenti rifiutati/parziali = giallo
          ) {
            byDay[day].provvisorio++
            console.log(`  🟡 Incrementato provvisorio (giallo) per giorno ${day} → ${byDay[day].provvisorio}`)
          } 
          // ✅ BLU: Confermato con documenti verificati o atto pronto
          else if (
            statusLower === 'confermato' || 
            statusLower === 'documenti_in_verifica' ||
            statusLower === 'documenti_verificati' ||
            statusLower === 'pronto_atto_virtuale' ||
            statusLower === 'in_corso' ||
            statusLower === 'completato'
          ) {
            byDay[day].confermato++
            console.log(`  🔵 Incrementato confermato (blu) per giorno ${day} → ${byDay[day].confermato}`)
          } else {
            console.log(`  ⚠️ Status "${statusLower}" non riconosciuto per giorno ${day}`)
          }
        }
      })
      
      console.log('📅 Appuntamenti organizzati per giorno:', byDay)
      
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

  // ✅ Ascolta eventi di selezione appuntamento da notifica (Cliente)
  useEffect(() => {
    const handleSelectAppointmentFromCalendar = (event) => {
      const { appointmentId, openDetail } = event.detail
      console.log('📅 Calendar - Ricevuto evento select-appointment-from-calendar:', { appointmentId, openDetail })
      
      // Cerca l'appuntamento in tutti i giorni del mese
      for (const [day, dayData] of Object.entries(appointmentsByDay)) {
        const appointment = dayData.appointments.find(app => app.id === appointmentId)
        if (appointment) {
          console.log('✅ Appuntamento trovato nel giorno:', day, appointment)
          
          // Seleziona il giorno (replica logica di handleDayClick)
          const dayNum = parseInt(day)
          setCurrentSelectedDay(dayNum)
          
          // ✅ Crea un oggetto Date completo per il giorno selezionato
          const selectedDateObj = new Date(currentYear, currentMonth, dayNum)
          console.log('📅 Calendar - Selezione da notifica:', dayNum, '→ Date object:', selectedDateObj)
          onSelectDate(selectedDateObj)
          
          // Notifica il componente padre degli appuntamenti del giorno selezionato
          if (onAppointmentsUpdate) {
            onAppointmentsUpdate(dayData.appointments)
          }
          
          return
        }
      }
      
      console.warn('⚠️ Appuntamento non trovato nel calendario:', appointmentId)
    }
    
    window.addEventListener('select-appointment-from-calendar', handleSelectAppointmentFromCalendar)
    return () => window.removeEventListener('select-appointment-from-calendar', handleSelectAppointmentFromCalendar)
  }, [appointmentsByDay, onSelectDate, onAppointmentsUpdate, currentYear, currentMonth])

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

  const handleDayClick = useCallback((day) => {
    setCurrentSelectedDay(day)
    
    // ✅ Crea un oggetto Date completo per il giorno selezionato
    const selectedDateObj = new Date(currentYear, currentMonth, day)
    console.log('📅 Calendar - Giorno cliccato:', day, '→ Date object:', selectedDateObj)
    onSelectDate(selectedDateObj)
    
    // Notifica il componente padre degli appuntamenti del giorno selezionato
    if (onAppointmentsUpdate && appointmentsByDay[day]) {
      onAppointmentsUpdate(appointmentsByDay[day].appointments)
    } else if (onAppointmentsUpdate) {
      onAppointmentsUpdate([])
    }
  }, [appointmentsByDay, onSelectDate, onAppointmentsUpdate, currentYear, currentMonth])

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
                } ${dayObj.day === selectedDay && dayObj.isCurrentMonth ? 'selected' : ''} ${
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

