import React from 'react'
import { FileText, Mail, PenTool, Video, Home, Building2, Gift, Briefcase, FileSignature, Scale, Settings } from 'lucide-react'
import './DeedDetailCard.css'

// Funzione per determinare l'icona in base al tipo di atto
const getActIcon = (description) => {
  const desc = description.toLowerCase()
  
  if (desc.includes('immobile') || desc.includes('casa') || desc.includes('appartamento') || desc.includes('rogito')) {
    return Home
  } else if (desc.includes('azienda') || desc.includes('società') || desc.includes('costituzione')) {
    return Building2
  } else if (desc.includes('donazione') || desc.includes('regalo')) {
    return Gift
  } else if (desc.includes('mutuo') || desc.includes('finanziamento')) {
    return Briefcase
  } else if (desc.includes('testamento') || desc.includes('successione')) {
    return FileSignature
  } else if (desc.includes('procura') || desc.includes('delega')) {
    return Scale
  } else {
    return FileText
  }
}

function DeedDetailCard() {
  const actType = "Immobile Via Novara 5"
  const ActIcon = getActIcon(actType)
  
  return (
    <div className="deed-card">
      <h3 className="deed-title">Atto Notarile - Rogito</h3>

      <div className="deed-section deed-section-notary">
        <p className="deed-notary-full">
          <span className="deed-notary-name">Notaio Francesco Spada</span>
          <span className="deed-notary-address"> - Piazza Cavour n.19 - Dogana (S. Marino)</span>
        </p>
      </div>

      <div className="deed-section">
        <p className="deed-property-full">
          <ActIcon size={16} className="deed-property-icon" />
          <span className="deed-property-name">Immobile Via Novara 5</span>
          <span className="deed-property-details"> - Mq. 156 | n.5 Stanze | 2º Piano</span>
        </p>
      </div>

      <div className="deed-section deed-section-parties">
        <p className="deed-party">Venditore: Sig. Antonio Rossi</p>
        <p className="deed-party">Acquirente: Sig. Francesco Lartini</p>
      </div>

      <div className="deed-section-services">
        <p className="deed-services-title">
          <Settings size={16} className="deed-services-icon" />
          <span>Servizi Disponibili</span>
        </p>
      </div>

      <div className="deed-status">
        <div className="status-item">
          <FileText size={16} />
          <span className="status-text-gray">Documenti Verificati (11/14)</span>
        </div>
        <div className="status-item">
          <Mail size={16} />
          <span className="status-text-blue">PEC Attiva</span>
        </div>
        <div className="status-item">
          <PenTool size={16} />
          <span className="status-text-blue">Firma Digitale Attiva</span>
        </div>
        <div className="status-item">
          <Video size={16} />
          <span className="status-text-blue">Video Conferenza Attiva</span>
        </div>
      </div>

      <button className="deed-btn">Entra</button>
    </div>
  )
}

export default DeedDetailCard

