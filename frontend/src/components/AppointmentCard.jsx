import React, { useState, useRef, useEffect } from 'react'
import { Clock, User, FileText, Phone, Video, Calendar as CalendarIcon, MapPin, MoreVertical, Edit2, XCircle, Trash2, Archive, FolderOpen, PenTool, Check } from 'lucide-react'
import './AppointmentCard.css'

function AppointmentCard({ 
  type, 
  title, 
  description, 
  location, 
  time, 
  deadline, 
  isActive, 
  onClick, 
  isSelected, 
  emptySlots = 1, 
  clientName,  // Per vista notaio: nome del cliente
  notaryName,  // Per vista cliente: nome del notaio
  appointmentType, 
  services = [],
  showActions = false,
  userRole = 'client',  // 'client' o 'notary'
  onApprove,  // ✅ Handler per approvare l'appuntamento (solo notaio)
  onEdit,
  onCancel,
  onDelete,
  appointmentData,
  status = 'provvisorio',  // ✅ Stato dell'appuntamento per il badge
  stato  // ✅ Campo alternativo dal backend (italiano)
}) {
  // ✅ Normalizza lo status: usa 'status' o 'stato' (dal backend) e converti in uppercase
  const normalizedStatus = (status || stato || 'provvisorio').toUpperCase()
  // ✅ Calcola la durata dell'appuntamento
  const calculateDuration = () => {
    // Prima prova a usare duration_minutes se disponibile
    if (appointmentData?.duration_minutes) {
      return appointmentData.duration_minutes
    }
    if (appointmentData?.rawData?.duration_minutes) {
      return appointmentData.rawData.duration_minutes
    }
    
    // Altrimenti calcola dalla stringa time (formato: "10:00 - 10:30")
    if (time && time.includes('-')) {
      try {
        const [start, end] = time.split('-').map(t => t.trim())
        const [startHour, startMin] = start.split(':').map(Number)
        const [endHour, endMin] = end.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return endMinutes - startMinutes
      } catch (e) {
        return null
      }
    }
    
    return null
  }
  
  const duration = calculateDuration()

  if (type === 'empty') {
    return (
      <div className="appointment-card empty" style={{ flexGrow: emptySlots }}>
        <CalendarIcon size={48} className="empty-icon" />
        <p className="empty-text">Nessun altro Appuntamento</p>
      </div>
    )
  }

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  const handleMenuToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleApprove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    if (onApprove) {
      onApprove(appointmentData)
    }
  }

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    if (onEdit) {
      onEdit(appointmentData)
    }
  }

  const handleCancel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    if (onCancel) {
      onCancel(appointmentData)
    }
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    if (onDelete) {
      onDelete(appointmentData)
    }
  }

  return (
    <div 
      className={`appointment-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${showMenu ? 'menu-open' : ''}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      data-appointment-id={appointmentData?.id || appointmentData?.rawData?.id}
    >
      {/* Menu Actions */}
      {showActions && (
        <div className="appointment-actions-menu" ref={menuRef}>
          <button 
            className="appointment-actions-btn"
            onClick={handleMenuToggle}
            title="Azioni"
          >
            <MoreVertical size={18} />
          </button>
          
          {showMenu && (
            <div className="appointment-actions-dropdown">
              {/* Approva solo per notai */}
              {userRole === 'notary' && onApprove && (
                <button className="action-item action-approve" onClick={handleApprove}>
                  <Check size={16} />
                  <span>Approva</span>
                </button>
              )}
              <button className="action-item action-edit" onClick={handleEdit}>
                <Edit2 size={16} />
                <span>Modifica</span>
              </button>
              {/* Annulla solo per notai */}
              {userRole === 'notary' && onCancel && (
                <button className="action-item action-cancel" onClick={handleCancel}>
                  <XCircle size={16} />
                  <span>Annulla</span>
                </button>
              )}
              <button className="action-item action-delete" onClick={handleDelete}>
                <Trash2 size={16} />
                <span>Elimina</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tipo Appuntamento / Tipologia Atto */}
      <h3 className="appointment-title">{appointmentType || title}</h3>
      
      {/* Cliente (per vista notaio) o Notaio (per vista cliente) */}
      {userRole === 'notary' && clientName && (
        <p className="appointment-client">
          <User size={14} />
          {clientName}
        </p>
      )}
      {userRole === 'client' && notaryName && (
        <p className="appointment-client">
          <User size={14} />
          {notaryName}
        </p>
      )}

      {/* Footer: Ora a sinistra, Servizi a destra */}
      <div className="appointment-footer">
        <div className="appointment-time-status">
          {time && (
            <div className="appointment-time">
              <Clock size={16} />
              <span>{time}</span>
              {/* ✅ Durata tra parentesi */}
              {duration && (
                <span className="appointment-duration">({duration} min)</span>
              )}
            </div>
          )}
          {/* ✅ Badge pallino stato - SEMPRE VISIBILE */}
          <div 
            className={`status-badge-dot status-${normalizedStatus.toLowerCase()}`}
            data-tooltip={
              normalizedStatus === 'PROVVISORIO' ? 'Da Confermare' :
              normalizedStatus === 'CONFERMATO' ? 'Confermato dal Notaio' :
              normalizedStatus === 'ANNULLATO' ? 'Annullato' :
              normalizedStatus === 'DOCUMENTI_IN_CARICAMENTO' ? 'In Lavorazione' :
              normalizedStatus === 'DOCUMENTI_IN_VERIFICA' ? 'Documenti in Verifica' :
              normalizedStatus === 'DOCUMENTI_PARZIALI' ? 'Alcuni Documenti Rifiutati' :
              normalizedStatus === 'DOCUMENTI_VERIFICATI' ? 'Verificato' :
              normalizedStatus === 'PRONTO_ATTO_VIRTUALE' ? 'Pronto per Atto' :
              normalizedStatus === 'IN_CORSO' ? 'In Corso' :
              normalizedStatus === 'COMPLETATO' ? 'Completato' :
              normalizedStatus === 'RIFIUTATO' ? 'Rifiutato' :
              normalizedStatus
            }
          ></div>
        </div>

        {/* ✅ Servizi selezionati - TUTTI E 6 (allineati con card dettaglio) */}
        {services && services.length > 0 && (
          <div className="appointment-services">
            {services.includes('presence') && <MapPin size={14} className="icon-service" title="In Presenza" />}
            {services.includes('video') && <Video size={14} className="icon-service" title="Video Chiamata" />}
            {services.includes('phone') && <Phone size={14} className="icon-service" title="Telefonata" />}
            {services.includes('conservation') && <Archive size={14} className="icon-service" title="Conservazione" />}
            {services.includes('shared_folder') && <FolderOpen size={14} className="icon-service" title="Cartella Condivisa" />}
            {services.includes('digital_signature') && <PenTool size={14} className="icon-service" title="Firma Digitale" />}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard

