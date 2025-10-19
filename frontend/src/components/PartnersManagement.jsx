import React, { useState, useEffect } from 'react'
import { Building2, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import adminService from '../services/adminService'
import './NotariesManagement.css' // Riutilizzo gli stessi stili

function PartnersManagement({ searchValue, onBack }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    const result = await adminService.getPartners()
    if (result.success) {
      setPartners(result.data.results || result.data)
    }
    setLoading(false)
  }

  const handleDeletePartner = async (partner) => {
    if (!confirm(`Vuoi davvero eliminare il partner "${partner.ragione_sociale}"?`)) return

    const result = await adminService.deletePartner(partner.id)
    if (result.success) {
      alert('✅ Partner eliminato')
      loadPartners()
    } else {
      alert(`❌ Errore: ${result.error}`)
    }
  }

  const filteredPartners = partners.filter(partner => 
    partner.ragione_sociale?.toLowerCase().includes(searchValue.toLowerCase()) ||
    partner.mail?.toLowerCase().includes(searchValue.toLowerCase()) ||
    partner.citta?.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="notaries-management">
      {/* Header */}
      <div className="management-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Dashboard</button>
          <h1>Gestione Partners</h1>
        </div>
      </div>

      {/* Tabella */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Caricamento partners...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="notaries-table">
            <thead>
              <tr>
                <th>Ragione Sociale</th>
                <th>Tipologia</th>
                <th>Email</th>
                <th>Città</th>
                <th>Telefono</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-results">
                    Nessun partner trovato
                  </td>
                </tr>
              ) : (
                filteredPartners.map(partner => (
                  <tr key={partner.id}>
                    <td className="notary-name">{partner.ragione_sociale}</td>
                    <td>{partner.tipologia || '-'}</td>
                    <td className="notary-email">{partner.mail || '-'}</td>
                    <td>{partner.citta || '-'}</td>
                    <td>{partner.cellulare || partner.telefono || '-'}</td>
                    <td>
                      {partner.is_active ? (
                        <span className="status-badge status-active">
                          <CheckCircle size={14} />
                          Attivo
                        </span>
                      ) : (
                        <span className="status-badge status-disabled">
                          <XCircle size={14} />
                          Disattivo
                        </span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Elimina Partner"
                        onClick={() => handleDeletePartner(partner)}
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
    </div>
  )
}

export default PartnersManagement

