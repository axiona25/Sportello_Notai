import React, { useState } from 'react'
import { 
  FolderOpen, 
  FileText,
  Share2,
  Printer
} from 'lucide-react'
import AttoDetailModal from './AttoDetailModal'
import './AttiContent.css'

function AttiContent({ selectedFilter = null, searchValue = '' }) {
  const [selectedAtto, setSelectedAtto] = useState(null)
  const [attiList, setAttiList] = useState(null) // Per gestire aggiornamenti preferiti
  // Database completo degli atti con notaioId, clienteId e preferito
  const allAtti = [
    {
      id: 1,
      dataAtto: '15/01/2025',
      dataAttoTimestamp: new Date('2025-01-15').getTime(),
      tipologia: 'Compravendita Immobiliare',
      descrizione: 'Vendita appartamento via Garibaldi 42',
      soggettiCoinvolti: 'Misto',
      valore: '€ 250.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 1, // Francesco Spada
      clienteId: 1, // Antonio Rossi
      preferito: true
    },
    {
      id: 2,
      dataAtto: '10/01/2025',
      dataAttoTimestamp: new Date('2025-01-10').getTime(),
      tipologia: 'Costituzione Società',
      descrizione: 'Costituzione SRL Digital Solutions',
      soggettiCoinvolti: 'Persona Giuridica',
      valore: '€ 50.000',
      documenti: 'folder',
      stato: 'In lavorazione',
      statoColor: '#F59E0B',
      notaioId: 1, // Francesco Spada
      clienteId: 2, // Maria Verdi
      preferito: false
    },
    {
      id: 3,
      dataAtto: '05/01/2025',
      dataAttoTimestamp: new Date('2025-01-05').getTime(),
      tipologia: 'Testamento',
      descrizione: 'Testamento pubblico Rossi Mario',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 5.000',
      documenti: 'single',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 2, // Maria Rossi
      clienteId: 1, // Antonio Rossi
      preferito: true
    },
    {
      id: 4,
      dataAtto: '28/12/2024',
      dataAttoTimestamp: new Date('2024-12-28').getTime(),
      tipologia: 'Mutuo Ipotecario',
      descrizione: 'Mutuo ipotecario prima casa',
      soggettiCoinvolti: 'Misto',
      valore: '€ 180.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 3, // Giorgio Bianchi
      clienteId: 1, // Antonio Rossi
      preferito: false
    },
    {
      id: 5,
      dataAtto: '20/12/2024',
      dataAttoTimestamp: new Date('2024-12-20').getTime(),
      tipologia: 'Procura Speciale',
      descrizione: 'Procura per vendita immobile',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 1.500',
      documenti: 'single',
      stato: 'In lavorazione',
      statoColor: '#F59E0B',
      notaioId: 1, // Francesco Spada
      clienteId: 3, // Paolo Bianchi
      preferito: true
    },
    {
      id: 6,
      dataAtto: '15/12/2024',
      dataAttoTimestamp: new Date('2024-12-15').getTime(),
      tipologia: 'Donazione',
      descrizione: 'Donazione immobile a figlio',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 150.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 2, // Maria Rossi
      clienteId: 4, // Laura Neri
      preferito: false
    },
    {
      id: 7,
      dataAtto: '10/12/2024',
      dataAttoTimestamp: new Date('2024-12-10').getTime(),
      tipologia: 'Contratto di Locazione',
      descrizione: 'Locazione commerciale lungo termine',
      soggettiCoinvolti: 'Misto',
      valore: '€ 75.000',
      documenti: 'folder',
      stato: 'Concluso',
      statoColor: '#10B981',
      notaioId: 1, // Francesco Spada
      clienteId: 4, // Laura Neri
      preferito: false
    },
    {
      id: 8,
      dataAtto: '05/12/2024',
      dataAttoTimestamp: new Date('2024-12-05').getTime(),
      tipologia: 'Divisione Ereditaria',
      descrizione: 'Divisione patrimonio ereditario',
      soggettiCoinvolti: 'Persona Fisica',
      valore: '€ 320.000',
      documenti: 'folder',
      stato: 'In lavorazione',
      statoColor: '#F59E0B',
      notaioId: 3, // Giorgio Bianchi
      clienteId: 2, // Maria Verdi
      preferito: true
    }
  ]

  // Usa attiList se disponibile, altrimenti allAtti
  const baseAtti = attiList || allAtti

  // Filtra e ordina gli atti in base al filtro selezionato
  let atti = baseAtti

  if (selectedFilter) {
    if (selectedFilter.type === 'notaio') {
      atti = atti.filter(atto => atto.notaioId === selectedFilter.id)
    } else if (selectedFilter.type === 'cliente') {
      atti = atti.filter(atto => atto.clienteId === selectedFilter.id)
    } else if (selectedFilter.type === 'preferiti') {
      atti = atti.filter(atto => atto.preferito === true)
    } else if (selectedFilter.type === 'recenti') {
      // Ordina per data decrescente (più recenti prima)
      atti = [...atti].sort((a, b) => b.dataAttoTimestamp - a.dataAttoTimestamp)
    }
  }

  // Filtra in base alla ricerca
  if (searchValue && searchValue.trim() !== '') {
    const searchLower = searchValue.toLowerCase().trim()
    atti = atti.filter(atto => 
      atto.tipologia.toLowerCase().includes(searchLower) ||
      atto.descrizione.toLowerCase().includes(searchLower) ||
      atto.soggettiCoinvolti.toLowerCase().includes(searchLower) ||
      atto.stato.toLowerCase().includes(searchLower) ||
      atto.dataAtto.includes(searchLower)
    )
  }

  // Handler per aprire modale
  const handleAttoClick = (atto) => {
    setSelectedAtto(atto)
  }

  // Handler per chiudere modale
  const handleCloseModal = () => {
    setSelectedAtto(null)
  }

  // Handler per toggle preferito
  const handleTogglePreferito = (attoId) => {
    const updatedAtti = (attiList || allAtti).map(atto => 
      atto.id === attoId ? { ...atto, preferito: !atto.preferito } : atto
    )
    setAttiList(updatedAtti)
    
    // Aggiorna anche l'atto selezionato se corrisponde
    if (selectedAtto && selectedAtto.id === attoId) {
      setSelectedAtto({ ...selectedAtto, preferito: !selectedAtto.preferito })
    }
  }

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
                  <span 
                    className="atti-tipologia clickable"
                    onClick={() => handleAttoClick(atto)}
                    style={{ cursor: 'pointer' }}
                  >
                    {atto.tipologia}
                  </span>
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

      {/* Modale Dettaglio Atto */}
      {selectedAtto && (
        <AttoDetailModal
          atto={selectedAtto}
          onClose={handleCloseModal}
          onTogglePreferito={handleTogglePreferito}
        />
      )}
    </div>
  )
}

export default AttiContent

