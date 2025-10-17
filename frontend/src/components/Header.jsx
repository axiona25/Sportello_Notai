import React from 'react'
import { Search, Bell, ChevronDown, MapPin } from 'lucide-react'
import './Header.css'

function Header({ searchValue = '', onSearchChange }) {
  const currentDate = new Date()
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' }
  const formattedDate = currentDate.toLocaleDateString('it-IT', options)
  const time = currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value)
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-date">
          {formattedDate} - {time}
        </div>
        <div className="header-location">
          <MapPin size={16} />
          <span>Repubblica di San Marino</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Cerca appuntamenti..." 
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
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
            alt="User" 
            className="user-avatar"
          />
          <span className="user-name">Robert Fox</span>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

export default Header

