import { 
  FileText, 
  Home, 
  Building2, 
  Gift, 
  Briefcase, 
  FileSignature, 
  Scale, 
  Users, 
  Calendar, 
  CheckCircle,
  MessageSquare,
  Search,
  PenTool,
  Shield,
  BookOpen,
  Landmark,
  Coins,
  HandshakeIcon,
  Award,
  BookMarked,
  ClipboardCheck,
  Stamp,
  Gavel,
  ScrollText
} from 'lucide-react'

// Mappa nome icona → Componente React
export const ICON_MAP = {
  FileText,
  Home,
  Building2,
  Gift,
  Briefcase,
  FileSignature,
  Scale,
  Users,
  Calendar,
  CheckCircle,
  MessageSquare,
  Search,
  PenTool,
  Shield,
  BookOpen,
  Landmark,
  Coins,
  HandshakeIcon,
  Award,
  BookMarked,
  ClipboardCheck,
  Stamp,
  Gavel,
  ScrollText
}

// Lista icone disponibili con label descrittiva
export const AVAILABLE_ICONS = [
  { name: 'Home', icon: Home, label: 'Casa' },
  { name: 'Building2', icon: Building2, label: 'Edificio' },
  { name: 'Landmark', icon: Landmark, label: 'Banca' },
  { name: 'FileSignature', icon: FileSignature, label: 'Firma' },
  { name: 'PenTool', icon: PenTool, label: 'Penna' },
  { name: 'FileText', icon: FileText, label: 'Documento' },
  { name: 'ScrollText', icon: ScrollText, label: 'Pergamena' },
  { name: 'BookOpen', icon: BookOpen, label: 'Libro' },
  { name: 'BookMarked', icon: BookMarked, label: 'Libro segnato' },
  { name: 'Scale', icon: Scale, label: 'Bilancia' },
  { name: 'Gavel', icon: Gavel, label: 'Martelletto' },
  { name: 'Users', icon: Users, label: 'Persone' },
  { name: 'HandshakeIcon', icon: HandshakeIcon, label: 'Stretta di mano' },
  { name: 'Gift', icon: Gift, label: 'Regalo' },
  { name: 'Briefcase', icon: Briefcase, label: 'Valigetta' },
  { name: 'Coins', icon: Coins, label: 'Monete' },
  { name: 'Shield', icon: Shield, label: 'Scudo' },
  { name: 'CheckCircle', icon: CheckCircle, label: 'Spunta' },
  { name: 'ClipboardCheck', icon: ClipboardCheck, label: 'Approvazione' },
  { name: 'Stamp', icon: Stamp, label: 'Timbro' },
  { name: 'Award', icon: Award, label: 'Premio' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Messaggio' },
  { name: 'Search', icon: Search, label: 'Ricerca' },
  { name: 'Calendar', icon: Calendar, label: 'Calendario' }
]

/**
 * Configurazione centralizzata delle Tipologie Atti
 * Questa configurazione alimenta:
 * - Il wizard di prenotazione appuntamento
 * - La gestione in Impostazioni > Tipologia Atti
 * - I template documenti per l'atto digitale
 */

// Durate predefinite (in minuti)
export const DURATE_PREDEFINITE = {
  BREVE: 30,
  STANDARD: 60,
  LUNGA: 90,
  MOLTO_LUNGA: 120
}

// Giorni della settimana
export const GIORNI_SETTIMANA = [
  { id: 1, nome: 'Lunedì', abbreviazione: 'Lun' },
  { id: 2, nome: 'Martedì', abbreviazione: 'Mar' },
  { id: 3, nome: 'Mercoledì', abbreviazione: 'Mer' },
  { id: 4, nome: 'Giovedì', abbreviazione: 'Gio' },
  { id: 5, nome: 'Venerdì', abbreviazione: 'Ven' },
  { id: 6, nome: 'Sabato', abbreviazione: 'Sab' },
  { id: 0, nome: 'Domenica', abbreviazione: 'Dom' }
]

// Slot orari disponibili
export const SLOT_ORARI = [
  { id: 1, label: 'Mattina (09:00-13:00)', inizio: '09:00', fine: '13:00' },
  { id: 2, label: 'Pomeriggio (14:00-18:00)', inizio: '14:00', fine: '18:00' },
  { id: 3, label: 'Sera (18:00-20:00)', inizio: '18:00', fine: '20:00' }
]

// Tipologie atti di default (sincronizzate con wizard AppointmentBooking)
export const TIPOLOGIE_ATTI_DEFAULT = [
  {
    id: 'rogito',
    code: 'ROGITO_NOTARILE',
    nome: 'Rogito Notarile',
    descrizione: 'Atto pubblico compravendita',
    icon: Home, // 🏠 Casa per immobiliare
    iconName: 'Home', // Nome per il salvataggio
    durata_minuti: 90,
    giorni_disponibili: [1, 2, 3, 4, 5], // Lun-Ven
    slot_disponibili: [1, 2, 3], // Tutti gli slot
    template_documento: null,
    attivo: true,
    ordine: 1
  },
  {
    id: 'consulenza',
    code: 'CONSULENZA_LEGALE',
    nome: 'Consulenza Legale',
    descrizione: 'Supporto e consulenza',
    icon: MessageSquare, // 💬 Conversazione
    iconName: 'MessageSquare',
    durata_minuti: 45,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2, 3],
    template_documento: null,
    attivo: true,
    ordine: 2
  },
  {
    id: 'revisione',
    code: 'REVISIONE_DOCUMENTI',
    nome: 'Revisione Documenti',
    descrizione: 'Verifica documentale',
    icon: Search, // 🔍 Lente di ingrandimento per revisione
    iconName: 'Search',
    durata_minuti: 30,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2, 3],
    template_documento: null,
    attivo: true,
    ordine: 3
  },
  {
    id: 'firma',
    code: 'FIRMA_DIGITALE',
    nome: 'Firma Digitale',
    descrizione: 'Apposizione firma',
    icon: PenTool, // ✒️ Penna per firma
    iconName: 'PenTool',
    durata_minuti: 20,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2],
    template_documento: null,
    attivo: true,
    ordine: 4
  },
  {
    id: 'procura',
    code: 'PROCURA',
    nome: 'Procura',
    descrizione: 'Atto di procura',
    icon: Scale, // ⚖️ Bilancia della giustizia
    iconName: 'Scale',
    durata_minuti: 30,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2, 3],
    template_documento: null,
    attivo: true,
    ordine: 5
  },
  {
    id: 'testamento',
    code: 'TESTAMENTO',
    nome: 'Testamento',
    descrizione: 'Redazione testamento',
    icon: FileSignature, // 📝 Documento con firma
    iconName: 'FileSignature',
    durata_minuti: 60,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2],
    template_documento: null,
    attivo: true,
    ordine: 6
  },
  {
    id: 'donazione',
    code: 'DONAZIONE',
    nome: 'Donazione',
    descrizione: 'Atto di donazione',
    icon: Gift, // 🎁 Regalo per donazione
    iconName: 'Gift',
    durata_minuti: 60,
    giorni_disponibili: [2, 4], // Solo Martedì e Giovedì
    slot_disponibili: [1], // Solo mattina
    template_documento: null,
    attivo: true,
    ordine: 7
  },
  {
    id: 'mutuo',
    code: 'MUTUO',
    nome: 'Mutuo',
    descrizione: 'Stipula contratto mutuo',
    icon: Briefcase, // 💼 Valigetta per finanziamento
    iconName: 'Briefcase',
    durata_minuti: 45,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2],
    template_documento: null,
    attivo: true,
    ordine: 8
  },
  {
    id: 'costituzione',
    code: 'COSTITUZIONE_SOCIETA',
    nome: 'Costituzione Società',
    descrizione: 'Costituzione società',
    icon: Building2, // 🏢 Edificio aziendale
    iconName: 'Building2',
    durata_minuti: 90,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2],
    template_documento: null,
    attivo: true,
    ordine: 9
  },
  {
    id: 'certificazione',
    code: 'CERTIFICAZIONE',
    nome: 'Certificazione',
    descrizione: 'Certificati e autentiche',
    icon: Shield, // 🛡️ Scudo per certificazione/autenticità
    iconName: 'Shield',
    durata_minuti: 20,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2, 3],
    template_documento: null,
    attivo: true,
    ordine: 10
  },
  {
    id: 'vidimazione',
    code: 'VIDIMAZIONE',
    nome: 'Vidimazione',
    descrizione: 'Vidimazione libri sociali',
    icon: BookOpen, // 📖 Libro aperto per registri
    iconName: 'BookOpen',
    durata_minuti: 15,
    giorni_disponibili: [1, 3, 5], // Lun, Mer, Ven
    slot_disponibili: [1, 2],
    template_documento: null,
    attivo: true,
    ordine: 11
  },
  {
    id: 'altro',
    code: 'ALTRO',
    nome: 'Altro',
    descrizione: 'Altri servizi notarili',
    icon: FileText, // 📄 Documento generico
    iconName: 'FileText',
    durata_minuti: 30,
    giorni_disponibili: [1, 2, 3, 4, 5],
    slot_disponibili: [1, 2, 3],
    template_documento: null,
    attivo: true,
    ordine: 12
  }
]

