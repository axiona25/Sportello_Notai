import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import appointmentService from '../services/appointmentService'
import './AppointmentCalendar.css'

function AppointmentCalendar({ notaryId, duration = 30, onSlotSelect, selectedSlot: externalSelectedSlot }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  console.log('📅 Calendario caricato con durata:', duration, 'minuti')

  // Load available slots when month or duration changes
  useEffect(() => {
    if (notaryId) {
      loadSlotsForMonth()
    }
  }, [currentMonth, notaryId, duration])

  const loadSlotsForMonth = async () => {
    setLoading(true)
    
    // Get first and last day of month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    const startDate = formatDate(firstDay)
    const endDate = formatDate(lastDay)
    
    console.log(`🔍 Carico slot per ${startDate} -> ${endDate} con durata ${duration} minuti`)
    
    const result = await appointmentService.getAvailableSlots(notaryId, startDate, endDate, duration)
    
    if (result.success) {
      console.log(`✅ Trovati ${result.data.length} slot disponibili`)
      setAvailableSlots(result.data)
    } else {
      console.log('❌ Errore caricamento slot')
    }
    
    setLoading(false)
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
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
    return availableSlots.filter(slot => slot.date === dateStr && slot.is_available)
  }

  const hasAvailableSlots = (date) => {
    return getSlotsForDate(date).length > 0
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
    if (date && hasAvailableSlots(date)) {
      setSelectedDate(date)
      setSelectedSlot(null)
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

              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasSlots ? 'available' : 'unavailable'}`}
                  onClick={() => handleDateClick(date)}
                >
                  {date && (
                    <>
                      <span className="day-number">{date.getDate()}</span>
                      {hasSlots && <div className="availability-dot"></div>}
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

