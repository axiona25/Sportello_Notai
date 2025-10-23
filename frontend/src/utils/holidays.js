/**
 * Gestione giorni festivi italiani e di San Marino
 */

/**
 * Calcola la data della Pasqua per un dato anno (algoritmo di Gauss)
 */
const getEasterDate = (year) => {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)
  
  return new Date(year, month - 1, day)
}

/**
 * Festività fisse (giorno e mese)
 */
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: 'Capodanno' },
  { month: 0, day: 6, name: 'Epifania' },
  { month: 1, day: 5, name: 'Festa di Sant\'Agata (San Marino)' },
  { month: 2, day: 25, name: 'Anniversario dell\'Arengo (San Marino)' },
  { month: 3, day: 1, name: 'Investitura dei Capitani Reggenti (San Marino)' },
  { month: 3, day: 25, name: 'Festa della Liberazione' },
  { month: 4, day: 1, name: 'Festa dei Lavoratori' },
  { month: 5, day: 2, name: 'Festa della Repubblica Italiana' },
  { month: 6, day: 28, name: 'Caduta del Fascismo (San Marino)' },
  { month: 7, day: 15, name: 'Assunzione / Ferragosto' },
  { month: 8, day: 3, name: 'Fondazione della Repubblica di San Marino' },
  { month: 9, day: 1, name: 'Investitura dei Capitani Reggenti (San Marino)' },
  { month: 10, day: 1, name: 'Ognissanti' },
  { month: 10, day: 2, name: 'Commemorazione dei Defunti (San Marino)' },
  { month: 11, day: 8, name: 'Immacolata Concezione' },
  { month: 11, day: 24, name: 'Vigilia di Natale' },
  { month: 11, day: 25, name: 'Natale' },
  { month: 11, day: 26, name: 'Santo Stefano' },
  { month: 11, day: 31, name: 'San Silvestro' }
]

/**
 * Verifica se una data è un giorno festivo
 * @param {Date} date - La data da verificare
 * @returns {Object|null} - Oggetto con nome della festività o null
 */
export const isHoliday = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return null
  }

  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay()

  // Domenica (0)
  if (dayOfWeek === 0) {
    return { name: 'Domenica', type: 'weekend' }
  }

  // Festività fisse
  const fixedHoliday = FIXED_HOLIDAYS.find(
    h => h.month === month && h.day === day
  )
  if (fixedHoliday) {
    return { name: fixedHoliday.name, type: 'fixed' }
  }

  // Festività mobili (basate sulla Pasqua)
  const easter = getEasterDate(year)
  const easterMonth = easter.getMonth()
  const easterDay = easter.getDate()

  // Lunedì dell'Angelo (Pasquetta) - giorno dopo Pasqua
  const pasquetta = new Date(easter)
  pasquetta.setDate(pasquetta.getDate() + 1)
  if (month === pasquetta.getMonth() && day === pasquetta.getDate()) {
    return { name: 'Lunedì dell\'Angelo (Pasquetta)', type: 'mobile' }
  }

  // Pasqua
  if (month === easterMonth && day === easterDay) {
    return { name: 'Pasqua', type: 'mobile' }
  }

  // Corpus Domini (60 giorni dopo Pasqua) - solo San Marino
  const corpusDomini = new Date(easter)
  corpusDomini.setDate(corpusDomini.getDate() + 60)
  if (month === corpusDomini.getMonth() && day === corpusDomini.getDate()) {
    return { name: 'Corpus Domini (San Marino)', type: 'mobile' }
  }

  return null
}

/**
 * Verifica se una data è un sabato
 * @param {Date} date
 * @returns {boolean}
 */
export const isSaturday = (date) => {
  return date instanceof Date && date.getDay() === 6
}

/**
 * Verifica se una data è una domenica
 * @param {Date} date
 * @returns {boolean}
 */
export const isSunday = (date) => {
  return date instanceof Date && date.getDay() === 0
}

/**
 * Verifica se una data è nel weekend
 * @param {Date} date
 * @returns {boolean}
 */
export const isWeekend = (date) => {
  return isSaturday(date) || isSunday(date)
}

/**
 * Verifica se una data è selezionabile (non festivo e non weekend)
 * @param {Date} date
 * @returns {boolean}
 */
export const isSelectableDate = (date) => {
  return !isHoliday(date) && !isWeekend(date)
}

/**
 * Ottiene la lista di tutte le festività per un dato anno
 * @param {number} year
 * @returns {Array} Array di oggetti {date, name, type}
 */
export const getHolidaysForYear = (year) => {
  const holidays = []

  // Festività fisse
  FIXED_HOLIDAYS.forEach(h => {
    holidays.push({
      date: new Date(year, h.month, h.day),
      name: h.name,
      type: 'fixed'
    })
  })

  // Pasqua e festività mobili
  const easter = getEasterDate(year)
  holidays.push({
    date: easter,
    name: 'Pasqua',
    type: 'mobile'
  })

  const pasquetta = new Date(easter)
  pasquetta.setDate(pasquetta.getDate() + 1)
  holidays.push({
    date: pasquetta,
    name: 'Lunedì dell\'Angelo (Pasquetta)',
    type: 'mobile'
  })

  const corpusDomini = new Date(easter)
  corpusDomini.setDate(corpusDomini.getDate() + 60)
  holidays.push({
    date: corpusDomini,
    name: 'Corpus Domini (San Marino)',
    type: 'mobile'
  })

  return holidays.sort((a, b) => a.date - b.date)
}

