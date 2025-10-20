import React from 'react'
import { 
  FileText, 
  ChevronDown, 
  Clock, 
  Star,
  FileCheck
} from 'lucide-react'
import './AttiSidebar.css'

function AttiSidebar({ selectedFilter, onFilterChange }) {
  // Mock notai - TODO: Recuperare da backend con foto reale
  const notai = [
    { 
      id: 1, 
      nome: 'Francesco', 
      cognome: 'Spada',
      foto: null, // Verrà caricata da Impostazioni Vetrina
      color: '#1668B0'
    },
    { 
      id: 2, 
      nome: 'Maria', 
      cognome: 'Rossi',
      foto: null,
      color: '#E91E63'
    },
    { 
      id: 3, 
      nome: 'Giorgio', 
      cognome: 'Bianchi',
      foto: null,
      color: '#2196F3'
    }
  ]

  // Genera iniziali dal nome e cognome
  const getInitials = (nome, cognome) => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
  }

  const handleTuttiClick = () => {
    onFilterChange(null)
  }

  const handleRecentiClick = () => {
    onFilterChange({ type: 'recenti' })
  }

  const handlePreferitiClick = () => {
    onFilterChange({ type: 'preferiti' })
  }

  const handleNotaioClick = (notaioId) => {
    onFilterChange({ type: 'notaio', id: notaioId })
  }

  return (
    <div className="atti-sidebar">
      {/* Tutti gli atti */}
      <div 
        className={`atti-menu-item ${selectedFilter === null ? 'active' : ''}`}
        onClick={handleTuttiClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <FileText size={20} strokeWidth={2} />
          <span>Tutti gli Atti</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} />
      </div>

      {/* Recenti */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'recenti' ? 'active' : ''}`}
        onClick={handleRecentiClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <Clock size={20} strokeWidth={2} />
          <span>Recenti</span>
        </div>
      </div>

      {/* Preferiti */}
      <div 
        className={`atti-menu-item ${selectedFilter?.type === 'preferiti' ? 'active' : ''}`}
        onClick={handlePreferitiClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="atti-menu-item-left">
          <Star size={20} strokeWidth={2} />
          <span>Preferiti</span>
        </div>
      </div>

      {/* Separatore */}
      <div className="atti-separator"></div>

      {/* NOTAI */}
      <div className="atti-section-header">NOTAI</div>
      
      {notai.map((notaio) => (
        <div 
          key={notaio.id} 
          className={`atti-menu-item ${selectedFilter?.type === 'notaio' && selectedFilter?.id === notaio.id ? 'active' : ''}`}
          onClick={() => handleNotaioClick(notaio.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="atti-menu-item-left">
            <div className="atti-notaio-avatar" style={{ background: notaio.foto ? 'transparent' : notaio.color }}>
              {notaio.foto ? (
                <img src={notaio.foto} alt={`${notaio.nome} ${notaio.cognome}`} className="atti-avatar-image" />
              ) : (
                <span>{getInitials(notaio.nome, notaio.cognome)}</span>
              )}
            </div>
            <span>{notaio.nome} {notaio.cognome}</span>
          </div>
        </div>
      ))}

      {/* Separatore */}
      <div className="atti-separator"></div>

      {/* Totale Atti */}
      <div className="atti-total">
        <div className="atti-total-header">
          <FileCheck size={20} strokeWidth={2} />
          <span>Totale Atti Notarili</span>
        </div>
        <div className="atti-total-bar">
          <div className="atti-total-bar-fill" style={{ width: '45%' }}></div>
        </div>
        <div className="atti-total-text">
          18 Atti su 40 totali
        </div>
      </div>
    </div>
  )
}

export default AttiSidebar

