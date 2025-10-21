import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './AttoDetailModal.css'

function PartnerEditModal({ partner, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ragione_sociale: '',
    tipologia: '',
    user_email: '',
    citta: '',
    telefono: '',
    is_active: true
  })

  useEffect(() => {
    if (partner) {
      setFormData({
        ragione_sociale: partner.ragione_sociale || '',
        tipologia: partner.tipologia || '',
        user_email: partner.user_email || '',
        citta: partner.citta || '',
        telefono: partner.telefono || '',
        is_active: partner.is_active !== undefined ? partner.is_active : true
      })
    }
  }, [partner])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Pulisci i dati prima di inviarli
    const cleanedData = { ...formData }
    
    // Rimuovi campi vuoti
    if (!cleanedData.citta || cleanedData.citta.trim() === '') {
      delete cleanedData.citta
    }
    
    if (!cleanedData.telefono || cleanedData.telefono.trim() === '') {
      delete cleanedData.telefono
    }
    
    onSave(partner.id, cleanedData)
  }

  if (!partner) return null

  return (
    <div className="atto-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="atto-modal-header">
          <h2>Modifica Partner</h2>
          <button className="atto-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="edit-modal-body">
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-grid">
              {/* Ragione Sociale */}
              <div className="form-field">
                <label htmlFor="ragione_sociale">Ragione Sociale</label>
                <input
                  type="text"
                  id="ragione_sociale"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Tipologia */}
              <div className="form-field">
                <label htmlFor="tipologia">Tipologia</label>
                <select
                  id="tipologia"
                  name="tipologia"
                  value={formData.tipologia}
                  onChange={handleChange}
                >
                  <option value="">Seleziona tipologia</option>
                  <option value="agenzia_immobiliare">Agenzia Immobiliare</option>
                  <option value="geometra">Geometra</option>
                  <option value="architetto">Architetto</option>
                  <option value="consulente_lavoro">Consulente del Lavoro</option>
                  <option value="commercialista">Commercialista</option>
                  <option value="perito">Perito</option>
                </select>
              </div>

              {/* Email */}
              <div className="form-field">
                <label htmlFor="user_email">Email</label>
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Città */}
              <div className="form-field">
                <label htmlFor="citta">Città</label>
                <input
                  type="text"
                  id="citta"
                  name="citta"
                  value={formData.citta}
                  onChange={handleChange}
                />
              </div>

              {/* Telefono */}
              <div className="form-field">
                <label htmlFor="telefono">Telefono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>

              {/* Stato Attivo */}
              <div className="form-field form-field-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Attivo</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="edit-modal-footer">
              <button type="button" className="edit-btn-cancel" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="edit-btn-save">
                Salva Modifiche
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PartnerEditModal

