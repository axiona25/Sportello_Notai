import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Lock, Unlock } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import NotariesSidebar from './NotariesSidebar'
import NotaryEditModal from './NotaryEditModal'
import ConfirmModal from './ConfirmModal'
import adminService from '../services/adminService'
import { useToast } from '../contexts/ToastContext'
import './DashboardNotaio.css'
import './AttiContent.css'
import './AttiSidebar.css'

function NotariesManagement({ onLogout, onBack, onNavigateToDashboard, onNavigateToNotaries, onNavigateToPartners, onNavigateToSettings, user }) {
  const { showToast } = useToast()
  const [searchValue, setSearchValue] = useState('')
  const [notaries, setNotaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [editingNotary, setEditingNotary] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', notary: null })

  useEffect(() => {
    loadNotaries()
  }, [selectedFilter])

  const loadNotaries = async () => {
    setLoading(true)
    const filters = selectedFilter ? { license_status: selectedFilter.type } : {}
    const result = await adminService.getNotaries(filters)
    if (result.success) {
      setNotaries(result.data.results || result.data)
    }
    setLoading(false)
  }

  const handleToggleBlock = (notary) => {
    setConfirmModal({
      isOpen: true,
      type: notary.license_active ? 'block' : 'unblock',
      notary: notary
    })
  }

  const handleDelete = (notary) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      notary: notary
    })
  }

  const handleConfirmAction = async () => {
    const { type, notary } = confirmModal
    let result = null

    if (type === 'delete') {
      result = await adminService.deleteNotary(notary.id)
      if (result.success) {
        showToast(
          `Il notaio "${notary.studio_name}" è stato eliminato definitivamente.`,
          'success',
          'Notaio eliminato'
        )
        loadNotaries()
      } else {
        showToast(
          result.error || 'Si è verificato un errore durante l\'eliminazione.',
          'error',
          'Errore eliminazione'
        )
      }
    } else if (type === 'block' || type === 'unblock') {
      result = await adminService.updateNotaryLicense(notary.id, {
        license_active: !notary.license_active
      })
      if (result.success) {
        const action = type === 'block' ? 'bloccato' : 'sbloccato'
        const actionCap = type === 'block' ? 'Bloccato' : 'Sbloccato'
        showToast(
          `Il notaio "${notary.studio_name}" è stato ${action} con successo.`,
          'success',
          `Notaio ${actionCap}`
        )
        loadNotaries()
      } else {
        showToast(
          result.error || 'Si è verificato un errore durante l\'operazione.',
          'error',
          'Errore'
        )
      }
    }

    setConfirmModal({ isOpen: false, type: '', notary: null })
  }

  const handleEdit = (notary) => {
    setEditingNotary(notary)
  }

  const handleSaveEdit = async (notaryId, formData) => {
    const result = await adminService.updateNotary(notaryId, formData)
    if (result.success) {
      showToast(
        'Le modifiche al profilo del notaio sono state salvate correttamente.',
        'success',
        'Modifiche salvate'
      )
      setEditingNotary(null)
      loadNotaries()
    } else {
      showToast(
        result.error || 'Si è verificato un errore durante il salvataggio.',
        'error',
        'Errore salvataggio'
      )
    }
  }

  const handleCloseModal = () => {
    setEditingNotary(null)
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

  // Calcola lo stato della licenza (attivo, in scadenza, bloccato)
  const getLicenseStatus = (notary) => {
    if (!notary.license_active) {
      return { class: 'sospeso', label: 'Bloccato' }
    }

    if (notary.license_expiry_date) {
      const today = new Date()
      const expiryDate = new Date(notary.license_expiry_date)
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

      if (daysRemaining < 0) {
        return { class: 'sospeso', label: 'Scaduto' }
      } else if (daysRemaining <= 30) {
        return { class: 'lavorazione', label: 'In Scadenza' }
      }
    }

    return { class: 'concluso', label: 'Attivo' }
  }

  const filteredNotaries = notaries.filter(notary =>
    searchValue === '' || 
    notary.studio_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    notary.user_email?.toLowerCase().includes(searchValue.toLowerCase()) ||
    notary.address_city?.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="dashboard-notaio">
      <Sidebar 
        onLogout={onLogout}
        userRole="admin"
        currentView="notaries"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToNotaries={onNavigateToNotaries}
        onNavigateToPartners={onNavigateToPartners}
        onNavigateToSettings={onNavigateToSettings}
      />
      <div className="dashboard-notaio-main">
        <Header 
          searchValue={searchValue} 
          onSearchChange={setSearchValue}
          searchPlaceholder="Cerca notai..."
          user={user}
        />
        <div className="dashboard-notaio-content">
          {/* Titolo Pagina con Pulsante */}
          <div className="welcome-section">
            <div className="welcome-container">
              <div className="welcome-text-group">
                <h1 className="welcome-title">Gestione</h1>
                <div className="welcome-name-container">
                  <span className="welcome-name">Notai</span>
                  <img src="/assets/element.png" alt="" className="welcome-underline" />
                </div>
              </div>
              <button className="btn-nuovo">
                <Plus size={20} />
                <span>Nuovo Notaio</span>
              </button>
            </div>
          </div>

          {/* Container Card Atti - STRUTTURA IDENTICA */}
          <div className="atti-container">
            <div className="atti-card">
              <NotariesSidebar 
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
              />
              <div className="atti-separator-vertical"></div>
              <div className="atti-content">

                {/* Tabella */}
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Caricamento notai...</p>
                  </div>
                ) : (
                  <div className="atti-table-wrapper">
                    <table className="atti-table">
                      <thead>
                        <tr>
                          <th>NOME E COGNOME</th>
                          <th>EMAIL</th>
                          <th>CITTÀ</th>
                          <th>LICENZA</th>
                          <th>SCADENZA</th>
                          <th>CANONE ANNUO</th>
                          <th>STATO</th>
                          <th>AZIONI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotaries.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="atti-no-results">
                              <div className="empty-state">
                                <p>Nessun notaio trovato</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredNotaries.map(notary => {
                            const hasFoto = notary.showcase_photo || notary.foto
                            const hasValidPhoto = hasFoto && hasFoto !== '' && hasFoto.startsWith('data:image')
                            const licenseStatus = getLicenseStatus(notary)
                            
                            return (
                            <tr key={notary.id}>
                              <td>
                                <div className="atti-menu-item-left" style={{ gap: '12px' }}>
                                  <div className="atti-notaio-avatar" style={{ background: hasValidPhoto ? 'transparent' : '#1668B0' }}>
                                    {hasValidPhoto ? (
                                      <img src={hasFoto} alt={notary.studio_name} className="atti-avatar-image" />
                                    ) : (
                                      <span style={{ color: 'white', fontWeight: '600' }}>
                                        {getInitials(notary.studio_name)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="atti-tipologia">{notary.studio_name}</span>
                                </div>
                              </td>
                              <td>{notary.user_email}</td>
                              <td>{notary.address_city || '-'}</td>
                              <td>
                                {notary.license_payment_frequency === 'monthly' ? 'Mensile' : 'Annuale'}
                              </td>
                              <td>
                                {notary.license_expiry_date 
                                  ? new Date(notary.license_expiry_date).toLocaleDateString('it-IT')
                                  : '-'}
                              </td>
                              <td className="atti-valore">
                                €{((notary.license_payment_frequency === 'monthly' 
                                  ? (notary.license_payment_amount || 0) * 12 
                                  : (notary.license_payment_amount || 0)
                                ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                              </td>
                              <td>
                                <div className="atti-stato-dot-container">
                                  <span className={`atti-stato-dot ${licenseStatus.class}`}></span>
                                  <span className="atti-stato-tooltip">{licenseStatus.label}</span>
                                </div>
                              </td>
                              <td className="atti-actions">
                                <button 
                                  className="atti-action-btn" 
                                  title="Modifica"
                                  onClick={() => handleEdit(notary)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="atti-action-btn" 
                                  title={notary.license_active ? 'Blocca' : 'Sblocca'}
                                  onClick={() => handleToggleBlock(notary)}
                                >
                                  {notary.license_active ? <Unlock size={16} /> : <Lock size={16} />}
                                </button>
                                <button 
                                  className="atti-action-btn atti-action-delete" 
                                  title="Elimina"
                                  onClick={() => handleDelete(notary)}
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
      {editingNotary && (
        <NotaryEditModal
          notary={editingNotary}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modale Conferma */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', notary: null })}
        onConfirm={handleConfirmAction}
        type={confirmModal.type}
        title={
          confirmModal.type === 'delete' ? 'Elimina Notaio' :
          confirmModal.type === 'block' ? 'Blocca Notaio' :
          'Sblocca Notaio'
        }
        message={
          confirmModal.type === 'delete' 
            ? 'Questa azione è irreversibile. Tutti i dati associati al notaio verranno eliminati permanentemente.' 
            : confirmModal.type === 'block'
            ? 'Il notaio non potrà più accedere alla piattaforma e la sua vetrina sarà nascosta ai clienti.'
            : 'Il notaio potrà nuovamente accedere alla piattaforma e la sua vetrina sarà visibile ai clienti.'
        }
        itemName={confirmModal.notary?.studio_name}
        itemLabel="Notaio"
        confirmText={
          confirmModal.type === 'delete' ? 'Elimina' :
          confirmModal.type === 'block' ? 'Blocca' :
          'Sblocca'
        }
      />
    </div>
  )
}

export default NotariesManagement
