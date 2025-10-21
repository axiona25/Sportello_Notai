import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Clock,
  FileText, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  User,
  MapPin,
  Star,
  Video,
  Phone,
  Users,
  FileSignature,
  Archive,
  FolderOpen
} from 'lucide-react'
import AppointmentCalendar from './AppointmentCalendar'
import appointmentService from '../services/appointmentService'
import appointmentExtendedService from '../services/appointmentExtendedService'
import { useToast } from '../contexts/ToastContext'
import './AppointmentBooking.css'

function AppointmentBooking({ notary, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedActType, setSelectedActType] = useState(null) // Cambiato da selectedService
  const [actCategories, setActCategories] = useState([]) // Tipologie di atto dal backend
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [currentPage, setCurrentPage] = useState(0) // Paginazione card
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedModes, setSelectedModes] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  
  const CARDS_PER_PAGE = 12 // Mostra 12 card per pagina

  // Carica le tipologie di atto dal backend
  useEffect(() => {
    loadActCategories()
  }, [])

  const loadActCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await appointmentExtendedService.getTipologieAtto()
      
      // Gestisci vari formati di risposta API
      let categoriesArray = []
      if (Array.isArray(response)) {
        categoriesArray = response
      } else if (response?.results) {
        categoriesArray = response.results
      } else if (response?.data) {
        categoriesArray = response.data
      }
      
      console.log('📊 Tipologie atto caricate dal backend:', categoriesArray.length)
      
      if (categoriesArray.length === 0) {
        console.log('⚠️  Nessuna categoria ricevuta dal backend, uso fallback')
        setActCategories([])
        return
      }
      
      // Converte le tipologie atto nel formato dei servizi esistenti
      const servicesFromBackend = categoriesArray.map(cat => ({
        id: cat.code,
        label: cat.name,
        duration: cat.estimated_duration_minutes || 60, // ✅ Usa durata dal backend
        icon: FileSignature, // Default icon, può essere mappata
        description: cat.description || '',
        tipologia_atto_id: cat.id // ID per il backend
      }))
      
      setActCategories(servicesFromBackend)
      console.log('✅ Card configurate:', servicesFromBackend.length)
    } catch (error) {
      console.error('❌ Errore caricamento tipologie atto:', error)
      // In caso di errore, usa i servizi hardcoded come fallback
      setActCategories([])
      console.log('⚠️  Fallback a servizi hardcoded')
    } finally {
      setLoadingCategories(false)
    }
  }

  // Servizi disponibili con durata (FALLBACK se backend non disponibile)
  const services = [
    { 
      id: 'rogito', 
      label: 'Rogito Notarile', 
      duration: 90,
      icon: FileSignature,
      description: 'Atto pubblico compravendita'
    },
    { 
      id: 'consulenza', 
      label: 'Consulenza Legale', 
      duration: 45,
      icon: Users,
      description: 'Supporto e consulenza'
    },
    { 
      id: 'revisione', 
      label: 'Revisione Documenti', 
      duration: 30,
      icon: FileText,
      description: 'Verifica documentale'
    },
    { 
      id: 'firma', 
      label: 'Firma Digitale', 
      duration: 20,
      icon: FileSignature,
      description: 'Apposizione firma'
    },
    { 
      id: 'procura', 
      label: 'Procura', 
      duration: 30,
      icon: Users,
      description: 'Atto di procura'
    },
    { 
      id: 'testamento', 
      label: 'Testamento', 
      duration: 60,
      icon: FileText,
      description: 'Redazione testamento'
    },
    { 
      id: 'donazione', 
      label: 'Donazione', 
      duration: 60,
      icon: FileSignature,
      description: 'Atto di donazione'
    },
    { 
      id: 'mutuo', 
      label: 'Mutuo', 
      duration: 45,
      icon: FileText,
      description: 'Stipula contratto mutuo'
    },
    { 
      id: 'costituzione', 
      label: 'Costituzione Società', 
      duration: 90,
      icon: Users,
      description: 'Costituzione società'
    },
    { 
      id: 'certificazione', 
      label: 'Certificazione', 
      duration: 20,
      icon: FileSignature,
      description: 'Certificati e autentiche'
    },
    { 
      id: 'vidimazione', 
      label: 'Vidimazione', 
      duration: 15,
      icon: FileText,
      description: 'Vidimazione libri sociali'
    },
    { 
      id: 'altro', 
      label: 'Altro', 
      duration: 30,
      icon: Calendar,
      description: 'Altri servizi notarili'
    }
  ]

  // Servizi di appuntamento
  const modes = [
    { 
      id: 'presence', 
      label: 'In Presenza', 
      icon: Users,
      description: 'Presso lo studio notarile'
    },
    { 
      id: 'video', 
      label: 'Video Chiamata', 
      icon: Video,
      description: 'Appuntamento online'
    },
    { 
      id: 'phone', 
      label: 'Telefonata', 
      icon: Phone,
      description: 'Chiamata telefonica'
    },
    { 
      id: 'digital_signature', 
      label: 'Firma Digitale', 
      icon: FileSignature,
      description: 'Firma con certificato digitale'
    },
    { 
      id: 'conservation', 
      label: 'Conservazione', 
      icon: Archive,
      description: 'Conservazione sostitutiva'
    },
    { 
      id: 'shared_folder', 
      label: 'Cartella Condivisa', 
      icon: FolderOpen,
      description: 'Condivisione documenti'
    }
  ]

  const totalSteps = 4

  const handleServiceSelect = (service) => {
    // Toggle: se clicchi sulla card già selezionata, la deseleziona
    if (selectedActType?.id === service.id) {
      setSelectedActType(null)
    } else {
      setSelectedActType(service)
    }
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  // Gestione paginazione
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    const totalPages = Math.ceil((actCategories.length > 0 ? actCategories : services).length / CARDS_PER_PAGE)
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  // Calcola card da mostrare nella pagina corrente
  const getPaginatedServices = () => {
    const allServices = actCategories.length > 0 ? actCategories : services
    const startIndex = currentPage * CARDS_PER_PAGE
    const endIndex = startIndex + CARDS_PER_PAGE
    const paginatedServices = allServices.slice(startIndex, endIndex)
    
    console.log(`📄 Pagina ${currentPage + 1}: Mostro ${paginatedServices.length} card (da ${startIndex + 1} a ${Math.min(endIndex, allServices.length)})`)
    
    return paginatedServices
  }

  const getTotalPages = () => {
    const allServices = actCategories.length > 0 ? actCategories : services
    return Math.ceil(allServices.length / CARDS_PER_PAGE)
  }

  const toggleMode = (modeId) => {
    setSelectedModes(prev => 
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    )
  }

  const handleNext = () => {
    if (currentStep === 1 && !selectedActType) {
      showToast('Seleziona un tipo di atto', 'warning', 'Attenzione')
      return
    }
    if (currentStep === 2 && !selectedSlot) {
      showToast('Seleziona una data e un orario', 'warning', 'Attenzione')
      return
    }
    if (currentStep === 3 && selectedModes.length === 0) {
      showToast('Seleziona almeno una modalità', 'warning', 'Attenzione')
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setLoading(true)

    const appointmentData = {
      notary: notary.id,
      appointment_type: selectedActType.id,
      tipologia_atto: selectedActType.tipologia_atto_id, // Nuovo campo per il backend
      date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      duration_minutes: selectedActType.duration,
      modes: selectedModes,
      notes: notes
    }

    const result = await appointmentService.createAppointment(appointmentData)

    if (result.success) {
      showToast(
        'Il notaio riceverà la tua richiesta e ti confermerà l\'appuntamento',
        'success',
        'Appuntamento Prenotato!'
      )
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            ...result.data,
            notary: notary,
            service: selectedActType,
            modes: selectedModes
          })
        }
        onClose()
      }, 1500)
    } else {
      showToast(
        result.error || 'Si è verificato un errore. Riprova.',
        'error',
        'Errore'
      )
    }

    setLoading(false)
  }

  const formatTime = (timeStr) => {
    return timeStr?.substring(0, 5)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Seleziona il Tipo di Atto'
      case 2: return 'Scegli Data e Ora'
      case 3: return 'Seleziona i servizi per il tuo appuntamento'
      case 4: return 'Riepilogo e Conferma'
      default: return ''
    }
  }

  const renderStepIndicator = () => (
    <div className="wizard-steps">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="wizard-step-item">
          <div className={`wizard-step-circle ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
            {currentStep > step ? <CheckCircle size={16} /> : step}
          </div>
          {step < 4 && <div className={`wizard-step-line ${currentStep > step ? 'active' : ''}`} />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="appointment-booking-overlay">
      <div className="appointment-booking-modal">
        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-header-content">
            <div className="wizard-title">
              <Calendar size={24} />
              <h2>Prenota Appuntamento</h2>
            </div>
            <button className="wizard-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          {/* Notary Card */}
          <div className="wizard-notary-card">
            <div className="wizard-notary-avatar">
              {notary.photo ? (
                <img src={notary.photo} alt={notary.name} />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="wizard-notary-info">
              <h3>{notary.name}</h3>
              <div className="wizard-notary-meta">
                <MapPin size={14} />
                <span>{notary.address}</span>
              </div>
              {notary.rating && (
                <div className="wizard-notary-rating">
                  <Star size={14} fill="#FFB800" stroke="#FFB800" />
                  <span>{notary.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}
        </div>

        {/* Body */}
        <div className="wizard-body">
          <div className="wizard-step-title">
            <h3>{getStepTitle()}</h3>
            {currentStep === 1 ? (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="pagination-info">
                  {currentPage + 1} di {getTotalPages()}
                </span>
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage}
                  disabled={currentPage === getTotalPages() - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <span className="wizard-step-count">Passo {currentStep} di {totalSteps}</span>
            )}
          </div>

          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="wizard-content">
              {loadingCategories ? (
                <div className="loading-state">Caricamento tipologie atto...</div>
              ) : (
                <div className="service-grid">
                  {getPaginatedServices().map(service => {
                    const Icon = service.icon
                    return (
                      <button
                        key={service.id}
                        className={`service-card ${selectedActType?.id === service.id ? 'selected' : ''}`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="service-card-icon">
                          <Icon size={32} />
                        </div>
                        <h4 className="service-card-title">{service.label}</h4>
                        <div className="service-card-duration">
                          <Clock size={14} />
                          <span>{service.duration} min</span>
                        </div>
                        {selectedActType?.id === service.id && (
                          <div className="service-card-check">
                            <CheckCircle size={20} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {currentStep === 2 && (
            <div className="wizard-content">
              <div className="calendar-wrapper">
                <AppointmentCalendar
                  notaryId={notary.id}
                  duration={selectedActType?.duration || 30}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedSlot}
                />
              </div>
              
              {selectedSlot && (
                <div className="selected-slot-card">
                  <CheckCircle size={20} />
                  <div>
                    <p className="slot-label">Appuntamento selezionato:</p>
                    <p className="slot-value">
                      {formatDate(selectedSlot.date)} alle ore {formatTime(selectedSlot.start_time)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Modes Selection */}
          {currentStep === 3 && (
            <div className="wizard-content">
              <div className="modes-grid">
                {modes.map(mode => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.id}
                      className={`mode-card ${selectedModes.includes(mode.id) ? 'selected' : ''}`}
                      onClick={() => toggleMode(mode.id)}
                    >
                      <div className="mode-card-header">
                        <div className="mode-card-icon">
                          <Icon size={24} />
                        </div>
                        {selectedModes.includes(mode.id) && (
                          <div className="mode-card-check">
                            <CheckCircle size={18} />
                          </div>
                        )}
                      </div>
                      <div className="mode-card-content">
                        <h4>{mode.label}</h4>
                        <p>{mode.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              <div className="form-group">
                <label className="form-label">Note aggiuntive (opzionale)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Descrivi brevemente il motivo dell'appuntamento o aggiungi informazioni utili..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div className="wizard-content">
              <div className="summary-card">
                <h4 className="summary-title">Dettagli Appuntamento</h4>
                
                <div className="summary-section">
                  <div className="summary-label">Tipo di Atto</div>
                  <div className="summary-value">
                    {selectedActType.label}
                    <span className="summary-badge">{selectedActType.duration} min</span>
                  </div>
                </div>

                <div className="summary-section">
                  <div className="summary-label">Data e Ora</div>
                  <div className="summary-value">
                    {formatDate(selectedSlot.date)}
                    <span className="summary-time">{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</span>
                  </div>
                </div>

                <div className="summary-section">
                  <div className="summary-label">Servizi Selezionati</div>
                  <div className="summary-modes">
                    {selectedModes.map(modeId => {
                      const mode = modes.find(m => m.id === modeId)
                      const Icon = mode.icon
                      return (
                        <div key={modeId} className="summary-mode-chip">
                          <Icon size={14} />
                          <span>{mode.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {notes && (
                  <div className="summary-section">
                    <div className="summary-label">Note</div>
                    <div className="summary-value summary-notes">{notes}</div>
                  </div>
                )}
              </div>

              <div className="confirmation-message">
                <div className="confirmation-icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="confirmation-text">
                    Confermando, la tua richiesta verrà inviata al notaio <strong>{notary.name}</strong>.
                    Riceverai una conferma via email non appena l'appuntamento sarà accettato.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          <button 
            className="wizard-btn wizard-btn-secondary" 
            onClick={handlePrev}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft size={18} />
            Indietro
          </button>
          
          {currentStep < totalSteps ? (
            <button 
              className="wizard-btn wizard-btn-primary" 
              onClick={handleNext}
            >
              Avanti
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              className="wizard-btn wizard-btn-confirm" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Prenotazione...' : 'Conferma Appuntamento'}
              <CheckCircle size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentBooking
