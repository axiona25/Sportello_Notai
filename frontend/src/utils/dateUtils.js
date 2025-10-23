/**
 * Utility per gestione date senza problemi di timezone
 */

/**
 * Converte una stringa di data YYYY-MM-DD in un oggetto Date locale
 * SENZA problemi di timezone (non interpreta come UTC)
 * 
 * @param {string|Date} dateInput - Data in formato YYYY-MM-DD o oggetto Date
 * @returns {Date} Oggetto Date locale
 */
export function parseDateLocal(dateInput) {
  if (!dateInput) return null
  
  // Se è già un oggetto Date, ritorna una copia
  if (dateInput instanceof Date) {
    return new Date(dateInput.getTime())
  }
  
  // Se è una stringa nel formato YYYY-MM-DD
  if (typeof dateInput === 'string') {
    // Rimuovi eventuali informazioni di timezone se presenti
    const dateStr = dateInput.split('T')[0]
    
    // Parse manuale per evitare problemi di timezone
    const [year, month, day] = dateStr.split('-').map(Number)
    
    // Crea una data locale (mese è 0-based in JavaScript)
    return new Date(year, month - 1, day)
  }
  
  return null
}

/**
 * Converte un oggetto Date in stringa YYYY-MM-DD
 * SENZA problemi di timezone
 * 
 * @param {Date} date - Oggetto Date
 * @returns {string} Data in formato YYYY-MM-DD
 */
export function formatDateToISO(date) {
  if (!date || !(date instanceof Date)) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Formatta una data per visualizzazione in italiano
 * 
 * @param {string|Date} dateInput - Data in formato YYYY-MM-DD o oggetto Date
 * @param {Object} options - Opzioni di formattazione (opzionale)
 * @returns {string} Data formattata in italiano
 */
export function formatDateItalian(dateInput, options = {}) {
  if (!dateInput) return ''
  
  // Parse la data correttamente senza problemi timezone
  const date = parseDateLocal(dateInput)
  
  if (!date || isNaN(date.getTime())) return ''
  
  const defaultOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }
  
  return date.toLocaleDateString('it-IT', defaultOptions)
}

/**
 * Formatta una data in formato breve (gg/mm/aaaa)
 * 
 * @param {string|Date} dateInput - Data in formato YYYY-MM-DD o oggetto Date
 * @returns {string} Data in formato gg/mm/aaaa
 */
export function formatDateShort(dateInput) {
  if (!dateInput) return ''
  
  const date = parseDateLocal(dateInput)
  
  if (!date || isNaN(date.getTime())) return ''
  
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Converte una stringa datetime ISO in oggetto Date locale
 * Gestisce correttamente le stringhe datetime dal backend
 * 
 * @param {string} datetimeStr - DateTime in formato ISO (es. "2025-10-23T14:30:00Z")
 * @returns {Date} Oggetto Date
 */
export function parseDateTimeLocal(datetimeStr) {
  if (!datetimeStr) return null
  
  // Se è già un oggetto Date, ritorna una copia
  if (datetimeStr instanceof Date) {
    return new Date(datetimeStr.getTime())
  }
  
  // Per datetime completi, usa il parsing normale di Date
  // (questo gestisce correttamente timezone per orari)
  return new Date(datetimeStr)
}

/**
 * Formatta un'ora da stringa o Date
 * 
 * @param {string|Date} timeInput - Orario in formato HH:MM:SS o oggetto Date
 * @returns {string} Orario in formato HH:MM
 */
export function formatTime(timeInput) {
  if (!timeInput) return ''
  
  // Se è una stringa, prendi solo HH:MM
  if (typeof timeInput === 'string') {
    return timeInput.substring(0, 5)
  }
  
  // Se è un Date, formatta l'orario
  if (timeInput instanceof Date) {
    return timeInput.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return ''
}

/**
 * Verifica se due date (solo giorno) sono uguali
 * 
 * @param {Date|string} date1 
 * @param {Date|string} date2 
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  
  const d1 = parseDateLocal(date1)
  const d2 = parseDateLocal(date2)
  
  if (!d1 || !d2) return false
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Verifica se una data è oggi
 * 
 * @param {Date|string} date 
 * @returns {boolean}
 */
export function isToday(date) {
  return isSameDay(date, new Date())
}