// ✅ LocalStorage key per persistenza (v3: con giorni e slot disponibili)
const STORAGE_KEY = 'tipologie_atti_config_v3'

/**
 * Carica tipologie atti dal localStorage o usa default
 */
export function getTipologieAtti() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Ripristina le icone (non serializzabili in JSON) usando iconName
      return parsed.map(atto => ({
        ...atto,
        icon: atto.iconName ? ICON_MAP[atto.iconName] || FileText : FileText
      }))
    }
  } catch (error) {
    console.error('Errore caricamento tipologie atti:', error)
  }
  return TIPOLOGIE_ATTI_DEFAULT
}

/**
 * Salva tipologie atti nel localStorage e notifica i listener
 */
export function saveTipologieAtti(tipologie) {
  try {
    // Rimuovi le icone prima di salvare (non serializzabili)
    const toSave = tipologie.map(({ icon, ...rest }) => rest)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    
    // ✅ Notifica tutti i componenti che le tipologie sono cambiate
    window.dispatchEvent(new Event('tipologie-atti-updated'))
    console.log('📢 Evento tipologie-atti-updated emesso')
    
    return true
  } catch (error) {
    console.error('Errore salvataggio tipologie atti:', error)
    return false
  }
}

/**
 * Ottieni solo tipologie atti attive
 */
