import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  ChevronDown, 
  Clock, 
  Star,
  FileCheck
} from 'lucide-react'
import notaryProfileService from '../services/notaryProfileService'
import './AttiSidebar.css'

function AttiSidebar({ selectedFilter, onFilterChange }) {
  const [notai, setNotai] = useState([])
  const [loading, setLoading] = useState(true)

  // Lista degli atti (stesso del componente AttiContent)
  const allAtti = [
    { id: 1, notaioId: 1, notaioNome: 'Francesco Spada' },
    { id: 2, notaioId: 1, notaioNome: 'Francesco Spada' },
    { id: 3, notaioId: 2, notaioNome: 'Studio Notarile Maria Rossi' },
    { id: 4, notaioId: 3, notaioNome: 'Studio Notarile Laura Verdi' },
    { id: 5, notaioId: 1, notaioNome: 'Francesco Spada' },
    { id: 6, notaioId: 2, notaioNome: 'Studio Notarile Maria Rossi' },
    { id: 7, notaioId: 1, notaioNome: 'Francesco Spada' },
    { id: 8, notaioId: 3, notaioNome: 'Studio Notarile Laura Verdi' }
  ]

  // Carica solo i notai presenti negli atti
  useEffect(() => {
    const loadNotaries = async () => {
      try {
        // Estrai i notai unici dagli atti
        const notaiUnici = []
        const notaiIdSet = new Set()
        
        allAtti.forEach(atto => {
          if (!notaiIdSet.has(atto.notaioId)) {
            notaiIdSet.add(atto.notaioId)
            notaiUnici.push({
              id: atto.notaioId,
              nome: atto.notaioNome
            })
          }
        })
        
        // Carica i profili dal backend (senza cache per avere dati freschi)
        const allProfiles = await notaryProfileService.getAllProfiles(false)
        
        // Filtra solo i notai con licenza attiva
        const profiles = allProfiles.filter(profile => profile.license_active !== false)
        
        // Mappa i notai con le foto dal backend
        const mappedNotaries = notaiUnici.map((notaio, index) => {
          const search = notaio.nome.toLowerCase()
          const searchWords = search.split(' ')
          
          // Per "Studio Notarile X", usa prime 4 parole, altrimenti prime 2
          const numWords = search.startsWith('studio notarile') ? 4 : 2
          const normalizedSearch = searchWords.slice(0, numWords).join(' ')
          
          const profile = profiles.find(p => {
            const pName = (p.name || '').toLowerCase()
            
            // Match esatto
            if (pName === search) return true
            
            // Match parziale: confronta le prime N parole
            const pNameWords = pName.split(' ')
            const pNameStart = pNameWords.slice(0, numWords).join(' ')
            
            if (pNameStart === normalizedSearch) return true
            
            // Fuzzy match per cognomi simili (es: "Francesco Spada" vs "Francesco Spadi")
            if (searchWords.length === 2 && pNameWords.length === 2) {
              const [searchNome, searchCognome] = searchWords
              const [pNome, pCognome] = pNameWords
              
              if (searchNome === pNome) {
                // Confronta prime 4 lettere del cognome
                const cogStart = searchCognome.substring(0, 4)
                const pCogStart = pCognome.substring(0, 4)
                
                if (cogStart === pCogStart) return true
              }
            }
            
            return false
          })
          
          const finalName = profile?.name || notaio.nome
          
          return {
            id: notaio.id,
            nome: finalName,
            cognome: '',
            foto: profile?.photo || null,
            color: ['#1668B0', '#E91E63', '#2196F3'][index % 3]
          }
        })
        
        setNotai(mappedNotaries)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }

    loadNotaries()
  }, [])

  // Funzione per ricaricare i notai con cache invalidata
  const reloadNotariesData = async () => {
    try {
      const notaiUnici = []
      const notaiIdSet = new Set()
      
      allAtti.forEach(atto => {
        if (!notaiIdSet.has(atto.notaioId)) {
          notaiIdSet.add(atto.notaioId)
          notaiUnici.push({
            id: atto.notaioId,
            nome: atto.notaioNome
          })
        }
      })
      
      // Forza invalidazione cache prima di ricaricare
      notaryProfileService.clearCache()
      const allProfiles = await notaryProfileService.getAllProfiles(false)
      
      // Filtra solo i notai con licenza attiva
      const profiles = allProfiles.filter(profile => profile.license_active !== false)
      
      const mappedNotaries = notaiUnici.map((notaio, index) => {
        const search = notaio.nome.toLowerCase()
        const searchWords = search.split(' ')
        
        // Per "Studio Notarile X", usa prime 4 parole, altrimenti prime 2
        const numWords = search.startsWith('studio notarile') ? 4 : 2
        const normalizedSearch = searchWords.slice(0, numWords).join(' ')
        
        const profile = profiles.find(p => {
          const pName = (p.name || '').toLowerCase()
          
          // Match esatto
          if (pName === search) return true
          
          // Match parziale: confronta le prime N parole
          const pNameWords = pName.split(' ')
          const pNameStart = pNameWords.slice(0, numWords).join(' ')
          
          if (pNameStart === normalizedSearch) return true
          
          // Fuzzy match per cognomi simili (es: "Francesco Spada" vs "Francesco Spadi")
          if (searchWords.length === 2 && pNameWords.length === 2) {
            const [searchNome, searchCognome] = searchWords
            const [pNome, pCognome] = pNameWords
            
            if (searchNome === pNome) {
              // Confronta prime 4 lettere del cognome
              const cogStart = searchCognome.substring(0, 4)
              const pCogStart = pCognome.substring(0, 4)
              
              if (cogStart === pCogStart) return true
            }
          }
          
          return false
        })
        
        const finalName = profile?.name || notaio.nome
        
        return {
          id: notaio.id,
          nome: finalName,
          cognome: '',
          foto: profile?.photo || null,
          color: ['#1668B0', '#E91E63', '#2196F3'][index % 3]
        }
      })
      
      setNotai(mappedNotaries)
    } catch (error) {
    }
  }

  // Ascolta gli aggiornamenti dei profili notarili
  useEffect(() => {
    const handleUserUpdate = () => {
      reloadNotariesData()
    }

    const handleProfileUpdate = () => {
      reloadNotariesData()
    }

    // Listener per aggiornamenti da altre tab/browser tramite localStorage
    const handleStorageChange = (event) => {
      if (event.key === 'notaryProfileUpdatedTrigger') {
        reloadNotariesData()
      }
    }

    window.addEventListener('userUpdated', handleUserUpdate)
    window.addEventListener('notaryProfileUpdated', handleProfileUpdate)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
      window.removeEventListener('notaryProfileUpdated', handleProfileUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Genera iniziali dal nome completo
  const getInitials = (nome, cognome) => {
    const fullName = `${nome} ${cognome}`.trim()
    if (!fullName) return 'NN'
    
    const parts = fullName.split(' ').filter(p => p.length > 0)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
      
      {loading ? (
        <div className="atti-menu-item">
          <span>Caricamento notai...</span>
        </div>
      ) : notai.length === 0 ? (
        <div className="atti-menu-item">
          <span>Nessun notaio disponibile</span>
        </div>
      ) : (
        notai.map((notaio) => {
          const hasFoto = notaio.foto && notaio.foto !== '' && notaio.foto.startsWith('data:image')
          
          return (
        <div 
          key={notaio.id} 
          className={`atti-menu-item ${selectedFilter?.type === 'notaio' && selectedFilter?.id === notaio.id ? 'active' : ''}`}
          onClick={() => handleNotaioClick(notaio.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="atti-menu-item-left">
                <div className="atti-notaio-avatar" style={{ background: hasFoto ? 'transparent' : notaio.color }}>
                  {hasFoto ? (
                    <img src={notaio.foto} alt={notaio.nome} className="atti-avatar-image" />
                  ) : (
                    <span style={{ color: 'white', fontWeight: '600' }}>
                      {getInitials(notaio.nome, notaio.cognome)}
                    </span>
              )}
            </div>
                <span>{notaio.nome}</span>
          </div>
        </div>
          )
        })
      )}

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

