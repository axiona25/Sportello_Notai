import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  FileSignature,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Header from './Header'
import actCategoriesService from '../services/actCategoriesService'
import { useToast } from '../contexts/ToastContext'
import './Settings.css'

function SettingsAdmin({ searchValue, onSearchChange, user }) {
  const [activeTab, setActiveTab] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const { showToast } = useToast()
  
  // State per le tipologie atto
  const [actCategories, setActCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [documentTypes, setDocumentTypes] = useState([])
  
  // Form state per nuova/modifica categoria
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    estimated_duration_minutes: 60,
    is_active: true
  })

  const tabs = [
    { id: 0, label: 'Tipologie Atti', icon: FileSignature }
  ]

  useEffect(() => {
    loadActCategories()
    loadDocumentTypes()
  }, [])

  const loadActCategories = async () => {
    setLoading(true)
    try {
      const data = await actCategoriesService.getAll()
      console.log('📋 Categorie atto caricate:', data.length)
      setActCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Errore caricamento categorie:', error)
      showToast('Errore caricamento tipologie atto', 'error')
      setActCategories([])
    } finally {
      setLoading(false)
    }
  }

  const loadDocumentTypes = async () => {
    try {
      const data = await actCategoriesService.getAllDocumentTypes()
      setDocumentTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Errore caricamento tipi documento:', error)
    }
  }

  const handleEditMode = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    loadActCategories() // Ricarica per annullare modifiche
  }

  const handleSaveChanges = async () => {
    setIsEditing(false)
    showToast('Modifiche salvate con successo', 'success')
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        estimated_duration_minutes: category.estimated_duration_minutes || 60,
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        description: '',
        estimated_duration_minutes: 60,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      estimated_duration_minutes: 60,
      is_active: true
    })
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // Modifica esistente
        await actCategoriesService.update(editingCategory.id, categoryForm)
        showToast('Tipologia atto aggiornata', 'success')
      } else {
        // Nuova categoria (nota: richiede anche main_category e code)
        showToast('Creazione nuove categorie non implementata in questa interfaccia', 'warning')
        handleCloseModal()
        return
      }
      
      await loadActCategories()
      handleCloseModal()
    } catch (error) {
      console.error('Errore salvataggio categoria:', error)
      showToast('Errore salvataggio tipologia atto', 'error')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa tipologia di atto?')) {
      return
    }

    try {
      await actCategoriesService.delete(categoryId)
      showToast('Tipologia atto eliminata', 'success')
      await loadActCategories()
    } catch (error) {
      console.error('Errore eliminazione categoria:', error)
      showToast('Errore eliminazione tipologia atto', 'error')
    }
  }

  const handleToggleActive = async (category) => {
    try {
      await actCategoriesService.update(category.id, {
        ...category,
        is_active: !category.is_active
      })
      showToast(
        category.is_active ? 'Tipologia disattivata' : 'Tipologia attivata',
        'success'
      )
      await loadActCategories()
    } catch (error) {
      console.error('Errore toggle active:', error)
      showToast('Errore modifica stato', 'error')
    }
  }

  return (
    <div className="dashboard-container">
      <Header 
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cerca impostazioni..."
        user={user}
      />
      
      <div className="dashboard-content">
        <div className="settings-container">
          {/* Header */}
          <div className="settings-header">
            <div className="settings-header-left">
              <SettingsIcon size={28} />
              <h1>Impostazioni Amministrazione</h1>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="settings-tabs-container">
            <div className="settings-tabs">
              {tabs.map(tab => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <TabIcon size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="settings-actions">
              {!isEditing ? (
                <>
                  <button className="btn-primary" onClick={handleEditMode}>
                    <Edit2 size={18} />
                    <span>Modifica</span>
                  </button>
                  <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    <span>Nuovo</span>
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={handleCancelEdit}>
                    <X size={18} />
                    <span>Annulla</span>
                  </button>
                  <button className="btn-primary" onClick={handleSaveChanges}>
                    <Save size={18} />
                    <span>Salva Modifiche</span>
                  </button>
                  <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    <span>Nuovo</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {activeTab === 0 && (
              <div className="settings-tab two-columns">
                <div className="settings-section full-width">
                  <h3>Tipologie di Atto Notarile</h3>
                  <p className="section-description">
                    Gestisci le tipologie di atto disponibili per la prenotazione appuntamenti
                  </p>

                  {loading ? (
                    <div className="loading-state">Caricamento...</div>
                  ) : actCategories.length === 0 ? (
                    <div className="loading-state">Nessuna tipologia di atto trovata.</div>
                  ) : (
                    <div className="appointment-types-list">
                      {actCategories.map(category => (
                        <div key={category.id} className="appointment-type-card">
                          <div className="type-card-header">
                            <div className="type-card-icon">
                              <FileSignature size={24} />
                            </div>
                            <div className="type-card-info">
                              <h4>{category.name}</h4>
                              <p className="type-code">{category.code}</p>
                              {category.main_category_name && (
                                <p className="type-category">{category.main_category_name}</p>
                              )}
                            </div>
                            <div className="type-card-actions">
                              {isEditing && (
                                <>
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleOpenModal(category)}
                                    title="Modifica"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    className="btn-icon btn-icon-danger"
                                    onClick={() => handleToggleActive(category)}
                                    title={category.is_active ? 'Disattiva' : 'Attiva'}
                                  >
                                    {category.is_active ? (
                                      <CheckCircle size={18} />
                                    ) : (
                                      <AlertCircle size={18} />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="type-card-body">
                            {category.description && (
                              <p className="type-description">{category.description}</p>
                            )}
                            
                            <div className="type-card-meta">
                              <div className="type-meta-item">
                                <Clock size={16} />
                                <span>{category.estimated_duration_minutes} minuti</span>
                              </div>
                              <div className="type-meta-item">
                                <FileText size={16} />
                                <span>{category.document_count || 0} documenti</span>
                              </div>
                              <div className="type-meta-item">
                                <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                                  {category.is_active ? 'Attivo' : 'Non Attivo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit/Create */}
      {showModal && (
        <ActCategoryModal
          category={editingCategory}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          documentTypes={documentTypes}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  )
}

// Componente Modale separato
function ActCategoryModal({ category, categoryForm, setCategoryForm, documentTypes, onClose, onSave }) {
  const [activeModalTab, setActiveModalTab] = useState(0)
  const [requiredDocuments, setRequiredDocuments] = useState([])
  const [availableDocuments, setAvailableDocuments] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    if (category) {
      // Carica documenti richiesti esistenti
      setRequiredDocuments(category.required_documents || [])
      
      // Filtra documenti disponibili (escludi quelli già richiesti)
      const requiredIds = (category.required_documents || []).map(rd => rd.document.id)
      setAvailableDocuments(
        documentTypes.filter(dt => !requiredIds.includes(dt.id))
      )
    } else {
      setRequiredDocuments([])
      setAvailableDocuments(documentTypes)
    }
  }, [category, documentTypes])

  const handleAddDocument = async (documentTypeId) => {
    if (!category) return
    
    try {
      await actCategoriesService.addDocument(category.id, {
        document_type_id: documentTypeId,
        is_mandatory: true,
        order: requiredDocuments.length
      })
      
      showToast('Documento aggiunto', 'success')
      
      // Ricarica la categoria per aggiornare i documenti
      const updated = await actCategoriesService.getById(category.id)
      setRequiredDocuments(updated.required_documents || [])
      
      const requiredIds = (updated.required_documents || []).map(rd => rd.document.id)
      setAvailableDocuments(documentTypes.filter(dt => !requiredIds.includes(dt.id)))
    } catch (error) {
      console.error('Errore aggiunta documento:', error)
      showToast('Errore aggiunta documento', 'error')
    }
  }

  const handleRemoveDocument = async (documentLinkId) => {
    if (!category) return
    
    try {
      await actCategoriesService.removeDocument(category.id, documentLinkId)
      showToast('Documento rimosso', 'success')
      
      // Aggiorna lo stato locale
      setRequiredDocuments(requiredDocuments.filter(rd => rd.id !== documentLinkId))
      
      // Ricarica documenti disponibili
      const updated = await actCategoriesService.getById(category.id)
      const requiredIds = (updated.required_documents || []).map(rd => rd.document.id)
      setAvailableDocuments(documentTypes.filter(dt => !requiredIds.includes(dt.id)))
    } catch (error) {
      console.error('Errore rimozione documento:', error)
      showToast('Errore rimozione documento', 'error')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{category ? 'Modifica Tipologia Atto' : 'Nuova Tipologia Atto'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs Modale */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeModalTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveModalTab(0)}
          >
            <FileSignature size={18} />
            <span>Dettagli</span>
          </button>
          {category && (
            <button
              className={`modal-tab ${activeModalTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveModalTab(1)}
            >
              <FileText size={18} />
              <span>Documenti Richiesti ({requiredDocuments.length})</span>
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* Tab 0: Dettagli */}
          {activeModalTab === 0 && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nome Tipologia *</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Es: Compravendita Immobiliare"
                />
              </div>

              <div className="form-group full-width">
                <label>Descrizione</label>
                <textarea
                  className="form-input"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Descrizione della tipologia di atto..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Durata Stimata (minuti) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={categoryForm.estimated_duration_minutes}
                  onChange={(e) => setCategoryForm({ ...categoryForm, estimated_duration_minutes: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  />
                  <span>Tipologia Attiva</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 1: Documenti */}
          {activeModalTab === 1 && category && (
            <div className="documents-management">
              <div className="documents-section">
                <h3>Documenti Richiesti</h3>
                {requiredDocuments.length === 0 ? (
                  <p className="empty-state">Nessun documento richiesto</p>
                ) : (
                  <div className="documents-list">
                    {requiredDocuments.map(reqDoc => (
                      <div key={reqDoc.id} className="document-item">
                        <div className="document-info">
                          <FileText size={18} />
                          <div>
                            <strong>{reqDoc.document.name}</strong>
                            <p>{reqDoc.document.description}</p>
                            <span className="document-category">{reqDoc.document.category}</span>
                          </div>
                        </div>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleRemoveDocument(reqDoc.id)}
                          title="Rimuovi documento"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="documents-section">
                <h3>Aggiungi Documento</h3>
                {availableDocuments.length === 0 ? (
                  <p className="empty-state">Tutti i documenti sono già richiesti</p>
                ) : (
                  <div className="documents-list">
                    {availableDocuments.map(doc => (
                      <div key={doc.id} className="document-item">
                        <div className="document-info">
                          <FileText size={18} />
                          <div>
                            <strong>{doc.name}</strong>
                            <p>{doc.description}</p>
                            <span className="document-category">{doc.category}</span>
                          </div>
                        </div>
                        <button
                          className="btn-icon"
                          onClick={() => handleAddDocument(doc.id)}
                          title="Aggiungi documento"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button className="btn-primary" onClick={onSave}>
            <Save size={18} />
            <span>Salva</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsAdmin
