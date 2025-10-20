import React from 'react'
import { Search, Bell } from 'lucide-react'
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
      return `${user.cliente_profile.nome} ${user.cliente_profile.cognome}`
    } else if (user?.notaio_profile) {
      return `${user.notaio_profile.nome} ${user.notaio_profile.cognome}`
    } else if (user?.admin_profile) {
      return `${user.admin_profile.nome} ${user.admin_profile.cognome}`
    }
    return user?.email?.split('@')[0] || 'Utente'
  }

  // Ottieni avatar dell'utente
  const getUserAvatar = () => {
    if (user?.cliente_profile?.foto) {
      return user.cliente_profile.foto
    } else if (user?.notaio_profile?.foto) {
      return user.notaio_profile.foto
    } else if (user?.admin_profile?.foto) {
      return user.admin_profile.foto
    }
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
  }

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
        <button className="notification-btn">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <img 
            src={getUserAvatar()} 
            alt="User" 
            className="user-avatar"
          />
          <span className="user-name">{getUserName()}</span>
        </div>
      </div>
    </header>
  )
}

export default Header

