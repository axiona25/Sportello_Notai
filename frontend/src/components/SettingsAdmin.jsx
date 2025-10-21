import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Calendar,
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  FileSignature,
  Users,
  FileText,
  Archive,
  FolderOpen
} from 'lucide-react'
import Header from './Header'
import apiClient from '../services/apiClient'
import './Settings.css'

function SettingsAdmin({ searchValue, onSearchChange, user }) {
  const [activeTab, setActiveTab] = useState(0)
  
  // State per tracciare se ogni tab è in modalità editing o saved
  const [tabStates, setTabStates] = useState({
    0: 'saved', // 'saved' o 'editing'
  })

  // State per le tipologie appuntamento
  const [appointmentTypes, setAppointmentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingType, setEditingType] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state per nuova/modifica tipologia
  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    default_duration_minutes: 30,
    icon: 'Calendar',
    color: '#4FADFF',
    order: 0,
    is_active: true
  })

  // Carica le tipologie al mount
  useEffect(() => {
    loadAppointmentTypes()
  }, [])

  const loadAppointmentTypes = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/ui/appointment-types/')
      
      // apiClient.get può ritornare direttamente l'array o response.data
      const data = response.data || response.results || response || []
      
      setAppointmentTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Errore caricamento tipologie:', error)
      setAppointmentTypes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrEdit = async () => {
    const currentState = tabStates[activeTab]
    if (currentState === 'editing') {
      // SALVA
      try {
        if (isCreating) {
          await apiClient.post('/ui/appointment-types/', typeForm)
        } else if (editingType) {
          await apiClient.patch(`/ui/appointment-types/${editingType.id}/`, typeForm)
        }
        
        await loadAppointmentTypes()
        setEditingType(null)
        setIsCreating(false)
        resetForm()
        
        setTabStates(prev => ({
          ...prev,
          [activeTab]: 'saved'
        }))
      } catch (error) {
        console.error('Errore salvataggio:', error)
        alert('Errore nel salvataggio')
      }
    } else {
      // MODIFICA
      setTabStates(prev => ({
        ...prev,
        [activeTab]: 'editing'
      }))
    }
  }

  const handleCancel = () => {
    setTabStates(prev => ({
      ...prev,
      [activeTab]: 'saved'
    }))
    setEditingType(null)
    setIsCreating(false)
    resetForm()
  }

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa tipologia?')) return
    
    try {
      await apiClient.delete(`/ui/appointment-types/${id}/`)
      await loadAppointmentTypes()
    } catch (error) {
      console.error('Errore eliminazione:', error)
      alert('Errore nell\'eliminazione')
    }
  }

  const handleEditType = (type) => {
    setEditingType(type)
    setTypeForm({
      code: type.code,
      name: type.name,
      description: type.description,
      default_duration_minutes: type.default_duration_minutes,
      icon: type.icon,
      color: type.color,
      order: type.order,
      is_active: type.is_active
    })
    setTabStates(prev => ({ ...prev, [activeTab]: 'editing' }))
  }

  const handleNewType = () => {
    setIsCreating(true)
    resetForm()
    setTabStates(prev => ({ ...prev, [activeTab]: 'editing' }))
  }

  const resetForm = () => {
    setTypeForm({
      code: '',
      name: '',
      description: '',
      default_duration_minutes: 30,
      icon: 'Calendar',
      color: '#4FADFF',
      order: appointmentTypes.length + 1,
      is_active: true
    })
  }

  const handleFormChange = (field, value) => {
    setTypeForm(prev => ({ ...prev, [field]: value }))
  }

  // Icon mapping per visualizzazione
  const iconMap = {
    FileSignature: FileSignature,
    Users: Users,
    FileText: FileText,
    Calendar: Calendar,
    Archive: Archive,
    FolderOpen: FolderOpen
  }

  const tabs = [
    { id: 0, label: 'Tipologie Appuntamenti', icon: Calendar }
  ]

  const renderTabContent = () => {
    const isEditing = tabStates[activeTab] === 'editing'

    switch (activeTab) {
      case 0:
        return renderTipologieAppuntamenti(isEditing)
      default:
        return null
    }
  }

  const renderTipologieAppuntamenti = (isEditing) => {
    return (
      <div className="settings-tab two-columns">
        <div className="settings-section">
          <h3 className="section-title">Gestione Tipologie Appuntamento</h3>

          {loading ? (
            <div className="loading-state">Caricamento...</div>
          ) : (
            <>
              {/* Form di modifica/creazione */}
              {(isCreating || editingType) && isEditing && (
                <div className="appointment-type-form">
                  <h4 className="form-subtitle">{isCreating ? 'Nuova Tipologia' : 'Modifica Tipologia'}</h4>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Codice *</label>
                      <input
                        type="text"
                        value={typeForm.code}
                        onChange={(e) => handleFormChange('code', e.target.value)}
                        placeholder="es: rogito"
                        disabled={!isCreating}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nome *</label>
                      <input
                        type="text"
                        value={typeForm.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="es: Rogito Notarile"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Descrizione</label>
                      <textarea
                        value={typeForm.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Breve descrizione del servizio"
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Durata (minuti) *</label>
                      <input
                        type="number"
                        value={typeForm.default_duration_minutes}
                        onChange={(e) => handleFormChange('default_duration_minutes', parseInt(e.target.value))}
                        min="5"
                        max="300"
                      />
                    </div>

                    <div className="form-group">
                      <label>Icona</label>
                      <select
                        value={typeForm.icon}
                        onChange={(e) => handleFormChange('icon', e.target.value)}
                      >
                        <option value="Calendar">Calendar</option>
                        <option value="FileSignature">FileSignature</option>
                        <option value="Users">Users</option>
                        <option value="FileText">FileText</option>
                        <option value="Archive">Archive</option>
                        <option value="FolderOpen">FolderOpen</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Colore</label>
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          value={typeForm.color}
                          onChange={(e) => handleFormChange('color', e.target.value)}
                        />
                        <span className="color-value">{typeForm.color}</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Ordine</label>
                      <input
                        type="number"
                        value={typeForm.order}
                        onChange={(e) => handleFormChange('order', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={typeForm.is_active}
                          onChange={(e) => handleFormChange('is_active', e.target.checked)}
                        />
                        Attivo
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista tipologie esistenti - SEMPRE VISIBILE */}
              <div className="appointment-types-list">
                {appointmentTypes && appointmentTypes.length > 0 ? appointmentTypes.map(type => {
                  const IconComponent = iconMap[type.icon] || Calendar
                  
                  return (
                    <div 
                      key={type.id} 
                      className={`appointment-type-card ${!type.is_active ? 'inactive' : ''}`}
                    >
                      <div className="type-icon" style={{ backgroundColor: `${type.color}20`, color: type.color }}>
                        <IconComponent size={24} />
                      </div>
                      
                      <div className="type-info">
                        <div className="type-header">
                          <h4>{type.name}</h4>
                          {!type.is_active && <span className="badge-inactive">Disattivo</span>}
                        </div>
                        <p className="type-description">{type.description}</p>
                        <div className="type-meta">
                          <span className="type-duration">{type.default_duration_minutes} min</span>
                          <span className="type-code">#{type.code}</span>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="type-actions">
                          <button 
                            className="btn-icon"
                            onClick={() => handleEditType(type)}
                            title="Modifica"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(type.id)}
                            title="Elimina"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }) : (
                  <div className="loading-state">
                    Nessuna tipologia di appuntamento trovata.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <Header searchValue={searchValue} onSearchChange={onSearchChange} user={user} />
      
      <div className="settings-content-wrapper">
        <div className="settings-header">
          <div className="settings-welcome-group">
            <h1 className="settings-welcome-title">Impostazioni Admin</h1>
          </div>
        </div>

        <div className="settings-tabs-container">
          <div className="settings-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="settings-actions">
            {tabStates[activeTab] === 'editing' && (
              <button className="btn-secondary" onClick={handleCancel}>
                Annulla
              </button>
            )}
            <button className="btn-primary" onClick={handleSaveOrEdit}>
              <Save size={18} />
              {tabStates[activeTab] === 'editing' ? 'Salva Modifiche' : 'Modifica'}
            </button>
            {tabStates[activeTab] === 'editing' && activeTab === 0 && (
              <button 
                className="btn-primary"
                onClick={handleNewType}
              >
                <Plus size={18} />
                Nuovo
              </button>
            )}
          </div>
        </div>

        <div className="settings-container">
          <div className="settings-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsAdmin
