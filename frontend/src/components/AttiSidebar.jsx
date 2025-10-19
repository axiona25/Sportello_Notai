import React from 'react'
import { 
  FileText, 
  ChevronDown, 
  Clock, 
  Star,
  FileCheck
} from 'lucide-react'
import './AttiSidebar.css'

function AttiSidebar() {
  // Mock notai con avatar placeholder colorati
  const notai = [
    { 
      id: 1, 
      nome: 'Francesco', 
      cognome: 'Spada',
      avatar: 'FS',
      color: '#1668B0'
    },
    { 
      id: 2, 
      nome: 'Maria', 
      cognome: 'Rossi',
      avatar: 'MR',
      color: '#E91E63'
    },
    { 
      id: 3, 
      nome: 'Giorgio', 
      cognome: 'Bianchi',
      avatar: 'GB',
      color: '#2196F3'
    }
  ]

  return (
    <div className="atti-sidebar">
      {/* Tutti gli atti */}
      <div className="atti-menu-item">
        <div className="atti-menu-item-left">
          <FileText size={20} strokeWidth={2} />
          <span>Tutti gli Atti</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} />
      </div>

      {/* Recenti */}
      <div className="atti-menu-item">
        <div className="atti-menu-item-left">
          <Clock size={20} strokeWidth={2} />
          <span>Recenti</span>
        </div>
      </div>

      {/* NOTAI */}
      <div className="atti-section-header">NOTAI</div>
      
      {notai.map((notaio) => (
        <div key={notaio.id} className="atti-menu-item">
          <div className="atti-menu-item-left">
            <div className="atti-notaio-avatar" style={{ background: notaio.color }}>
              <span>{notaio.avatar}</span>
            </div>
            <span>{notaio.nome} {notaio.cognome}</span>
          </div>
        </div>
      ))}

      {/* Separatore */}
      <div className="atti-separator"></div>

      {/* Preferiti */}
      <div className="atti-menu-item">
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

