import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Shield, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import adminService from '../services/adminService'
import './NotariesManagement.css'

function NotariesManagement({ searchValue, onBack }) {
  const [notaries, setNotaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, expiring_soon, expired, disabled
  const [selectedNotary, setSelectedNotary] = useState(null)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseData, setLicenseData] = useState({
    license_active: true,
    license_start_date: '',
    license_expiry_date: '',
    license_payment_amount: 990.00,
    license_payment_frequency: 'annual',
    license_notes: ''
  })

  useEffect(() => {
    loadNotaries()
  }, [filter])

  const loadNotaries = async () => {
    setLoading(true)
    const filters = {
      license_status: filter !== 'all' ? filter : undefined
    }
    const result = await adminService.getNotaries(filters)
    if (result.success) {
      setNotaries(result.data.results || result.data)
    }
    setLoading(false)
  }

  const handleEditLicense = (notary) => {
    setSelectedNotary(notary)
    setLicenseData({
      license_active: notary.license_active,
      license_start_date: notary.license_start_date || '',
      license_expiry_date: notary.license_expiry_date || '',
      license_payment_amount: notary.license_payment_amount || 990.00,
      license_payment_frequency: notary.license_payment_frequency || 'annual',
      license_notes: notary.license_notes || ''
    })
    setShowLicenseModal(true)
  }

  const handleSaveLicense = async () => {
    if (!selectedNotary) return

    const result = await adminService.updateNotaryLicense(selectedNotary.id, licenseData)
    if (result.success) {
      alert('✅ Licenza aggiornata con successo!')
      setShowLicenseModal(false)
      setSelectedNotary(null)
      loadNotaries()
    } else {
      alert(`❌ Errore: ${result.error}`)
    }
  }

  const handleDeleteNotary = async (notary) => {
    if (!confirm(`Vuoi davvero disabilitare il notaio "${notary.studio_name}"?`)) return

    const result = await adminService.deleteNotary(notary.id)
    if (result.success) {
      alert('✅ Notaio disabilitato')
      loadNotaries()
    } else {
      alert(`❌ Errore: ${result.error}`)
    }
  }

  const getLicenseStatusBadge = (notary) => {
    const status = notary.license_status

    if (status === 'active') {
      return (
        <span className="status-badge status-active">
          <CheckCircle size={14} />
          Attiva
        </span>
      )
    } else if (status === 'expiring_soon') {
      return (
        <span className="status-badge status-expiring">
          <Clock size={14} />
          In scadenza
        </span>
      )
    } else if (status === 'expired') {
      return (
        <span className="status-badge status-expired">
          <AlertCircle size={14} />
          Scaduta
        </span>
      )
    } else {
      return (
        <span className="status-badge status-disabled">
          <XCircle size={14} />
          Disattivata
        </span>
      )
    }
  }

  const filteredNotaries = notaries.filter(notary => 
    notary.studio_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    notary.user_email?.toLowerCase().includes(searchValue.toLowerCase()) ||
    notary.address_city?.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="notaries-management">
      {/* Header */}
      <div className="management-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Dashboard</button>
          <h1>Gestione Notai</h1>
        </div>
      </div>

      {/* Filtri */}
      <div className="management-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tutti
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Licenze Attive
        </button>
        <button
          className={`filter-btn ${filter === 'expiring_soon' ? 'active' : ''}`}
          onClick={() => setFilter('expiring_soon')}
        >
          In Scadenza
        </button>
        <button
          className={`filter-btn ${filter === 'expired' ? 'active' : ''}`}
          onClick={() => setFilter('expired')}
        >
          Scadute
        </button>
        <button
          className={`filter-btn ${filter === 'disabled' ? 'active' : ''}`}
          onClick={() => setFilter('disabled')}
        >
          Disattivate
        </button>
      </div>

      {/* Tabella */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Caricamento notai...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="notaries-table">
            <thead>
              <tr>
                <th>Studio</th>
                <th>Email</th>
                <th>Città</th>
                <th>Licenza</th>
                <th>Scadenza</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotaries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-results">
                    Nessun notaio trovato
                  </td>
                </tr>
              ) : (
                filteredNotaries.map(notary => (
                  <tr key={notary.id}>
                    <td className="notary-name">{notary.studio_name}</td>
                    <td className="notary-email">{notary.user_email}</td>
                    <td>{notary.address_city || '-'}</td>
                    <td>
                      {notary.license_payment_frequency === 'monthly' ? 'Mensile' : 'Annuale'}
                      <br />
                      <small>€{notary.license_payment_amount || 0}</small>
                    </td>
                    <td>
                      {notary.license_expiry_date 
                        ? new Date(notary.license_expiry_date).toLocaleDateString('it-IT')
                        : 'Nessuna'}
                    </td>
                    <td>{getLicenseStatusBadge(notary)}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-icon-primary"
                        title="Gestisci Licenza"
                        onClick={() => handleEditLicense(notary)}
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Disabilita Notaio"
                        onClick={() => handleDeleteNotary(notary)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Licenza */}
      {showLicenseModal && selectedNotary && (
        <>
          <div className="modal-overlay" onClick={() => setShowLicenseModal(false)}></div>
          <div className="license-modal">
            <div className="modal-header">
              <h2>Gestione Licenza - {selectedNotary.studio_name}</h2>
              <button className="modal-close" onClick={() => setShowLicenseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={licenseData.license_active}
                    onChange={(e) => setLicenseData({...licenseData, license_active: e.target.checked})}
                  />
                  <span>Licenza Attiva</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data Inizio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={licenseData.license_start_date}
                    onChange={(e) => setLicenseData({...licenseData, license_start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Data Scadenza</label>
                  <input
                    type="date"
                    className="form-input"
                    value={licenseData.license_expiry_date}
                    onChange={(e) => setLicenseData({...licenseData, license_expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Importo Canone (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={licenseData.license_payment_amount}
                    onChange={(e) => setLicenseData({...licenseData, license_payment_amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Frequenza Pagamento</label>
                  <select
                    className="form-select"
                    value={licenseData.license_payment_frequency}
                    onChange={(e) => setLicenseData({...licenseData, license_payment_frequency: e.target.value})}
                  >
                    <option value="monthly">Mensile</option>
                    <option value="annual">Annuale</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Note Amministrative</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={licenseData.license_notes}
                  onChange={(e) => setLicenseData({...licenseData, license_notes: e.target.value})}
                  placeholder="Note interne sulla licenza, rinnovi, comunicazioni, ecc."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowLicenseModal(false)}>
                Annulla
              </button>
              <button className="btn-primary" onClick={handleSaveLicense}>
                Salva Licenza
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotariesManagement

