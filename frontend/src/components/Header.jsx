import React from 'react'
import { Search } from 'lucide-react'
import NotificationBell from './NotificationBell'
import AppointmentIndicator from './AppointmentIndicator'
import './Header.css'

function Header({ searchValue = '', onSearchChange, searchPlaceholder = 'Cerca appuntamenti...', user = null }) {
  const currentDate = new Date()
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' }
  const formattedDate = currentDate.toLocaleDateString('it-IT', options)
  const time = currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value)
    }
  }

  // Ottieni nome e cognome dell'utente
  const getUserName = () => {
    if (user?.cliente_profile) {
      // ✅ Usa full_name dal backend
      return user.cliente_profile.full_name || 
             `${user.cliente_profile.first_name || ''} ${user.cliente_profile.last_name || ''}`.trim() ||
             user.email?.split('@')[0] || 
             'Cliente'
    } else if (user?.notary_profile) {
      // Il notaio ha studio_name, non nome/cognome
      return user.notary_profile.studio_name || user.email?.split('@')[0] || 'Notaio'
    } else if (user?.admin_profile) {
      return user.admin_profile.full_name ||
             `${user.admin_profile.first_name || ''} ${user.admin_profile.last_name || ''}`.trim() ||
             user.email?.split('@')[0] ||
             'Admin'
    }
    return user?.email?.split('@')[0] || 'Utente'
  }

  // Ottieni avatar dell'utente
  const getUserAvatar = () => {
    let foto = null
    
    if (user?.cliente_profile?.foto) {
      foto = user.cliente_profile.foto
    } else if (user?.notary_profile?.foto || user?.notary_profile?.showcase_photo) {
      // Il notaio ha showcase_photo come foto profilo
      foto = user.notary_profile.foto || user.notary_profile.showcase_photo
    } else if (user?.admin_profile?.foto) {
      foto = user.admin_profile.foto
    }
    
    // Verifica che la foto sia valida (base64)
    if (foto && foto !== '' && foto.startsWith('data:image')) {
      return foto
    }
    
    return null
  }

  // Ottieni iniziali utente
  const getUserInitials = () => {
    const name = getUserName()
    if (!name) return 'U'
    
    const parts = name.split(' ').filter(p => p.length > 0)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const userAvatar = getUserAvatar()

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-location">
          <img src="/assets/Logo_San_Marino.svg" alt="San Marino" className="san-marino-icon" />
          <span>Repubblica di San Marino</span>
        </div>
        <div className="header-date">
          {formattedDate} - {time}
        </div>
      </div>

      <div className="header-center">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="header-right">
        <AppointmentIndicator />
        <NotificationBell />
        <div className="user-profile">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="User" 
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar-placeholder">
              <span>{getUserInitials()}</span>
            </div>
          )}
          <span className="user-name">{getUserName()}</span>
        </div>
      </div>
    </header>
  )
}

export default Header

