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
  // Mock clienti con avatar placeholder colorati
  const clienti = [
    { 
      id: 1, 
      nome: 'Antonio', 
      cognome: 'Rossi',
      avatar: 'AR',
      color: '#10B981'
    },
    { 
      id: 2, 
      nome: 'Maria', 
      cognome: 'Verdi',
      avatar: 'MV',
      color: '#8B5CF6'
    },
    { 
      id: 3, 
      nome: 'Paolo', 
      cognome: 'Bianchi',
      avatar: 'PB',
      color: '#F59E0B'
    },
    { 
      id: 4, 
      nome: 'Laura', 
      cognome: 'Neri',
      avatar: 'LN',
      color: '#EC4899'
    }
  ]

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
            <div className="atti-notaio-avatar" style={{ background: cliente.color }}>
              <span>{cliente.avatar}</span>
            </div>
            <span>{cliente.nome} {cliente.cognome}</span>
          </div>
        </div>
      ))}

      {/* Separatore */}
      <div className="atti-separator"></div>

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

