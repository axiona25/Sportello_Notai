import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import appointmentService from '../services/appointmentService'
import { isHoliday, isWeekend } from '../utils/holidays'
import './AppointmentCalendar.css'

function AppointmentCalendar({ notaryId, duration = 30, onSlotSelect, selectedSlot: externalSelectedSlot, excludeAppointmentId = null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Load available slots when month or duration changes
  useEffect(() => {
    if (notaryId) {
      loadSlotsForMonth()
    } else {
      console.warn('AppointmentCalendar - No notaryId provided!')
    }
  }, [currentMonth, notaryId, duration, excludeAppointmentId])

  const loadSlotsForMonth = async () => {
    setLoading(true)
    
    // Get first and last day of month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    const startDate = formatDate(firstDay)
    const endDate = formatDate(lastDay)
    
    const result = await appointmentService.getAvailableSlots(
      notaryId, 
      startDate, 
      endDate, 
      duration,
      excludeAppointmentId // Passa l'ID dell'appuntamento da escludere
    )
    
    if (result.success) {
      setAvailableSlots(result.data)
    } else {
      console.error('Errore nel caricamento degli slot:', result.error)
    }
    
    setLoading(false)
  }

  const formatDate = (date) => {
    // IMPORTANTE: Non usare toISOString() perché converte in UTC e può cambiare il giorno!
    // Usa year/month/day locali per mantenere la data esatta selezionata
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getSlotsForDate = (date) => {
    if (!date) return []
    const dateStr = formatDate(date)
    
    // Filtra slot per questa data E che siano disponibili
    const allSlotsForDate = availableSlots.filter(slot => slot.date === dateStr)
    const availableSlotsForDate = allSlotsForDate.filter(slot => slot.is_available === true)
    
    return availableSlotsForDate
  }

  const hasAvailableSlots = (date) => {
    const slots = getSlotsForDate(date)
    return slots.length > 0
  }

  // Nuova funzione per verificare se un giorno ha appuntamenti (slot occupati)
  const hasAppointments = (date) => {
    if (!date) return false
    const dateStr = formatDate(date)
    
    // Conta quanti slot NON sono disponibili (cioè hanno appuntamenti)
    const occupiedSlots = availableSlots.filter(slot => 
      slot.date === dateStr && slot.is_available === false
    )
    
    return occupiedSlots.length > 0
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleDateClick = (date) => {
    if (!date) return
    
    // Verifica se è un giorno festivo o weekend
    const holiday = isHoliday(date)
    const weekend = isWeekend(date)
    
    if (holiday || weekend) {
      // Non permettere la selezione di festivi o weekend
      return
    }
    
    const hasSlots = hasAvailableSlots(date)
    
    if (hasSlots) {
      // Se il giorno cliccato è già selezionato, deselezionalo
      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        setSelectedDate(null)
        setSelectedSlot(null)
      } else {
        // Altrimenti selezionalo
        setSelectedDate(date)
        setSelectedSlot(null)
      }
    }
  }

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot)
    if (onSlotSelect) {
      onSlotSelect(slot)
    }
  }

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5) // HH:MM
  }

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  const days = getDaysInMonth()
  const slots = selectedDate ? getSlotsForDate(selectedDate) : []

  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <button className="btn-nav" onClick={handlePreviousMonth}>
          <ChevronLeft size={20} />
        </button>
        <div className="calendar-title">
          <CalendarIcon size={20} />
          <span>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        </div>
        <button className="btn-nav" onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="calendar-loading">
          <div className="spinner"></div>
          <p>Caricamento disponibilità...</p>
        </div>
      ) : (
        <div className="calendar-content">
          <div className="calendar-grid">
            {/* Day names header */}
            {dayNames.map(day => (
              <div key={day} className="calendar-day-name">{day}</div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              const isToday = date && date.toDateString() === new Date().toDateString()
              const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString()
              const hasSlots = date && hasAvailableSlots(date)
              const holiday = date && isHoliday(date)
              const weekend = date && isWeekend(date)
              const isDisabled = holiday || weekend
              
              // Mostra puntino BLU solo se ci sono APPUNTAMENTI (slot occupati) in quel giorno
              const showDot = date && hasAppointments(date) && !isDisabled

              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasSlots && !isDisabled ? 'available' : 'unavailable'} ${isDisabled ? 'holiday' : ''}`}
                  onClick={() => handleDateClick(date)}
                  title={holiday ? holiday.name : (weekend ? 'Weekend' : '')}
                >
                  {date && (
                    <>
                      <span className="day-number">{date.getDate()}</span>
                      {showDot && <div className="availability-dot"></div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time slots for selected date */}
          {selectedDate && (
            <div className="time-slots-panel">
              <div className="time-slots-header">
                <Clock size={18} />
                <span>Orari disponibili - {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</span>
              </div>

              {slots.length === 0 ? (
                <div className="no-slots">
                  <p>Nessuno slot disponibile per questa data</p>
                </div>
              ) : (
                <div className="time-slots-grid">
                  {slots.map((slot, index) => (
                    <button
                      key={index}
                      className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <span className="time-slot-time">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                      <span className="time-slot-duration">{slot.duration_minutes} min</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot available"></div>
          <span>Disponibile</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot unavailable"></div>
          <span>Non disponibile</span>
        </div>
      </div>
    </div>
  )
}

export default AppointmentCalendar