export function getTipologieAttiAttive() {
  return getTipologieAtti()
    .filter(atto => atto.attivo)
    .sort((a, b) => a.ordine - b.ordine)
}

/**
 * Aggiungi nuova tipologia atto
 */
export function aggiungiTipologiaAtto(nuovoAtto) {
  const tipologie = getTipologieAtti()
  const maxId = Math.max(...tipologie.map(t => parseInt(t.id) || 0), 0)
  
  const iconName = nuovoAtto.iconName || 'FileText'
  const atto = {
    id: `custom_${maxId + 1}`,
    code: `CUSTOM_${Date.now()}`,
    nome: nuovoAtto.nome,
    descrizione: nuovoAtto.descrizione || '',
    icon: ICON_MAP[iconName] || FileText,
    iconName: iconName,
    durata_minuti: nuovoAtto.durata_minuti || DURATE_PREDEFINITE.STANDARD,
    giorni_disponibili: nuovoAtto.giorni_disponibili || [1, 2, 3, 4, 5], // Default: Lun-Ven
    slot_disponibili: nuovoAtto.slot_disponibili || [1, 2, 3], // Default: tutti gli slot
    template_documento: nuovoAtto.template_documento || null,
    attivo: true,
    ordine: tipologie.length + 1
  }
  
  const nuoveTipologie = [...tipologie, atto]
  saveTipologieAtti(nuoveTipologie)
  return atto
}

/**
 * Aggiorna tipologia atto esistente
 */
export function aggiornaTipologiaAtto(id, updates) {
  const tipologie = getTipologieAtti()
  const nuoveTipologie = tipologie.map(atto => {
    if (atto.id === id) {
      const updatedAtto = { ...atto, ...updates }
      // Se cambia iconName, aggiorna anche l'icona React
      if (updates.iconName) {
        updatedAtto.icon = ICON_MAP[updates.iconName] || FileText
      }
      return updatedAtto
    }
    return atto
  })
  saveTipologieAtti(nuoveTipologie)
  return nuoveTipologie.find(a => a.id === id)
}

/**
 * Elimina tipologia atto (o disattiva)
 */
export function eliminaTipologiaAtto(id) {
  const tipologie = getTipologieAtti()
  // Non eliminare fisicamente, ma disattiva
  const nuoveTipologie = tipologie.map(atto => 
    atto.id === id ? { ...atto, attivo: false } : atto
  )
  saveTipologieAtti(nuoveTipologie)
  return true
}

/**
 * Riordina tipologie atti
 */
export function riordinaTipologieAtti(nuovoOrdine) {
  const tipologie = getTipologieAtti()
  const nuoveTipologie = nuovoOrdine.map((id, index) => {
    const atto = tipologie.find(a => a.id === id)
    return { ...atto, ordine: index + 1 }
  })
  saveTipologieAtti(nuoveTipologie)
  return nuoveTipologie
}

