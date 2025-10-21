import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Lock, Unlock } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import PartnersSidebar from './PartnersSidebar'
import PartnerEditModal from './PartnerEditModal'
import ConfirmModal from './ConfirmModal'
import adminService from '../services/adminService'
import { useToast } from '../contexts/ToastContext'
import './DashboardNotaio.css'
import './AttiContent.css'
import './AttiSidebar.css'

function PartnersManagement({ onLogout, onBack, onNavigateToDashboard, onNavigateToNotaries, onNavigateToPartners, onNavigateToSettings, user }) {
  const { showToast } = useToast()
  const [searchValue, setSearchValue] = useState('')
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [editingPartner, setEditingPartner] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', partner: null })

  useEffect(() => {
    loadPartners()
  }, [selectedFilter])

  const loadPartners = async () => {
    setLoading(true)
    const filters = selectedFilter ? { is_active: selectedFilter.type === 'active' } : {}
    const result = await adminService.getPartners(filters)
    if (result.success) {
      setPartners(result.data.results || result.data)
    }
    setLoading(false)
  }

  const handleToggleBlock = (partner) => {
    setConfirmModal({
      isOpen: true,
      type: partner.is_active ? 'block' : 'unblock',
      partner: partner
    })
  }

  const handleDelete = (partner) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      partner: partner
    })
  }

  const handleConfirmAction = async () => {
    const { type, partner } = confirmModal
    let result = null

    if (type === 'delete') {
      result = await adminService.deletePartner(partner.id)
      if (result.success) {
        showToast(
          `Il partner "${partner.ragione_sociale}" è stato eliminato definitivamente.`,
          'success',
          'Partner eliminato'
        )
        loadPartners()
      } else {
        showToast(
          result.error || 'Si è verificato un errore durante l\'eliminazione.',
          'error',
          'Errore eliminazione'
        )
      }
    } else if (type === 'block' || type === 'unblock') {
      result = await adminService.updatePartner(partner.id, {
        is_active: !partner.is_active
      })
      if (result.success) {
        const action = type === 'block' ? 'disattivato' : 'attivato'
        const actionCap = type === 'block' ? 'Disattivato' : 'Attivato'
        showToast(
          `Il partner "${partner.ragione_sociale}" è stato ${action} con successo.`,
          'success',
          `Partner ${actionCap}`
        )
        loadPartners()
      } else {
        showToast(
          result.error || 'Si è verificato un errore durante l\'operazione.',
          'error',
          'Errore'
        )
      }
    }

    setConfirmModal({ isOpen: false, type: '', partner: null })
  }

  const handleEdit = (partner) => {
    setEditingPartner(partner)
  }

  const handleSaveEdit = async (partnerId, formData) => {
    const result = await adminService.updatePartner(partnerId, formData)
    if (result.success) {
      showToast(
        'Le modifiche al profilo del partner sono state salvate correttamente.',
        'success',
        'Modifiche salvate'
      )
      setEditingPartner(null)
      loadPartners()
    } else {
      showToast(
        result.error || 'Si è verificato un errore durante il salvataggio.',
        'error',
        'Errore salvataggio'
      )
    }
  }

  const handleCloseModal = () => {
    setEditingPartner(null)
  }

  // Genera iniziali dal nome completo
  const getInitials = (fullName) => {
    if (!fullName) return 'NN'
    
    const parts = fullName.split(' ').filter(p => p.length > 0)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Calcola lo stato del partner (attivo o disattivato)
  const getPartnerStatus = (partner) => {
    return partner.is_active 
      ? { class: 'concluso', label: 'Attivo' }
      : { class: 'sospeso', label: 'Disattivato' }
  }

  const filteredPartners = partners.filter(partner =>
    searchValue === '' || 
    partner.ragione_sociale?.toLowerCase().includes(searchValue.toLowerCase()) ||
    partner.tipologia?.toLowerCase().includes(searchValue.toLowerCase()) ||
    partner.user_email?.toLowerCase().includes(searchValue.toLowerCase()) ||
    partner.citta?.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="dashboard-notaio">
      <Sidebar 
        onLogout={onLogout}
        userRole="admin"
        currentView="partners"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToNotaries={onNavigateToNotaries}
        onNavigateToPartners={onNavigateToPartners}
        onNavigateToSettings={onNavigateToSettings}
      />
      <div className="dashboard-notaio-main">
        <Header 
          searchValue={searchValue} 
          onSearchChange={setSearchValue}
          searchPlaceholder="Cerca partners..."
          user={user}
        />
        <div className="dashboard-notaio-content">
          {/* Titolo Pagina con Pulsante */}
          <div className="welcome-section">
            <div className="welcome-container">
              <div className="welcome-text-group">
                <h1 className="welcome-title">Gestione</h1>
                <div className="welcome-name-container">
                  <span className="welcome-name">Partners</span>
                  <img src="/assets/element.png" alt="" className="welcome-underline" />
                </div>
              </div>
              <button className="btn-nuovo">
                <Plus size={20} />
                <span>Nuovo Partner</span>
              </button>
            </div>
          </div>

          {/* Container Card Atti - STRUTTURA IDENTICA */}
          <div className="atti-container">
            <div className="atti-card">
              <PartnersSidebar 
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
              />
              <div className="atti-separator-vertical"></div>
              <div className="atti-content">

                {/* Tabella */}
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Caricamento partners...</p>
                  </div>
                ) : (
                  <div className="atti-table-wrapper">
                    <table className="atti-table">
                      <thead>
                        <tr>
                          <th>RAGIONE SOCIALE</th>
                          <th>TIPOLOGIA</th>
                          <th>EMAIL</th>
                          <th>CITTÀ</th>
                          <th>TELEFONO</th>
                          <th>STATO</th>
                          <th>AZIONI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPartners.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="atti-no-results">
                              <div className="empty-state">
                                <p>Nessun partner trovato</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPartners.map(partner => {
                            // I partner potrebbero non avere foto, mostriamo solo iniziali
                            const colors = ['#1668B0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                            const colorIndex = partner.id ? (typeof partner.id === 'string' ? partner.id.charCodeAt(0) : partner.id) % colors.length : 0
                            const partnerStatus = getPartnerStatus(partner)
                            
                            return (
                            <tr key={partner.id}>
                              <td>
                                <div className="atti-menu-item-left" style={{ gap: '12px' }}>
                                  <div className="atti-notaio-avatar" style={{ background: colors[colorIndex] }}>
                                    <span style={{ color: 'white', fontWeight: '600' }}>
                                      {getInitials(partner.ragione_sociale)}
                                    </span>
                                  </div>
                                  <span className="atti-tipologia">{partner.ragione_sociale}</span>
                                </div>
                              </td>
                              <td>{partner.tipologia || '-'}</td>
                              <td>{partner.user_email}</td>
                              <td>{partner.citta || '-'}</td>
                              <td>{partner.telefono || '-'}</td>
                              <td>
                                <div className="atti-stato-dot-container">
                                  <span className={`atti-stato-dot ${partnerStatus.class}`}></span>
                                  <span className="atti-stato-tooltip">{partnerStatus.label}</span>
                                </div>
                              </td>
                              <td className="atti-actions">
                                <button 
                                  className="atti-action-btn" 
                                  title="Modifica"
                                  onClick={() => handleEdit(partner)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="atti-action-btn" 
                                  title={partner.is_active ? 'Disattiva' : 'Attiva'}
                                  onClick={() => handleToggleBlock(partner)}
                                >
                                  {partner.is_active ? <Unlock size={16} /> : <Lock size={16} />}
                                </button>
                                <button 
                                  className="atti-action-btn atti-action-delete" 
                                  title="Elimina"
                                  onClick={() => handleDelete(partner)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale Modifica */}
      {editingPartner && (
        <PartnerEditModal
          partner={editingPartner}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modale Conferma */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', partner: null })}
        onConfirm={handleConfirmAction}
        type={confirmModal.type}
        title={
          confirmModal.type === 'delete' ? 'Elimina Partner' :
          confirmModal.type === 'block' ? 'Disattiva Partner' :
          'Attiva Partner'
        }
        message={
          confirmModal.type === 'delete' 
            ? 'Questa azione è irreversibile. Tutti i dati associati al partner verranno eliminati permanentemente.' 
            : confirmModal.type === 'block'
            ? 'Il partner non potrà più accedere alla piattaforma.'
            : 'Il partner potrà nuovamente accedere alla piattaforma.'
        }
        itemName={confirmModal.partner?.ragione_sociale}
        itemLabel="Partner"
        confirmText={
          confirmModal.type === 'delete' ? 'Elimina' :
          confirmModal.type === 'block' ? 'Disattiva' :
          'Attiva'
        }
      />
    </div>
  )
}

export default PartnersManagement
