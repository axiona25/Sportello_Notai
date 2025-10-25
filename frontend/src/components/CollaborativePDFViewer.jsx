import React, { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, BookOpen, FileText, Highlighter, MessageSquare, PenTool, Save, Users, Eye, EyeOff, Settings, Download, Share, Printer, Search, RotateCw, Maximize, Copy } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './CollaborativePDFViewer.css'

// Configura worker di PDF.js - usa versione locale da /public
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

/**
 * Lettore PDF Collaborativo in Tempo Reale
 * 
 * Features:
 * - Visualizzazione PDF (singola o doppia pagina)
 * - Animazione flip libro
 * - Sincronizzazione realtime (scroll, zoom, pagina, evidenziazioni, note)
 * - Controllo accessi partecipanti (notaio decide chi vede)
 * - Firma digitale e conservazione
 */
function CollaborativePDFViewer({ document, onClose, userRole, participants = [], currentUser }) {
  // Stati visualizzazione PDF
  const [currentPage, setCurrentPage] = useState(1)
  const [displayPage, setDisplayPage] = useState(1) // Pagina visualizzata (cambia dopo animazione)
  const [totalPages, setTotalPages] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(130) // ✅ Zoom di default 130%
  const [viewMode, setViewMode] = useState('single') // ✅ Modalità singola pagina di default
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState('') // 'next' o 'prev' per animazione
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pdfFile, setPdfFile] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // Stati pan/drag per zoom
  const [isPanning, setIsPanning] = useState(false)
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 })
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  
  // Stati collaborazione
  const [activeParticipants, setActiveParticipants] = useState([])
  // ✅ Solo il NOTAIO vede il PDF di default, gli altri utenti devono aspettare l'autorizzazione
  const [sharedWith, setSharedWith] = useState(
    isNotary ? [currentUser?.id] : []
  )
  const [annotations, setAnnotations] = useState([]) // Evidenziazioni, note
  const [cursorPositions, setCursorPositions] = useState({}) // Posizioni cursori partecipanti
  
  // Stati UI
  const [showParticipants, setShowParticipants] = useState(true) // ✅ Sidebar partecipanti APERTA di default
  const [showToolsSidebar, setShowToolsSidebar] = useState(false)
  const [selectedTool, setSelectedTool] = useState('pointer') // 'pointer', 'highlight', 'note', 'signature'
  
  // Stati evidenziatore
  const [highlightColor, setHighlightColor] = useState('#FFEB3B') // Giallo di default
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [highlights, setHighlights] = useState([]) // Array di evidenziazioni
  
  // Colori evidenziatore disponibili
  const highlightColors = [
    { name: 'Giallo', color: '#FFEB3B' },
    { name: 'Verde', color: '#4CAF50' },
    { name: 'Azzurro', color: '#03A9F4' },
    { name: 'Rosa', color: '#E91E63' },
    { name: 'Arancione', color: '#FF9800' },
    { name: 'Viola', color: '#9C27B0' }
  ]
  
  // Refs
  const pdfContainerRef = useRef(null)
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  
  // WebSocket ref
  const wsRef = useRef(null)
  
  // Gestione cleanup pan globale (mouseup fuori container)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false)
      }
    }
    
    window.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isPanning])
  
  // Caricamento PDF e WebSocket
  useEffect(() => {
    console.log('📄 Caricamento PDF collaborativo:', document?.document_type_name)
    console.log('👤 Current User (da JWT/session):', currentUser)
    console.log('👤 User ID:', currentUser?.id)
    console.log('👤 User Role (prop):', userRole)
    console.log('👤 isNotary (calcolato):', isNotary)
    console.log('🔐 sharedWith iniziale:', isNotary ? [currentUser?.id] : [], '← Solo notaio vede PDF subito')
    
    // Carica il PDF - usa il file_path se disponibile, altrimenti placeholder
    if (document?.file_path) {
      setPdfFile(document.file_path)
    } else {
      // Usa un PDF di esempio per il testing
      setPdfFile('/sample.pdf') // TODO: Sostituire con file reale
    }
    
    // Inizializza WebSocket per sincronizzazione realtime
    // Cerca l'appointmentId in tutti i campi possibili
    const appointmentId = document?.appuntamento_id || 
                         document?.appointment_id || 
                         document?.id || 
                         (typeof document === 'object' && document.rawData?.id) ||
                         'demo'
    
    console.log('🔍 PDF Viewer - Appointment ID estratto:', appointmentId, 'da document:', document)
    
    const wsUrl = `ws://localhost:8000/ws/pdf/${appointmentId}/`
    
    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connesso per sincronizzazione PDF')
        // Invia join message
        wsRef.current.send(JSON.stringify({
          type: 'JOIN',
          userId: currentUser?.id,
          userName: currentUser?.name || currentUser?.email || 'Utente'
        }))
      }
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket chiuso:', event.code, event.reason)
      }
      
    } catch (error) {
      console.error('❌ Errore connessione WebSocket:', error)
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [document, currentUser])
  
  // Handler messaggi WebSocket
  const handleWebSocketMessage = (data) => {
    console.log('📨 WS Message:', data)
    
    switch (data.type) {
      case 'PAGE_CHANGE':
        if (!isNotary) setCurrentPage(data.page)
        break
      case 'ZOOM_CHANGE':
        if (!isNotary) setZoomLevel(data.zoom)
        break
      case 'VIEW_MODE_CHANGE':
        if (!isNotary) setViewMode(data.mode)
        break
      case 'ROTATION_CHANGE':
        if (!isNotary) setRotation(data.rotation)
        break
      case 'SCROLL':
        if (!isNotary && pdfContainerRef.current) {
          pdfContainerRef.current.scrollTop = data.scrollTop
          pdfContainerRef.current.scrollLeft = data.scrollLeft
        }
        break
      case 'ANNOTATION_ADD':
        setAnnotations(prev => [...prev, data.annotation])
        break
      case 'HIGHLIGHT_ADD':
        // Ricevi evidenziazione da altri partecipanti
        if (data.highlight && data.highlight.userId !== currentUser?.id) {
          setHighlights(prev => [...prev, data.highlight])
          console.log('✨ Evidenziazione ricevuta da:', data.highlight.userName)
        }
        break
      case 'ACCESS_CHANGE':
        // Gestisci cambio accessi - aggiorna lo stato locale
        console.log('👁️ Cambio accesso ricevuto:', data)
        if (data.participantId && typeof data.hasAccess === 'boolean') {
          setSharedWith(prev => {
            if (data.hasAccess) {
              // Aggiungi accesso
              return prev.includes(data.participantId) ? prev : [...prev, data.participantId]
            } else {
              // Rimuovi accesso
              return prev.filter(id => id !== data.participantId)
            }
          })
        }
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }
  
  // Callback quando PDF è caricato
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('✅ PDF caricato - Pagine totali:', numPages)
    setTotalPages(numPages)
  }
  
  // Handlers navigazione
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = viewMode === 'double' ? Math.max(1, currentPage - 2) : currentPage - 1
      setFlipDirection('prev') // Animazione verso sinistra
      setIsFlipping(true)
      setCurrentPage(newPage) // ✅ Nuova pagina (target) impostata subito
      
      // Dopo l'animazione, aggiorna la pagina visualizzata
      setTimeout(() => {
        setDisplayPage(newPage) // ✅ Aggiorna solo la pagina visualizzata dopo animazione
        setIsFlipping(false)
        setFlipDirection('')
        // Sincronizza con altri partecipanti
        broadcastAction({ type: 'PAGE_CHANGE', page: newPage })
      }, 1200) // Durata animazione libro naturale (1.2s)
    }
  }
  
  const handleNextPage = () => {
    const maxPage = viewMode === 'double' ? totalPages - 1 : totalPages
    if (currentPage < maxPage) {
      const newPage = viewMode === 'double' ? Math.min(maxPage, currentPage + 2) : currentPage + 1
      setFlipDirection('next') // Animazione verso destra
      setIsFlipping(true)
      setCurrentPage(newPage) // ✅ Nuova pagina (target) impostata subito
      
      // Dopo l'animazione, aggiorna la pagina visualizzata
      setTimeout(() => {
        setDisplayPage(newPage) // ✅ Aggiorna solo la pagina visualizzata dopo animazione
        setIsFlipping(false)
        setFlipDirection('')
        // Sincronizza con altri partecipanti
        broadcastAction({ type: 'PAGE_CHANGE', page: newPage })
      }, 1200) // Durata animazione libro naturale (1.2s)
    }
  }
  
  const handleZoomIn = () => {
    const newZoom = Math.min(200, zoomLevel + 10)
    setZoomLevel(newZoom)
    broadcastAction({ type: 'ZOOM_CHANGE', zoom: newZoom })
  }
  
  const handleZoomOut = () => {
    const newZoom = Math.max(50, zoomLevel - 10)
    setZoomLevel(newZoom)
    broadcastAction({ type: 'ZOOM_CHANGE', zoom: newZoom })
  }
  
  const toggleViewMode = () => {
    const newMode = viewMode === 'single' ? 'double' : 'single'
    setViewMode(newMode)
    // Aggiusta pagina corrente se necessario
    if (newMode === 'double' && currentPage % 2 === 0) {
      setCurrentPage(currentPage - 1)
    }
    broadcastAction({ type: 'VIEW_MODE_CHANGE', mode: newMode })
  }
  
  // Handlers partecipanti (solo notaio)
  const toggleParticipantAccess = (participantId) => {
    if (!isNotary) return
    
    setSharedWith(prev => {
      const newShared = prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
      
      // Notifica il partecipante del cambio di accesso
      broadcastAction({ 
        type: 'ACCESS_CHANGE', 
        participantId, 
        hasAccess: !prev.includes(participantId) 
      })
      
      return newShared
    })
  }
  
  // Broadcast azione a tutti i partecipanti
  const broadcastAction = (action) => {
    console.log('📡 Broadcast:', action)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        ...action, 
        userId: currentUser?.id, 
        userName: currentUser?.name || 'Utente',
        timestamp: Date.now() 
      }))
    } else {
      // Fallback: log se WebSocket non disponibile
      console.log('⚠️ WebSocket non disponibile, azione non sincronizzata:', action)
    }
  }
  
  // Handlers strumenti sidebar
  const handleRotate = () => {
    if (!isNotary) return
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    broadcastAction({ type: 'ROTATION_CHANGE', rotation: newRotation })
    console.log('🔄 Rotazione pagina:', newRotation)
  }
  
  const handleDownload = () => {
    if (pdfFile) {
      const link = document.createElement('a')
      link.href = pdfFile
      link.download = document?.document_type_name || 'documento.pdf'
      link.click()
      console.log('📥 Download PDF:', pdfFile)
    }
  }
  
  const handlePrint = () => {
    if (pdfFile) {
      window.print()
      console.log('🖨️ Stampa PDF')
    }
  }
  
  const handleCopyText = () => {
    console.log('📋 Copia testo selezionato')
    // Il testo può essere copiato normalmente dal PDF renderizzato
    document.execCommand('copy')
  }
  
  const handleShareLink = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl).then(() => {
      console.log('🔗 Link copiato negli appunti')
      alert('Link documento copiato negli appunti!')
    })
  }
  
  const handleFullscreen = () => {
    const element = document.querySelector('.pdf-viewer-container')
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        element.requestFullscreen()
      }
      console.log('⛶ Toggle fullscreen')
    }
  }
  
  const handleSearch = (text) => {
    setSearchText(text)
    console.log('🔍 Cerca:', text)
    // La ricerca sarà gestita automaticamente da react-pdf
  }
  
  // Handlers pan/drag per zoom
  const handleMouseDown = (e) => {
    // Pan solo se zoom > 100%, se notaio, e se non stiamo usando altri tool
    if (zoomLevel <= 100 || !isNotary || selectedTool !== 'pointer') return
    
    setIsPanning(true)
    setStartPanPosition({
      x: e.clientX,
      y: e.clientY
    })
    setScrollPosition({
      x: pdfContainerRef.current?.scrollLeft || 0,
      y: pdfContainerRef.current?.scrollTop || 0
    })
    
    // Previeni selezione testo durante drag
    e.preventDefault()
  }
  
  const handleMouseMove = (e) => {
    if (!isPanning || !pdfContainerRef.current) return
    
    const deltaX = e.clientX - startPanPosition.x
    const deltaY = e.clientY - startPanPosition.y
    
    // Aggiorna scroll position (inverti delta per movimento naturale)
    pdfContainerRef.current.scrollLeft = scrollPosition.x - deltaX
    pdfContainerRef.current.scrollTop = scrollPosition.y - deltaY
    
    // Broadcast ai partecipanti
    broadcastAction({ 
      type: 'SCROLL', 
      scrollTop: pdfContainerRef.current.scrollTop, 
      scrollLeft: pdfContainerRef.current.scrollLeft 
    })
  }
  
  const handleMouseUp = (e) => {
    setIsPanning(false)
    
    // Cattura selezione testo per evidenziazione
    if (selectedTool === 'highlight') {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      if (selectedText.length > 0) {
        try {
          // Ottieni la posizione del testo selezionato
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          
          // Trova l'elemento della pagina PDF corrente (non il container generale!)
          const pageElement = document.querySelector('.pdf-page:not(.flipping-page)')
          
          if (!pageElement) {
            console.warn('⚠️ Elemento pagina PDF non trovato')
            selection.removeAllRanges()
            return
          }
          
          const pageRect = pageElement.getBoundingClientRect()
          
          // Calcola posizione relativa ALLA PAGINA SPECIFICA (non al container)
          const x = ((rect.left - pageRect.left) / pageRect.width) * 100
          const y = ((rect.top - pageRect.top) / pageRect.height) * 100
          const width = (rect.width / pageRect.width) * 100
          const height = (rect.height / pageRect.height) * 100
          
          // Verifica che la selezione sia dentro la pagina
          if (x < 0 || y < 0 || x > 100 || y > 100) {
            console.warn('⚠️ Selezione fuori dalla pagina')
            selection.removeAllRanges()
            return
          }
          
          // Crea evidenziazione
          const newHighlight = {
            id: Date.now(),
            type: 'highlight',
            page: currentPage,
            text: selectedText,
            color: highlightColor,
            x,
            y,
            width,
            height,
            userId: currentUser?.id,
            userName: currentUser?.name || currentUser?.email || 'Utente',
            timestamp: Date.now()
          }
          
          setHighlights(prev => [...prev, newHighlight])
          
          // Sincronizza via WebSocket
          broadcastAction({ 
            type: 'HIGHLIGHT_ADD', 
            highlight: newHighlight 
          })
          
          console.log('✨ Evidenziazione creata sulla pagina', currentPage, ':', newHighlight)
          
          // Deseleziona il testo
          selection.removeAllRanges()
        } catch (error) {
          console.error('❌ Errore creazione evidenziazione:', error)
          selection.removeAllRanges()
        }
      }
    }
  }
  
  const handleMouseLeave = () => {
    // Se esci dal container mentre stai facendo pan, ferma il pan
    if (isPanning) {
      setIsPanning(false)
    }
  }
  
  // Handlers strumenti
  const handleScroll = (e) => {
    if (!isNotary || isPanning) return // Solo il notaio può guidare lo scroll, skip se in panning
    
    const scrollTop = e.target.scrollTop
    const scrollLeft = e.target.scrollLeft
    
    broadcastAction({ 
      type: 'SCROLL', 
      scrollTop, 
      scrollLeft 
    })
  }
  
  const handleAddAnnotation = (annotation) => {
    const newAnnotation = {
      id: Date.now(),
      type: selectedTool,
      page: currentPage,
      userId: currentUser?.id,
      userName: currentUser?.name || 'Utente',
      ...annotation,
      timestamp: Date.now()
    }
    
    setAnnotations(prev => [...prev, newAnnotation])
    broadcastAction({ type: 'ANNOTATION_ADD', annotation: newAnnotation })
  }
  
  const handleSign = () => {
    console.log('✍️ Firma documento')
    // TODO: Implementare firma digitale
    alert('Firma digitale - Da implementare')
  }
  
  const handleSave = () => {
    console.log('💾 Salvataggio e conservazione')
    // TODO: Implementare salvataggio e conservazione sostitutiva
    alert('Salvataggio e conservazione - Da implementare')
  }
  
  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-container">
        {/* Header */}
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <FileText size={20} />
            <h3>{document?.document_type_name || 'Documento'}</h3>
            <span className="pdf-viewer-badge">Condivisione Realtime</span>
          </div>
          
          <div className="pdf-viewer-header-controls">
            <button 
              className="pdf-viewer-btn"
              onClick={() => setShowParticipants(!showParticipants)}
              title="Gestisci partecipanti"
            >
              <Users size={18} />
            </button>
            <button 
              className={`pdf-viewer-btn ${showToolsSidebar ? 'active' : ''}`}
              onClick={() => setShowToolsSidebar(!showToolsSidebar)}
              title="Strumenti"
            >
              <Settings size={18} />
            </button>
            <button 
              className="pdf-viewer-btn pdf-viewer-btn-close"
              onClick={onClose}
              title="Chiudi"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="pdf-viewer-main">
          {/* Sidebar Partecipanti */}
          {showParticipants && (
            <div className="pdf-viewer-sidebar">
              <div className="pdf-sidebar-header">
                <Users size={16} />
                <h4>Partecipanti ({participants.filter(p => p.id !== currentUser?.id).length})</h4>
              </div>
              
              <div className="pdf-participants-list">
                {/* ✅ Filtra l'utente corrente dalla lista (il notaio non vede sé stesso) */}
                {participants
                  .filter(participant => participant.id !== currentUser?.id)
                  .map(participant => (
                    <div key={participant.id} className="pdf-participant-item">
                      <div className="pdf-participant-info">
                        <div className="pdf-participant-avatar">
                          {participant.name?.charAt(0) || 'U'}
                        </div>
                        <span className="pdf-participant-name">{participant.name}</span>
                      </div>
                      
                      {isNotary && (
                        <button
                          className={`pdf-participant-toggle ${sharedWith.includes(participant.id) ? 'active' : ''}`}
                          onClick={() => toggleParticipantAccess(participant.id)}
                          title={sharedWith.includes(participant.id) ? 'Nascondi documento' : 'Mostra documento'}
                        >
                          {sharedWith.includes(participant.id) ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      )}
                    </div>
                  ))
                }
              </div>
              
              {!isNotary && (
                <div className="pdf-sidebar-note">
                  <p>ℹ️ Il notaio guida la visualizzazione</p>
                </div>
              )}
            </div>
          )}
          
          {/* PDF Content */}
          <div className="pdf-viewer-content">
            {/* Wrapper per toolbar + pages */}
            <div className="pdf-content-wrapper">
              {/* Toolbar */}
              <div className="pdf-viewer-toolbar">
              {/* Navigazione */}
              <div className="pdf-toolbar-section">
                <button 
                  className="pdf-toolbar-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1 || !isNotary}
                  title="Pagina precedente"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <span className="pdf-page-info">
                  {viewMode === 'double' 
                    ? `${currentPage}-${Math.min(currentPage + 1, totalPages)} / ${totalPages}`
                    : `${currentPage} / ${totalPages}`
                  }
                </span>
                
                <button 
                  className="pdf-toolbar-btn"
                  onClick={handleNextPage}
                  disabled={currentPage >= (viewMode === 'double' ? totalPages - 1 : totalPages) || !isNotary}
                  title="Pagina successiva"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              
              {/* Zoom */}
              <div className="pdf-toolbar-section">
                <button 
                  className="pdf-toolbar-btn"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50 || !isNotary}
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                
                <span className="pdf-zoom-info">{zoomLevel}%</span>
                
                <button 
                  className="pdf-toolbar-btn"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200 || !isNotary}
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
              
              {/* View Mode */}
              <div className="pdf-toolbar-section">
                <button 
                  className={`pdf-toolbar-btn ${viewMode === 'single' ? 'active' : ''}`}
                  onClick={toggleViewMode}
                  disabled={!isNotary}
                  title="Modalità visualizzazione"
                >
                  {viewMode === 'single' ? <FileText size={18} /> : <BookOpen size={18} />}
                </button>
              </div>
              
              {/* Tools */}
              <div className="pdf-toolbar-section pdf-toolbar-tools">
                {/* Evidenziatore con picker colori */}
                <div className="pdf-highlight-tool">
                  <button 
                    className={`pdf-toolbar-btn ${selectedTool === 'highlight' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTool('highlight')
                      setShowColorPicker(!showColorPicker)
                    }}
                    title="Evidenzia testo"
                    style={{ 
                      background: selectedTool === 'highlight' ? highlightColor + '40' : undefined 
                    }}
                  >
                    <Highlighter size={18} style={{ color: selectedTool === 'highlight' ? highlightColor : undefined }} />
                  </button>
                  
                  {/* Picker colori */}
                  {showColorPicker && (
                    <div className="pdf-color-picker">
                      <div className="pdf-color-picker-header">
                        <span>Colore evidenziatore</span>
                        <button 
                          className="pdf-color-picker-close"
                          onClick={() => setShowColorPicker(false)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="pdf-color-list">
                        {highlightColors.map(({ name, color }) => (
                          <button
                            key={color}
                            className={`pdf-color-btn ${highlightColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setHighlightColor(color)
                              setSelectedTool('highlight')
                              console.log(`✨ Evidenziatore attivo - colore: ${name}`)
                            }}
                            title={name}
                          >
                            {highlightColor === color && <span className="pdf-color-check">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  className={`pdf-toolbar-btn ${selectedTool === 'note' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTool('note')
                    setShowColorPicker(false)
                  }}
                  title="Aggiungi nota"
                >
                  <MessageSquare size={18} />
                </button>
                
                <button 
                  className={`pdf-toolbar-btn ${selectedTool === 'signature' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTool('signature')
                    setShowColorPicker(false)
                  }}
                  title="Firma"
                >
                  <PenTool size={18} />
                </button>
              </div>
              
              {/* Actions */}
              <div className="pdf-toolbar-section">
                <button 
                  className="pdf-toolbar-btn pdf-toolbar-btn-primary"
                  onClick={handleSign}
                  title="Firma documento"
                >
                  <PenTool size={18} />
                  <span>Firma</span>
                </button>
                
                <button 
                  className="pdf-toolbar-btn pdf-toolbar-btn-success"
                  onClick={handleSave}
                  title="Salva e conserva"
                >
                  <Save size={18} />
                  <span>Salva</span>
                </button>
              </div>
            </div>
            
            {/* PDF Pages Container */}
            <div 
              ref={pdfContainerRef}
              className={`pdf-pages-container ${isFlipping ? 'flipping' : ''}`}
              onScroll={isNotary ? handleScroll : undefined}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ 
                cursor: selectedTool === 'pointer' 
                  ? (zoomLevel > 100 && isNotary 
                      ? (isPanning ? 'grabbing' : 'grab') 
                      : 'default')
                  : 'crosshair',
                userSelect: isPanning ? 'none' : 'auto'
              }}
            >
              <div className={`pdf-pages-wrapper ${viewMode} ${isFlipping ? `flip-${flipDirection}` : ''}`}>
                {/* ✅ Controllo accesso: mostra PDF solo se utente ha permesso */}
                {!sharedWith.includes(currentUser?.id) ? (
                  <div className="pdf-access-denied">
                    <EyeOff size={64} color="#9CA3AF" />
                    <h3>Documento non condiviso</h3>
                    <p>Il notaio non ha ancora abilitato la visualizzazione del documento.</p>
                    <p className="pdf-access-wait">Attendere che il notaio conceda l'accesso...</p>
                  </div>
                ) : pdfFile ? (
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error('❌ Errore caricamento PDF:', error)}
                    loading={
                      <div className="pdf-loading">
                        <div className="pdf-loading-spinner"></div>
                        <p>Caricamento PDF...</p>
                      </div>
                    }
                    error={
                      <div className="pdf-error">
                        <FileText size={48} />
                        <p>Errore caricamento PDF</p>
                        <button className="pdf-retry-btn" onClick={() => setPdfFile(document?.file_path)}>
                          Riprova
                        </button>
                      </div>
                    }
                  >
                    {viewMode === 'single' ? (
                      /* Pagina singola con effetto flip */
                      <div className="pdf-single-page-wrapper" style={{ transform: `scale(${zoomLevel / 100})`, position: 'relative' }}>
                        {/* Nuova pagina (sotto) - sempre visibile */}
                        <div className="pdf-page" style={{ position: 'relative', zIndex: 1 }}>
                          <div className="pdf-page-number">Pagina {currentPage} di {totalPages}</div>
                          <Page
                            pageNumber={currentPage}
                            rotate={rotation}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="pdf-page-render"
                          />
                          
                          {/* Evidenziazioni overlay - DENTRO la pagina */}
                          {!isFlipping && highlights
                            .filter(h => h.page === currentPage)
                            .map(highlight => (
                              <div 
                                key={highlight.id} 
                                className="pdf-highlight-overlay"
                                style={{ 
                                  position: 'absolute',
                                  left: highlight.x + '%', 
                                  top: highlight.y + '%',
                                  width: highlight.width + '%',
                                  height: highlight.height + '%',
                                  backgroundColor: highlight.color,
                                  opacity: 0.4,
                                  pointerEvents: 'none',
                                  zIndex: 5,
                                  mixBlendMode: 'multiply',
                                  borderRadius: '2px'
                                }}
                                title={`${highlight.userName}: "${highlight.text}"`}
                              />
                            ))
                          }
                        </div>
                        
                        {/* Pagina vecchia (sopra) - con animazione flip */}
                        {isFlipping && (
                          <div 
                            className={`pdf-page ${flipDirection === 'next' ? 'pdf-page-right' : 'pdf-page-left'} flipping-page`}
                            style={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              zIndex: 10 
                            }}
                          >
                            <div className="pdf-page-number">Pagina {displayPage} di {totalPages}</div>
                            <Page
                              pageNumber={displayPage}
                              rotate={rotation}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="pdf-page-render"
                            />
                          </div>
                        )}
                        
                        {/* Annotations overlay */}
                        {!isFlipping && annotations
                          .filter(a => a.page === currentPage)
                          .map(annotation => (
                            <div 
                              key={annotation.id} 
                              className={`pdf-annotation pdf-annotation-${annotation.type}`}
                              style={{ 
                                top: annotation.y + '%', 
                                left: annotation.x + '%' 
                              }}
                            >
                              {annotation.type === 'note' && (
                                <div className="pdf-annotation-note">
                                  <p>{annotation.text}</p>
                                  <span className="pdf-annotation-author">{annotation.userName}</span>
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      /* Doppia pagina (libro) - con effetto giro pagina realistico */
                      <div className="pdf-double-page-wrapper" style={{ transform: `scale(${zoomLevel / 100})` }}>
                        {/* Pagina sinistra */}
                        <div className={`pdf-page pdf-page-left ${isFlipping && flipDirection === 'prev' ? 'flipping-page' : ''}`}>
                          <div className="pdf-page-number">Pagina {currentPage}</div>
                          <Page
                            pageNumber={currentPage}
                            rotate={rotation}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="pdf-page-render"
                          />
                        </div>
                        
                        {/* Pagina destra */}
                        {currentPage < totalPages && (
                          <div className={`pdf-page pdf-page-right ${isFlipping && flipDirection === 'next' ? 'flipping-page' : ''}`}>
                            <div className="pdf-page-number">Pagina {currentPage + 1}</div>
                            <Page
                              pageNumber={currentPage + 1}
                              rotate={rotation}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="pdf-page-render"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Document>
                ) : (
                  <div className="pdf-no-file">
                    <FileText size={64} />
                    <p>Nessun documento da visualizzare</p>
                  </div>
                )}
              </div>
            </div>
            </div> {/* Chiusura pdf-content-wrapper */}
          
          {/* Sidebar Strumenti (a destra, solo icone) */}
          <div className={`pdf-tools-sidebar ${showToolsSidebar ? 'open' : ''}`}>
            <div className="pdf-tools-list">
              <button 
                className="pdf-tool-btn"
                onClick={() => setShowSearch(!showSearch)}
                data-tooltip="Cerca nel documento"
              >
                <Search size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handleDownload}
                data-tooltip="Scarica PDF"
              >
                <Download size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handlePrint}
                data-tooltip="Stampa"
              >
                <Printer size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handleRotate}
                data-tooltip="Ruota pagina"
                disabled={!isNotary}
              >
                <RotateCw size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handleCopyText}
                data-tooltip="Copia testo"
              >
                <Copy size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handleShareLink}
                data-tooltip="Condividi link"
              >
                <Share size={20} />
              </button>
              
              <button 
                className="pdf-tool-btn"
                onClick={handleFullscreen}
                data-tooltip="Schermo intero"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div> {/* Chiusura pdf-tools-sidebar */}
          
          {/* Barra ricerca (slide in dall'alto quando attiva) */}
          {showSearch && (
            <div className="pdf-search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Cerca nel documento..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="pdf-search-input"
              />
              <button 
                className="pdf-search-close"
                onClick={() => {
                  setShowSearch(false)
                  setSearchText('')
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          </div> {/* Chiusura pdf-viewer-content */}
        </div> {/* Chiusura pdf-viewer-main */}
      </div>
    </div>
  )
}

export default CollaborativePDFViewer

