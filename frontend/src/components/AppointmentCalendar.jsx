import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import appointmentService from '../services/appointmentService'
import { isHoliday, isWeekend } from '../utils/holidays'
import { SLOT_ORARI } from '../config/tipologieAttiConfig'
import './AppointmentCalendar.css'

function AppointmentCalendar({ 
  notaryId, 
  duration = 30, 
  giorniDisponibili = null, // Array di ID giorni (1=Lun, 2=Mar, etc.) 
  slotDisponibili = null, // Array di ID slot (1=Mattina, 2=Pomeriggio, 3=Sera)
  onSlotSelect, 
  selectedSlot: externalSelectedSlot, 
  excludeAppointmentId = null,
  initialDate = null // ✅ Data iniziale dal calendario della Dashboard
}) {
  // ✅ Usa initialDate se fornita, altrimenti la data corrente
  const [currentMonth, setCurrentMonth] = useState(initialDate && initialDate instanceof Date ? initialDate : new Date())
  const [selectedDate, setSelectedDate] = useState(initialDate && initialDate instanceof Date ? initialDate : null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // ✅ Log per debugging: verifica che initialDate sia ricevuta correttamente
  useEffect(() => {
    if (initialDate instanceof Date) {
      console.log('📅 AppointmentCalendar - initialDate ricevuta:', initialDate.toLocaleDateString('it-IT'))
      console.log('📅 Mese impostato:', currentMonth.toLocaleDateString('it-IT'))
      console.log('📅 Data selezionata:', selectedDate ? selectedDate.toLocaleDateString('it-IT') : 'Nessuna')
    }
  }, [initialDate])

  // Load available slots when month or duration changes
  useEffect(() => {
    if (notaryId) {
      loadSlotsForMonth()
    } else {
      console.warn('AppointmentCalendar - No notaryId provided!')
    }
  }, [currentMonth, notaryId, duration, excludeAppointmentId])

  // ✅ Ascolta eventi di aggiornamento appuntamenti per ricaricare gli slot
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      console.log('📅 AppointmentCalendar - Ricaricamento slot dopo aggiornamento appuntamento')
      if (notaryId) {
        loadSlotsForMonth()
      }
    }

    window.addEventListener('appointment-updated', handleAppointmentUpdate)
    
    return () => {
      window.removeEventListener('appointment-updated', handleAppointmentUpdate)
    }
  }, [notaryId, currentMonth, duration, excludeAppointmentId])

  const loadSlotsForMonth = async () => {
    setLoading(true)
    
    // Get first and last day of month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    const startDate = formatDate(firstDay)
    const endDate = formatDate(lastDay)
    
    console.log('📅 Caricamento slot:', { 
      notaryId, 
      startDate, 
      endDate, 
      duration,
      excludeAppointmentId,
      timestamp: new Date().toISOString()
    })
    
    const result = await appointmentService.getAvailableSlots(
      notaryId, 
      startDate, 
      endDate, 
      duration,
      excludeAppointmentId // Passa l'ID dell'appuntamento da escludere
    )
    
    if (result.success) {
      const stats = {
        totalSlots: result.data.length,
        availableSlots: result.data.filter(s => s.is_available).length,
        occupiedSlots: result.data.filter(s => !s.is_available).length
      }
      console.log('✅ Slot caricati:', stats)
      
      // ✅ Mostra slot occupati se ce ne sono
      const occupied = result.data.filter(s => !s.is_available)
      if (occupied.length > 0) {
        console.warn('⚠️ SLOT OCCUPATI TROVATI:')
        occupied.forEach(s => {
          console.warn(`   🔴 ${s.date} | ${s.start_time}-${s.end_time} | available: ${s.is_available}`)
        })
      } else {
        console.log('✅ Nessuno slot occupato - tutti disponibili')
      }
      
      // ✅ DEBUG: Mostra TUTTI gli slot per il 23 ottobre
      const oct23Slots = result.data.filter(s => s.date === '2025-10-23')
      if (oct23Slots.length > 0) {
        console.log('🔍 TUTTI gli slot ricevuti per 2025-10-23:')
        oct23Slots.forEach(s => {
          const icon = s.is_available ? '✅' : '❌'
          console.log(`   ${icon} ${s.start_time}-${s.end_time}`)
        })
      }
      
      setAvailableSlots(result.data)
    } else {
      console.error('❌ Errore nel caricamento degli slot:', result.error)
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
    
    // Restituisci TUTTI gli slot per questa data (disponibili E occupati)
    const allSlotsForDate = availableSlots.filter(slot => slot.date === dateStr)
    
    // ✅ Log dettagliato per debugging - mostra solo quando si seleziona una data
    if (allSlotsForDate.length > 0 && date === selectedDate) {
      console.log(`📍 Slot per ${dateStr}:`)
      allSlotsForDate.forEach(s => {
        const icon = s.is_available ? '✅' : '❌'
        console.log(`   ${icon} ${s.start_time}-${s.end_time} | disponibile: ${s.is_available}`)
      })
    }
    
    return allSlotsForDate
  }

  const hasAvailableSlots = (date) => {
    const slots = getSlotsForDate(date)
    // Verifica se ci sono slot DISPONIBILI (is_available === true)
    return slots.some(slot => slot.is_available === true)
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

  // Verifica se un giorno della settimana è disponibile per il tipo di atto
  const isDayOfWeekAvailable = (date) => {
    if (!giorniDisponibili || giorniDisponibili.length === 0) {
      return true // Se non ci sono restrizioni, tutti i giorni sono disponibili
    }
    
    const dayOfWeek = date.getDay() // 0=Domenica, 1=Lunedì, ..., 6=Sabato
    return giorniDisponibili.includes(dayOfWeek)
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
    
    // Verifica se il giorno della settimana è disponibile per questo tipo di atto
    if (!isDayOfWeekAvailable(date)) {
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
    // ✅ Impedisci la selezione di slot non disponibili
    if (!slot.is_available) {
      return
    }
    
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
  
  // Funzione per verificare se uno slot appartiene a una fascia oraria disponibile
  const isSlotInAvailableTimeRange = (slot) => {
    if (!slotDisponibili || slotDisponibili.length === 0) {
      return true // Se non ci sono restrizioni, tutti gli slot sono disponibili
    }
    
    // Converti lo start_time dello slot in un oggetto confrontabile
    const [hours, minutes] = slot.start_time.split(':').map(Number)
    const slotTimeInMinutes = hours * 60 + minutes
    
    // Verifica se lo slot ricade in almeno una delle fasce disponibili
    return slotDisponibili.some(slotId => {
      const fascia = SLOT_ORARI.find(s => s.id === slotId)
      if (!fascia) return false
      
      const [startHours, startMinutes] = fascia.inizio.split(':').map(Number)
      const [endHours, endMinutes] = fascia.fine.split(':').map(Number)
      
      const fasciaStartMinutes = startHours * 60 + startMinutes
      const fasciaEndMinutes = endHours * 60 + endMinutes
      
      return slotTimeInMinutes >= fasciaStartMinutes && slotTimeInMinutes < fasciaEndMinutes
    })
  }
  
  // Ottieni gli slot per la data selezionata e filtrali per fascia oraria
  const rawSlots = selectedDate 
    ? getSlotsForDate(selectedDate).filter(isSlotInAvailableTimeRange)
    : []
  
  // ✅ Funzione per raggruppare slot occupati consecutivi
  const mergeOccupiedSlots = (slots) => {
    if (slots.length === 0) return []
    
    const mergedSlots = []
    const availableSlots = slots.filter(s => s.is_available)
    const occupiedSlots = slots.filter(s => !s.is_available).sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    )
    
    // Raggruppa slot occupati consecutivi
    let i = 0
    while (i < occupiedSlots.length) {
      const currentSlot = occupiedSlots[i]
      let endTime = currentSlot.end_time
      let totalDuration = currentSlot.duration_minutes
      
      // Cerca slot consecutivi
      let j = i + 1
      while (j < occupiedSlots.length && occupiedSlots[j].start_time === endTime) {
        endTime = occupiedSlots[j].end_time
        totalDuration += occupiedSlots[j].duration_minutes
        j++
      }
      
      // Crea uno slot merged
      mergedSlots.push({
        ...currentSlot,
        end_time: endTime,
        duration_minutes: totalDuration,
        is_merged: j > i + 1 // Flag per sapere se è stato merged
      })
      
      i = j
    }
    
    // Combina disponibili e occupati merged, ordina per orario
    return [...availableSlots, ...mergedSlots].sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    )
  }
  
  const slots = mergeOccupiedSlots(rawSlots)

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
              const isDayAvailable = date && isDayOfWeekAvailable(date)
              const isDisabled = holiday || weekend || !isDayAvailable
              
              // Mostra puntino BLU solo se ci sono APPUNTAMENTI (slot occupati) in quel giorno
              const showDot = date && hasAppointments(date) && !isDisabled

              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasSlots && !isDisabled ? 'available' : 'unavailable'} ${isDisabled ? 'holiday' : ''}`}
                  onClick={() => handleDateClick(date)}
                  title={holiday ? holiday.name : (weekend ? 'Weekend' : (!isDayAvailable ? 'Non disponibile per questo tipo di atto' : ''))}
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
                <span>Orari - {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</span>
              </div>

              {slots.length === 0 ? (
                <div className="no-slots">
                  <p>Nessuno slot per questa data</p>
                </div>
              ) : (
                <div className="time-slots-grid">
                  {slots.map((slot, index) => {
                    const isOccupied = !slot.is_available
                    return (
                      <button
                        key={index}
                        className={`time-slot ${selectedSlot === slot ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`}
                        onClick={() => handleSlotClick(slot)}
                        disabled={isOccupied}
                        title={isOccupied ? 'Slot già occupato' : 'Clicca per selezionare'}
                      >
                        <span className="time-slot-time">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                        <span className="time-slot-duration">{slot.duration_minutes} min</span>
                        {isOccupied && <span className="slot-occupied-badge">Occupato</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot available"></div>
          <span>Giorni disponibili</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot unavailable"></div>
          <span>Giorni non disponibili</span>
        </div>
        <div className="legend-item">
          <div className="legend-slot occupied"></div>
          <span>Slot occupati</span>
        </div>
      </div>
    </div>
  )
}

export default AppointmentCalendar

