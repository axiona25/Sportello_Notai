import React from 'react'
import { 
  FolderOpen, 
  FileText,
  Share2,
  Printer
} from 'lucide-react'
import './AttiContent.css'

function AttiContent() {
  const atti = [
    {
      id: 1,
      dataAtto: '15/01/2025',
      tipologia: 'Compravendita Immobiliare',
      descrizione: 'Vendita appartamento via Garibaldi 42',
      soggettiCoinvolti: 'Misto',
      valore: '€ 250.000',
      documenti: 'folder', // 'folder' o 'single'
      stato: 'Concluso',
      statoColor: '#10B981'
    },
    {
      id: 2,
      dataAtto: '10/01/2025',
      tipologia: 'Costituzione Società',
      descrizione: 'Costituzione SRL Digital Solutions',
      soggettiCoinvolti: 'Persona Giuridica',
      valore: '€ 50.000',
      documenti: 'folder',
      stato: 'In lavorazione',
      statoColor: '#F59E0B'
    },
    {
      id: 3,
      dataAtto: '05/01/2025',
      tipologia: 'Testamento',
      descrizione: 'Testamento pubblico Rossi Mario',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 5.000',
      documenti: 'single',
      stato: 'Concluso',
      statoColor: '#10B981'
    },
    {
      id: 4,
      dataAtto: '28/12/2024',
      tipologia: 'Mutuo Ipotecario',
      descrizione: 'Mutuo ipotecario prima casa',
      soggettiCoinvolti: 'Misto',
      valore: '€ 180.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981'
    },
    {
      id: 5,
      dataAtto: '20/12/2024',
      tipologia: 'Procura Speciale',
      descrizione: 'Procura per vendita immobile',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 1.500',
      documenti: 'single',
      stato: 'In lavorazione',
      statoColor: '#F59E0B'
    },
    {
      id: 6,
      dataAtto: '15/12/2024',
      tipologia: 'Donazione',
      descrizione: 'Donazione immobile a figlio',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 150.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981'
    }
  ]

  return (
    <div className="atti-content-main">
      {/* Atti Table */}
      <div className="atti-table-container">
        <table className="atti-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '110px' }}>DATA ATTO</th>
              <th style={{ textAlign: 'left', width: '180px' }}>TIPOLOGIA ATTO</th>
              <th style={{ textAlign: 'left' }}>DESCRIZIONE</th>
              <th style={{ textAlign: 'left', width: '150px' }}>SOGGETTI COINVOLTI</th>
              <th style={{ textAlign: 'left', width: '120px' }}>VALORE</th>
              <th style={{ textAlign: 'center', width: '100px' }}>DOCUMENTI</th>
              <th style={{ textAlign: 'center', width: '80px' }}>STATO</th>
              <th style={{ textAlign: 'center', width: '100px' }}>AZIONI</th>
            </tr>
          </thead>
          <tbody>
            {atti.map((atto) => (
              <tr key={atto.id} className="atti-table-row">
                <td>
                  <span className="atti-data">{atto.dataAtto}</span>
                </td>
                <td>
                  <span className="atti-tipologia">{atto.tipologia}</span>
                </td>
                <td>
                  <span className="atti-descrizione">{atto.descrizione}</span>
                </td>
                <td>
                  <span className="atti-soggetti">{atto.soggettiCoinvolti}</span>
                </td>
                <td>
                  <span className="atti-valore">{atto.valore}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="atti-doc-btn">
                    {atto.documenti === 'folder' ? (
                      <FolderOpen size={20} strokeWidth={2} color="#1668B0" />
                    ) : (
                      <FileText size={20} strokeWidth={2} color="#1668B0" />
                    )}
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="atti-stato-dot-container" title={atto.stato}>
                    <span 
                      className="atti-stato-dot" 
                      style={{ 
                        backgroundColor: atto.statoColor
                      }}
                    ></span>
                  </div>
                </td>
                <td>
                  <div className="atti-actions">
                    <button className="atti-action-btn" title="Condividi">
                      <Share2 size={18} strokeWidth={2} color="#6B7280" />
                    </button>
                    <button className="atti-action-btn" title="Stampa">
                      <Printer size={18} strokeWidth={2} color="#6B7280" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttiContent

