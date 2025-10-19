import React from 'react'
import { 
  Plus, 
  FileText, 
  ChevronDown, 
  Share2, 
  Clock, 
  Star, 
  Trash2,
  HardDrive
} from 'lucide-react'
import './DocumentiSidebar.css'

function DocumentiSidebar() {
  return (
    <div className="documenti-sidebar">
      {/* Pulsante Nuovo File */}
      <button className="documenti-btn-new">
        <Plus size={20} strokeWidth={2} />
        <span>Nuovo File</span>
      </button>

      {/* Tutti i files */}
      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <FileText size={20} strokeWidth={2} />
          <span>Tutti i files</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} />
      </div>

      {/* APP CONNESSE */}
      <div className="documenti-section-header">APP CONNESSE</div>
      
      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <div className="documenti-app-icon" style={{ background: '#FFC107' }}>
            <HardDrive size={16} strokeWidth={2} color="white" />
          </div>
          <span>Google Drive</span>
        </div>
      </div>

      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <div className="documenti-app-icon" style={{ background: '#0061FF' }}>
            <HardDrive size={16} strokeWidth={2} color="white" />
          </div>
          <span>Dropbox</span>
        </div>
      </div>

      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <div className="documenti-app-icon" style={{ background: '#0078D4' }}>
            <HardDrive size={16} strokeWidth={2} color="white" />
          </div>
          <span>One Drive</span>
        </div>
      </div>

      {/* Separatore */}
      <div className="documenti-separator"></div>

      {/* Files menu */}
      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <Share2 size={20} strokeWidth={2} />
          <span>Files Condivisi</span>
        </div>
      </div>

      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <Clock size={20} strokeWidth={2} />
          <span>Files Recenti</span>
        </div>
      </div>

      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <Star size={20} strokeWidth={2} />
          <span>Preferiti</span>
        </div>
      </div>

      <div className="documenti-menu-item">
        <div className="documenti-menu-item-left">
          <Trash2 size={20} strokeWidth={2} />
          <span>Eliminati</span>
        </div>
      </div>

      {/* Separatore */}
      <div className="documenti-separator"></div>

      {/* Storage */}
      <div className="documenti-storage">
        <div className="documenti-storage-header">
          <HardDrive size={20} strokeWidth={2} />
          <span>Spazio Totale</span>
        </div>
        <div className="documenti-storage-bar">
          <div className="documenti-storage-bar-fill" style={{ width: '24.7%' }}></div>
        </div>
        <div className="documenti-storage-text">
          3.71 GB di 15 GB totali
        </div>
      </div>
    </div>
  )
}

export default DocumentiSidebar

