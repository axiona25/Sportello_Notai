import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Calendar.css'

function Calendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(9) // October (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Giorni con appuntamenti (per il mese corrente)
  const daysWithAppointments = [2, 6, 16, 22]

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

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false
      })
    }

    return days
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
            const hasAppointment = dayObj.isCurrentMonth && daysWithAppointments.includes(dayObj.day)
            return (
              <button
                key={index}
                className={`calendar-day ${
                  dayObj.isCurrentMonth ? 'current-month' : 'other-month'
                } ${dayObj.day === selectedDate && dayObj.isCurrentMonth ? 'selected' : ''} ${
                  hasAppointment ? 'has-appointment' : ''
                }`}
                onClick={() => dayObj.isCurrentMonth && onSelectDate(dayObj.day)}
              >
                {dayObj.day}
                {hasAppointment && <span className="appointment-indicator"></span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar

