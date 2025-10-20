import React from 'react'
import { 
  FolderOpen, 
  FileText,
  Share2,
  Printer
} from 'lucide-react'
import './AttiContent.css'

function AttiContent({ selectedFilter = null }) {
  // Database completo degli atti con notaioId e clienteId
  const allAtti = [
    {
      id: 1,
      dataAtto: '15/01/2025',
      tipologia: 'Compravendita Immobiliare',
      descrizione: 'Vendita appartamento via Garibaldi 42',
      soggettiCoinvolti: 'Misto',
      valore: '€ 250.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 1, // Francesco Spada
      clienteId: 1 // Antonio Rossi
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
      statoColor: '#F59E0B',
      notaioId: 1, // Francesco Spada
      clienteId: 2 // Maria Verdi
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
      statoColor: '#10B981',
      notaioId: 2, // Maria Rossi
      clienteId: 1 // Antonio Rossi
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
      statoColor: '#10B981',
      notaioId: 3, // Giorgio Bianchi
      clienteId: 1 // Antonio Rossi
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
      statoColor: '#F59E0B',
      notaioId: 1, // Francesco Spada
      clienteId: 3 // Paolo Bianchi
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
      statoColor: '#10B981',
      notaioId: 2, // Maria Rossi
      clienteId: 4 // Laura Neri
    },
    {
      id: 7,
      dataAtto: '10/12/2024',
      tipologia: 'Contratto di Locazione',
      descrizione: 'Locazione commerciale lungo termine',
      soggettiCoinvolti: 'Misto',
      valore: '€ 75.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 1, // Francesco Spada
      clienteId: 4 // Laura Neri
    },
    {
      id: 8,
      dataAtto: '05/12/2024',
      tipologia: 'Divisione Ereditaria',
      descrizione: 'Divisione patrimonio ereditario',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 320.000',
      documenti: 'folder',
      stato: 'In lavorazione',
      statoColor: '#F59E0B',
      notaioId: 3, // Giorgio Bianchi
      clienteId: 2 // Maria Verdi
    }
  ]

  // Filtra gli atti in base al filtro selezionato
  const atti = selectedFilter 
    ? allAtti.filter(atto => {
        if (selectedFilter.type === 'notaio') {
          return atto.notaioId === selectedFilter.id
        } else if (selectedFilter.type === 'cliente') {
          return atto.clienteId === selectedFilter.id
        }
        return true
      })
    : allAtti

  return (
    <div className="atti-content-main">
      {/* Atti Table */}
      <div className="atti-table-container">
        <table className="atti-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>DATA ATTO</th>
              <th style={{ textAlign: 'left' }}>TIPOLOGIA ATTO</th>
              <th style={{ textAlign: 'left' }}>DESCRIZIONE</th>
              <th style={{ textAlign: 'left' }}>SOGGETTI COINVOLTI</th>
              <th style={{ textAlign: 'left' }}>VALORE</th>
              <th style={{ textAlign: 'center' }}>DOCUMENTI</th>
              <th style={{ textAlign: 'center' }}>STATO</th>
              <th style={{ textAlign: 'center' }}>AZIONI</th>
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
                  <div className="atti-stato-dot-container">
                    <span 
                      className="atti-stato-dot" 
                      style={{ 
                        backgroundColor: atto.statoColor
                      }}
                    ></span>
                    <span className="atti-stato-tooltip">{atto.stato}</span>
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

