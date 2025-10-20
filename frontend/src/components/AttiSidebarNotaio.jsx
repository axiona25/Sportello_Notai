import React from 'react'
import { 
  FileText, 
  ChevronDown, 
  Clock, 
  Star,
  FileCheck
} from 'lucide-react'
import './AttiSidebar.css'

function AttiSidebarNotaio({ selectedFilter, onFilterChange }) {
  // Mock clienti - TODO: Recuperare da backend con foto reale dal profilo
  const clienti = [
    { 
      id: 1, 
      nome: 'Antonio', 
      cognome: 'Rossi',
      foto: null, // Verrà caricata da Profilo Cliente
      color: '#10B981'
    },
    { 
      id: 2, 
      nome: 'Maria', 
      cognome: 'Verdi',
      foto: null,
      color: '#8B5CF6'
    },
    { 
      id: 3, 
      nome: 'Paolo', 
      cognome: 'Bianchi',
      foto: null,
      color: '#F59E0B'
    },
    { 
      id: 4, 
      nome: 'Laura', 
      cognome: 'Neri',
      foto: null,
      color: '#EC4899'
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

  const handleClienteClick = (clienteId) => {
    onFilterChange({ type: 'cliente', id: clienteId })
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

      {/* CLIENTI */}
      <div className="atti-section-header">CLIENTI</div>
      
      {clienti.map((cliente) => (
        <div 
          key={cliente.id} 
          className={`atti-menu-item ${selectedFilter?.type === 'cliente' && selectedFilter?.id === cliente.id ? 'active' : ''}`}
          onClick={() => handleClienteClick(cliente.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="atti-menu-item-left">
            <div className="atti-notaio-avatar" style={{ background: cliente.foto ? 'transparent' : cliente.color }}>
              {cliente.foto ? (
                <img src={cliente.foto} alt={`${cliente.nome} ${cliente.cognome}`} className="atti-avatar-image" />
              ) : (
                <span>{getInitials(cliente.nome, cliente.cognome)}</span>
              )}
            </div>
            <span>{cliente.nome} {cliente.cognome}</span>
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
          <div className="atti-total-bar-fill" style={{ width: '65%' }}></div>
        </div>
        <div className="atti-total-text">
          52 Atti su 80 totali
        </div>
      </div>
    </div>
  )
}

export default AttiSidebarNotaio

