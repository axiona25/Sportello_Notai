import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './AttoDetailModal.css'

function NotaryEditModal({ notary, onClose, onSave }) {
  const [formData, setFormData] = useState({
    studio_name: '',
    user_email: '',
    address_city: '',
    license_payment_frequency: 'monthly',
    license_expiry_date: '',
    license_payment_amount: '',
    license_active: true
  })

  useEffect(() => {
    if (notary) {
      setFormData({
        studio_name: notary.studio_name || '',
        user_email: notary.user_email || '',
        address_city: notary.address_city || '',
        license_payment_frequency: notary.license_payment_frequency || 'monthly',
        license_expiry_date: notary.license_expiry_date ? notary.license_expiry_date.split('T')[0] : '',
        license_payment_amount: notary.license_payment_amount || '',
        license_active: notary.license_active !== undefined ? notary.license_active : true
      })
    }
  }, [notary])

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
    
    // Rimuovi campi vuoti o non validi
    if (!cleanedData.license_expiry_date || cleanedData.license_expiry_date.trim() === '') {
      delete cleanedData.license_expiry_date
    }
    
    if (!cleanedData.license_payment_amount || cleanedData.license_payment_amount === '') {
      delete cleanedData.license_payment_amount
    } else {
      // Assicurati che l'importo sia un numero
      cleanedData.license_payment_amount = parseFloat(cleanedData.license_payment_amount)
    }
    
    if (!cleanedData.address_city || cleanedData.address_city.trim() === '') {
      delete cleanedData.address_city
    }
    
    onSave(notary.id, cleanedData)
  }

  if (!notary) return null

  return (
    <div className="atto-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="atto-modal-header">
          <h2>Modifica Notaio</h2>
          <button className="atto-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="edit-modal-body">
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-grid">
              {/* Nome e Cognome */}
              <div className="form-field">
                <label htmlFor="studio_name">Nome e Cognome</label>
                <input
                  type="text"
                  id="studio_name"
                  name="studio_name"
                  value={formData.studio_name}
                  onChange={handleChange}
                  required
                  placeholder="Es. Francesco Spada"
                />
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
                <label htmlFor="address_city">Città</label>
                <input
                  type="text"
                  id="address_city"
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleChange}
                />
              </div>

              {/* Frequenza Pagamento */}
              <div className="form-field">
                <label htmlFor="license_payment_frequency">Frequenza Pagamento Licenza</label>
                <select
                  id="license_payment_frequency"
                  name="license_payment_frequency"
                  value={formData.license_payment_frequency}
                  onChange={handleChange}
                  required
                >
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </div>

              {/* Importo Pagamento */}
              <div className="form-field">
                <label htmlFor="license_payment_amount">
                  Importo ({formData.license_payment_frequency === 'monthly' ? 'mensile' : 'annuale'})
                </label>
                <input
                  type="number"
                  id="license_payment_amount"
                  name="license_payment_amount"
                  value={formData.license_payment_amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Data Scadenza */}
              <div className="form-field">
                <label htmlFor="license_expiry_date">Data Scadenza Licenza</label>
                <input
                  type="date"
                  id="license_expiry_date"
                  name="license_expiry_date"
                  value={formData.license_expiry_date}
                  onChange={handleChange}
                />
              </div>

              {/* Stato Licenza */}
              <div className="form-field form-field-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="license_active"
                    checked={formData.license_active}
                    onChange={handleChange}
                  />
                  <span>Licenza Attiva</span>
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

export default NotaryEditModal

