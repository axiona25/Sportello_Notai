import React, { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, BookOpen, FileText, Highlighter, MessageSquare, PenTool, Save, Users, Eye, EyeOff, Settings, Download, Share, Printer, Search, RotateCw, Maximize, Copy, Type, Square, Circle, ArrowRight, Edit3 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './CollaborativePDFViewer.css'
import FabricCanvas from './FabricCanvas'

// ✅ Import viewer universali per tutti i formati
import ImageViewer from './viewers/ImageViewer'
import VideoViewer from './viewers/VideoViewer'
import AudioViewer from './viewers/AudioViewer'
import OfficeViewer from './viewers/OfficeViewer'
import { detectFileType, FileType, getFileTypeLabel, isOfficeDocument } from '../utils/fileTypeDetector'

// Configura worker di PDF.js - usa versione locale da /public
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

/**
 * Viewer Universale Collaborativo in Tempo Reale
 * 
 * Supporta:
 * - PDF (visualizzazione, annotazioni, firma digitale)
 * - Documenti Office (Word, Excel, PowerPoint) con editing real-time
 * - Immagini (JPEG, PNG, TIFF, GIF) con zoom e rotazione
 * - Video (MP4, MOV, AVI) con player HTML5
 * - Audio (MP3, WAV) con player HTML5
 * 
 * Features:
 * - Sincronizzazione realtime tra partecipanti
 * - Controllo accessi (notaio decide chi vede)
 * - Firma digitale e conservazione
 */
function CollaborativePDFViewer({ document, appointmentId, onClose, userRole, participants = [], currentUser }) {
  // ✅ REGOLA FISSA: detectFileType usa sempre file_path reale
  // Solo doc/docx/xls/xlsx → Collabora, tutto il resto → nostro viewer
  const fileType = detectFileType(document)
  const fileTypeLabel = getFileTypeLabel(fileType)
  
  console.log('🔍 Rilevamento tipo file:')
  console.log('   file_path:', document.file_path || document.file)
  console.log('   filename (originale):', document.filename)
  console.log('   fileType rilevato:', fileType, '- Label:', fileTypeLabel)
  console.log('   isOffice?', isOfficeDocument(fileType))
  console.log('📄 Documento completo:', document)
  
  // Stati visualizzazione PDF
  const [currentPage, setCurrentPage] = useState(1)
  const [displayPage, setDisplayPage] = useState(1) // Pagina visualizzata (cambia dopo animazione)
  const [totalPages, setTotalPages] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(
    // ✅ Cliente 135%, Notaio 130%
    userRole === 'notaio' || userRole === 'notary' || userRole === 'admin' ? 130 : 135
  )
  const [viewMode, setViewMode] = useState('single') // ✅ Modalità singola pagina di default
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState('') // 'next' o 'prev' per animazione
  const [underPages, setUnderPages] = useState({ left: null, right: null }) // ✅ Pagine sotto durante animazione
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pdfFile, setPdfFile] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // Stati pan/drag per zoom
  const [isPanning, setIsPanning] = useState(false)
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 })
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  
  // ✅ Determina ruolo utente PRIMA di usarlo negli stati
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  
  // Stati collaborazione
  const [activeParticipants, setActiveParticipants] = useState([])
  // ✅ Solo il NOTAIO vede il PDF di default, il cliente aspetta che il notaio gli dia accesso
  const [sharedWith, setSharedWith] = useState(
    isNotary ? [currentUser?.id] : []
  )
  const [annotations, setAnnotations] = useState([]) // Evidenziazioni, note
  const [cursorPositions, setCursorPositions] = useState({}) // Posizioni cursori partecipanti
  
  // Stati UI
  const [showParticipants, setShowParticipants] = useState(true) // ✅ Sidebar partecipanti APERTA di default
  const [showToolsSidebar, setShowToolsSidebar] = useState(false)
  const [selectedTool, setSelectedTool] = useState('pointer') // 'pointer', 'highlight', 'note', 'signature', 'text', 'draw', 'rectangle', 'circle', 'arrow'
  const [signatureEnabled, setSignatureEnabled] = useState(false) // ✅ Firma abilitata dal notaio
  const [currentDateTime, setCurrentDateTime] = useState(new Date()) // ✅ Data/ora in tempo reale per badge cliente
  
  // Stati Fabric.js
  const [fabricObjects, setFabricObjects] = useState({}) // Oggetti Fabric.js per pagina: { pageNumber: [objects] }
  const [toolOptions, setToolOptions] = useState({
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Arial',
    brushWidth: 2,
    strokeWidth: 2,
    highlightColor: 'rgba(255, 235, 59, 0.4)'
  })
  const fabricCanvasRefs = useRef({}) // Ref per canvas Fabric.js
  
  // Stati evidenziatore
  const [highlightColor, setHighlightColor] = useState('#FFEB3B') // Giallo di default
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [highlights, setHighlights] = useState([]) // Array di evidenziazioni
  
  // Stati editing testo
  const [textEdits, setTextEdits] = useState([]) // Array di modifiche al testo salvate
  const [activeTextEdit, setActiveTextEdit] = useState(null) // { page, x, y, originalText, text }
  
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
  
  // WebSocket ref
  const wsRef = useRef(null)
  
  // Debounce ref per salvataggio annotazioni
  const saveDebounceRef = useRef(null)
  
  // ✅ Aggiorna data/ora ogni secondo per il badge cliente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
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
    // ✅ NON creare WebSocket se non c'è un documento valido
    if (!document) {
      console.log('⏭️ PDF Viewer: Nessun documento, skip WebSocket init')
      return
    }
    
    console.log('📄 Caricamento PDF collaborativo:', document?.document_type_name)
    console.log('👤 Current User (da JWT/session):', currentUser)
    console.log('👤 User ID:', currentUser?.id)
    console.log('👤 User Role (prop):', userRole)
    console.log('👤 isNotary (calcolato):', isNotary)
    console.log('🔐 sharedWith iniziale:', isNotary ? [currentUser?.id] : [], '← Solo notaio vede PDF, cliente aspetta icona occhio')
    
    // Carica il PDF - usa il file_path se disponibile, altrimenti placeholder
    const pdfUrl = document?.file_path || document?.file || document?.document_url
    
    if (pdfUrl) {
      console.log('📁 PDF URL:', pdfUrl)
      console.log('🔧 setPdfFile chiamato con:', pdfUrl)
      setPdfFile(pdfUrl)
      console.log('✅ pdfFile dovrebbe essere impostato ora')
    } else {
      console.warn('⚠️ Nessun URL PDF trovato nel document!')
    }
    
    // Inizializza WebSocket per sincronizzazione realtime
    // Cerca l'appointmentId in tutti i campi possibili
    const appointmentId = document?.appuntamento_id || 
                         document?.appointment_id || 
                         document?.id || 
                         (typeof document === 'object' && document.rawData?.id)
    
    // ✅ NON creare WebSocket se non c'è un appointmentId valido
    if (!appointmentId) {
      console.log('⚠️ PDF Viewer: Nessun appointmentId valido, skip WebSocket init')
      return
    }
    
    console.log('🔍 PDF Viewer - Appointment ID estratto:', appointmentId, 'da document:', document)
    
    // ✅ NON ricreare WebSocket se è già connesso o in fase di connessione
    if (wsRef.current && 
        (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) && 
        wsRef.current.url.includes(appointmentId)) {
      console.log('⏭️ PDF Viewer: WebSocket già attivo (stato:', wsRef.current.readyState, '), skip ricreazione')
      // NON fare cleanup, lascia il WebSocket attivo
      return
    }
    
    // Chiudi WebSocket precedente se esiste ma è per un appointment diverso
    if (wsRef.current) {
      console.log('🔄 PDF Viewer: Chiudo WebSocket precedente per crearne uno nuovo')
      wsRef.current.close()
    }
    
    // Ottieni token JWT per autenticazione WebSocket
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    console.log('🔑 Token JWT trovato?', !!token, 'Length:', token?.length)
    const wsUrl = token 
      ? `ws://localhost:8000/ws/pdf/${appointmentId}/?token=${token}`
      : `ws://localhost:8000/ws/pdf/${appointmentId}/`
    console.log('🔌 PDF Viewer: Creo nuovo WebSocket')
    console.log('   URL (senza token):', `ws://localhost:8000/ws/pdf/${appointmentId}/?token=...`)
    
    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket PDF connesso per sincronizzazione')
        // Invia join message
        wsRef.current.send(JSON.stringify({
          type: 'JOIN',
          userId: currentUser?.id,
          userName: currentUser?.name || currentUser?.email || 'Utente',
          userRole: userRole
        }))
      }
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket PDF error:', error)
      }
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket PDF chiuso:', event.code, event.reason)
      }
      
    } catch (error) {
      console.error('❌ Errore connessione WebSocket PDF:', error)
    }
    
    // Cleanup: chiudi WebSocket quando componente viene smontato
    return () => {
      if (wsRef.current) {
        console.log('🧹 PDF Viewer: Cleanup - chiudo WebSocket')
        wsRef.current.close()
        wsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.appuntamento, document?.appointment_id, document?.id])
  
  // Handler messaggi WebSocket
  const handleWebSocketMessage = (data) => {
    console.log('📨 WS Message:', data)
    
    switch (data.type) {
      case 'PAGE_CHANGE':
        if (!isNotary) {
          console.log('📄 Cliente: cambio pagina ricevuto →', data.page)
          setCurrentPage(data.page)
        }
        break
      case 'PAGE_FLIP':
        // 📖 Sincronizza animazione volta pagina per il cliente
        if (!isNotary) {
          console.log('📖 Cliente riceve animazione volta pagina:', data)
          
          // Imposta pagine "sotto" per l'animazione
          if (data.underPages) {
            setUnderPages(data.underPages)
          }
          
          // Imposta direzione flip
          setFlipDirection(data.direction)
          
          // Avvia animazione
          setIsFlipping(true)
          setCurrentPage(data.newPage)
          setDisplayPage(data.newPage)
          
          // Termina animazione dopo 1.2s (stesso timing del notaio)
          setTimeout(() => {
            setIsFlipping(false)
            setFlipDirection('')
            setUnderPages({ left: null, right: null })
          }, 1200)
        }
        break
      // ✅ ZOOM_CHANGE rimosso - ogni utente controlla il suo zoom indipendentemente
      // case 'ZOOM_CHANGE':
      //   if (!isNotary) {
      //     console.log('🔍 Cliente: zoom ricevuto →', data.zoom + '%')
      //     setZoomLevel(data.zoom)
      //   }
      //   break
      case 'VIEW_MODE_CHANGE':
        if (!isNotary) {
          console.log('👀 Cliente: modalità vista ricevuta →', data.mode)
          setViewMode(data.mode)
        }
        break
      case 'ROTATION_CHANGE':
        if (!isNotary) {
          console.log('🔄 Cliente: rotazione ricevuta →', data.rotation + '°')
          setRotation(data.rotation)
        }
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
          setHighlights(prev => {
            const newHighlight = data.highlight
            // ✅ Assicura che abbia un groupId (se manca, usa l'id come groupId)
            if (!newHighlight.groupId) {
              newHighlight.groupId = newHighlight.id
            }
            
            // ✅ Controlla se si sovrappone a una esistente (stesso comportamento del merge locale)
            let merged = false
            const candidates = prev.filter(h => 
              h.page === newHighlight.page && 
              h.color === newHighlight.color
            )
            
            for (const existing of candidates) {
              // Calcola overlap
              const verticalOverlapStart = Math.max(existing.y, newHighlight.y)
              const verticalOverlapEnd = Math.min(existing.y + existing.height, newHighlight.y + newHighlight.height)
              const verticalOverlapAmount = Math.max(0, verticalOverlapEnd - verticalOverlapStart)
              
              const horizontalOverlapStart = Math.max(existing.x, newHighlight.x)
              const horizontalOverlapEnd = Math.min(existing.x + existing.width, newHighlight.x + newHighlight.width)
              const horizontalOverlapAmount = Math.max(0, horizontalOverlapEnd - horizontalOverlapStart)
              
              const minHeight = Math.min(existing.height, newHighlight.height)
              const minWidth = Math.min(existing.width, newHighlight.width)
              
              const verticalOverlapPercentage = minHeight > 0 ? (verticalOverlapAmount / minHeight) * 100 : 0
              const horizontalOverlapPercentage = minWidth > 0 ? (horizontalOverlapAmount / minWidth) * 100 : 0
              
              // Unisci se c'è overlap significativo
              if (verticalOverlapPercentage > 30 && horizontalOverlapPercentage > 30) {
                const minX = Math.min(existing.x, newHighlight.x)
                const minY = Math.min(existing.y, newHighlight.y)
                const maxX = Math.max(existing.x + existing.width, newHighlight.x + newHighlight.width)
                const maxY = Math.max(existing.y + existing.height, newHighlight.y + newHighlight.height)
                
                // Aggiorna esistente
                const updatedList = prev.map(h => 
                  h.id === existing.id ? {
                    ...existing,
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    text: (existing.text + ' ' + newHighlight.text).trim()
                  } : h
                )
                
                merged = true
                console.log('✨ Evidenziazione ricevuta e unita da:', newHighlight.userName)
                return updatedList
              }
            }
            
            // Se non unita, aggiungi come nuova
            console.log('✨ Evidenziazione ricevuta da:', newHighlight.userName, '(nuova)')
            return [...prev, newHighlight]
          })
        }
        break
      case 'HIGHLIGHT_REMOVE':
        // Ricevi rimozione evidenziazione singola da altri partecipanti (legacy)
        if (data.highlightId && data.userId !== currentUser?.id) {
          setHighlights(prev => prev.filter(h => h.id !== data.highlightId))
          console.log('🗑️ Evidenziazione rimossa da:', data.userId)
        }
        break
      case 'HIGHLIGHT_REMOVE_GROUP':
        // ✅ Ricevi rimozione gruppo evidenziazioni da altri partecipanti
        if (data.groupId && data.userId !== currentUser?.id) {
          setHighlights(prev => prev.filter(h => h.groupId !== data.groupId))
          console.log('🗑️ Gruppo evidenziazioni rimosso da:', data.userId)
        }
        break
      case 'TEXT_EDIT_ADD':
        // Ricevi modifica testo da altri partecipanti
        if (data.textEdit && data.textEdit.userId !== currentUser?.id) {
          setTextEdits(prev => [...prev, data.textEdit])
          console.log('✏️ Modifica testo ricevuta da:', data.textEdit.userName)
        }
        break
      case 'FABRIC_OBJECT_ADD':
        // Ricevi nuovo oggetto Fabric.js da altri partecipanti
        if (data.pageNumber && data.object && data.object.data) {
          setFabricObjects(prev => ({
            ...prev,
            [data.pageNumber]: [...(prev[data.pageNumber] || []), data.object.data]
          }))
          console.log('✨ Fabric - Oggetto aggiunto ricevuto:', data.object.type, 'su pagina', data.pageNumber)
        }
        break
      case 'FABRIC_OBJECT_MODIFY':
        // Ricevi modifica oggetto Fabric.js da altri partecipanti
        if (data.pageNumber && data.object && data.object.data) {
          setFabricObjects(prev => {
            const pageObjects = prev[data.pageNumber] || []
            const updatedObjects = pageObjects.map(obj => 
              obj.id === data.object.data.id ? data.object.data : obj
            )
            return {
              ...prev,
              [data.pageNumber]: updatedObjects
            }
          })
          console.log('✏️ Fabric - Oggetto modificato ricevuto:', data.object.data.id, 'su pagina', data.pageNumber)
        }
        break
      case 'FABRIC_OBJECT_REMOVE':
        // Ricevi rimozione oggetto Fabric.js da altri partecipanti
        if (data.pageNumber && data.objectId) {
          setFabricObjects(prev => {
            const pageObjects = prev[data.pageNumber] || []
            const filteredObjects = pageObjects.filter(obj => obj.id !== data.objectId)
            return {
              ...prev,
              [data.pageNumber]: filteredObjects
            }
          })
          console.log('🗑️ Fabric - Oggetto rimosso ricevuto:', data.objectId, 'su pagina', data.pageNumber)
        }
        break
      case 'ACCESS_CHANGE':
        // Gestisci cambio accessi - aggiorna lo stato locale
        console.log('👁️ [PDF WS] ACCESS_CHANGE ricevuto!')
        console.log('   - participantId:', data.participantId)
        console.log('   - hasAccess:', data.hasAccess)
        console.log('   - currentUser?.id:', currentUser?.id)
        console.log('   - Match?', data.participantId === currentUser?.id)
        console.log('   - sharedWith prima:', sharedWith)
        
        if (data.participantId && typeof data.hasAccess === 'boolean') {
          setSharedWith(prev => {
            console.log('   - sharedWith (prev):', prev)
            
            if (data.hasAccess) {
              // Aggiungi accesso
              const newShared = prev.includes(data.participantId) ? prev : [...prev, data.participantId]
              console.log('   ✅ Accesso CONCESSO - sharedWith dopo:', newShared)
              return newShared
            } else {
              // Rimuovi accesso
              const newShared = prev.filter(id => id !== data.participantId)
              console.log('   ❌ Accesso REVOCATO - sharedWith dopo:', newShared)
              return newShared
            }
          })
        }
        break
      case 'SIGNATURE_ENABLED':
        // Il notaio ha abilitato la firma
        if (!isNotary) {
          setSignatureEnabled(data.enabled)
          console.log('🖊️ Firma', data.enabled ? 'abilitata' : 'disabilitata', 'dal notaio')
        }
        break
      case 'CLOSE_PDF':
        // Il notaio ha chiuso il PDF per tutti
        console.log('❌ [PDF WS] CLOSE_PDF ricevuto dal notaio')
        console.log('   - documentId:', data.documentId)
        console.log('   - currentUser?.id:', currentUser?.id)
        console.log('   - isNotary:', isNotary)
        
        if (!isNotary) {
          console.log('✅ Cliente: chiudo PDF automaticamente')
          onClose()
        } else {
          console.log('⏭️ Notaio: ignoro CLOSE_PDF (l\'ho chiuso io stesso)')
        }
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }
  
  // ============================================
  // Funzioni per persistenza annotazioni
  // ============================================
  
  /**
   * Carica annotazioni salvate dal backend per questo documento
   */
  const loadAnnotationsFromBackend = async () => {
    // Usa document.document_id (ID ActDocument) se disponibile, altrimenti document.id
    const documentId = document?.document_id || document?.id
    
    if (!documentId || !isNotary) {
      // Solo il notaio carica le annotazioni salvate
      console.log('⏭️ Skip caricamento annotazioni:', { documentId, isNotary })
      return
    }
    
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      console.log(`📥 Caricamento annotazioni per documento: ${documentId}`)
      
      const response = await fetch(
        `http://localhost:8000/api/documents/annotations/by_document/${documentId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        // 404 è normale se il documento non ha ancora annotazioni
        if (response.status === 404) {
          console.log('ℹ️ Nessuna annotazione trovata per questo documento (404 - normale per documenti nuovi)')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const annotations = await response.json()
      console.log(`📥 Annotazioni caricate dal backend: ${annotations.length}`)
      
      // Organizza annotazioni per pagina
      const objectsByPage = {}
      annotations.forEach(annotation => {
        const pageNum = annotation.page_number
        if (!objectsByPage[pageNum]) {
          objectsByPage[pageNum] = []
        }
        objectsByPage[pageNum].push(annotation.fabric_object)
      })
      
      setFabricObjects(objectsByPage)
      console.log('✅ Annotazioni caricate e organizzate per pagina:', Object.keys(objectsByPage).length, 'pagine')
    } catch (error) {
      console.error('❌ Errore caricamento annotazioni:', error)
    }
  }
  
  /**
   * Salva annotazioni su backend (con debounce)
   */
  const saveAnnotationsToBackend = (pageNumber, objects) => {
    // Usa document.document_id (ID ActDocument) se disponibile, altrimenti document.id
    const documentId = document?.document_id || document?.id
    
    if (!documentId || !isNotary) {
      // Solo il notaio salva le annotazioni
      return
    }
    
    // Cancella timeout precedente
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current)
    }
    
    // Crea nuovo timeout (debounce 2 secondi)
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        console.log(`💾 Salvataggio annotazioni pagina ${pageNumber} per documento ${documentId}`)
        
        const response = await fetch(
          'http://localhost:8000/api/documents/annotations/bulk_save/',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              document_id: documentId,
              page_number: pageNumber,
              annotations: objects || []
            })
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        console.log(`💾 Annotazioni salvate: pagina ${pageNumber}, ${result.created_count} oggetti`)
      } catch (error) {
        console.error('❌ Errore salvataggio annotazioni:', error)
      }
    }, 2000) // Debounce di 2 secondi
  }
  
  // Carica annotazioni quando il PDF è aperto
  useEffect(() => {
    if (pdfFile && totalPages > 0) {
      loadAnnotationsFromBackend()
    }
  }, [pdfFile, totalPages])
  
  // Salva annotazioni quando cambiano (solo per notaio)
  useEffect(() => {
    if (!isNotary || !document?.id) return
    
    // Salva tutte le pagine modificate
    Object.keys(fabricObjects).forEach(pageNum => {
      saveAnnotationsToBackend(parseInt(pageNum), fabricObjects[pageNum])
    })
  }, [fabricObjects])
  
  // Callback quando PDF è caricato
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('✅ PDF caricato - Pagine totali:', numPages)
    setTotalPages(numPages)
  }
  
  // Handlers navigazione
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = viewMode === 'double' ? Math.max(1, currentPage - 2) : currentPage - 1
      
      // Prepara dati per animazione
      const underPagesData = viewMode === 'double' ? {
        left: currentPage,
        right: currentPage + 1 <= totalPages ? currentPage + 1 : null
      } : { left: null, right: null }
      
      // 📡 Invia animazione flip a tutti i partecipanti IMMEDIATAMENTE
      broadcastAction({ 
        type: 'PAGE_FLIP', 
        newPage: newPage,
        direction: 'prev',
        underPages: underPagesData,
        viewMode: viewMode
      })
      
      // ✅ Approccio naturale: cambia SUBITO e avvia animazione
      if (viewMode === 'double') {
        setUnderPages(underPagesData)
      }
      
      setFlipDirection('prev')
      setIsFlipping(true)
      setCurrentPage(newPage)
      setDisplayPage(newPage)
      
      setTimeout(() => {
        setIsFlipping(false)
        setFlipDirection('')
        setUnderPages({ left: null, right: null })
      }, 1200)
    }
  }
  
  const handleNextPage = () => {
    const maxPage = viewMode === 'double' ? totalPages - 1 : totalPages
    if (currentPage < maxPage) {
      const newPage = viewMode === 'double' ? Math.min(maxPage, currentPage + 2) : currentPage + 1
      
      // Prepara dati per animazione
      const underPagesData = viewMode === 'double' ? {
        left: currentPage,
        right: currentPage + 1 <= totalPages ? currentPage + 1 : null
      } : { left: null, right: null }
      
      // 📡 Invia animazione flip a tutti i partecipanti IMMEDIATAMENTE
      broadcastAction({ 
        type: 'PAGE_FLIP', 
        newPage: newPage,
        direction: 'next',
        underPages: underPagesData,
        viewMode: viewMode
      })
      
      // ✅ Approccio naturale: cambia SUBITO e avvia animazione
      if (viewMode === 'double') {
        setUnderPages(underPagesData)
      }
      
      setFlipDirection('next')
      setIsFlipping(true)
      setCurrentPage(newPage)
      setDisplayPage(newPage)
      
      setTimeout(() => {
        setIsFlipping(false)
        setFlipDirection('')
        setUnderPages({ left: null, right: null })
      }, 1200)
    }
  }
  
  // ✅ Zoom NON sincronizzato - ogni utente ha il suo zoom indipendente
  const handleZoom = (delta) => {
    const newZoom = Math.max(50, Math.min(200, zoomLevel + delta))
    setZoomLevel(newZoom)
    console.log(`🔍 Zoom locale ${isNotary ? 'notaio' : 'cliente'}:`, newZoom)
    // NON inviamo broadcast - zoom è locale per ogni utente
  }
  
  const handleZoomIn = () => {
    handleZoom(10)
  }
  
  const handleZoomOut = () => {
    handleZoom(-10)
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
  
  // ✅ Helper: Unisci evidenziazioni sovrapposte dello stesso colore
  const mergeOverlappingHighlights = (existingHighlights, newHighlight) => {
    const pageNumber = newHighlight.page
    const highlightColor = newHighlight.color
    
    // Trova evidenziazioni esistenti sulla stessa pagina con lo stesso colore
    const candidatesForMerge = existingHighlights.filter(h => 
      h.page === pageNumber && 
      h.color === highlightColor
    )
    
    let mergedIds = []
    let resultHighlight = newHighlight
    let hasMerged = false
    
    for (const existing of candidatesForMerge) {
      // ✅ Calcola overlap verticale REALE (sovrapposizione fisica)
      const verticalOverlapStart = Math.max(existing.y, resultHighlight.y)
      const verticalOverlapEnd = Math.min(existing.y + existing.height, resultHighlight.y + resultHighlight.height)
      const verticalOverlapAmount = Math.max(0, verticalOverlapEnd - verticalOverlapStart)
      const hasVerticalOverlap = verticalOverlapAmount > 0
      
      // ✅ Calcola overlap orizzontale REALE (sovrapposizione fisica)
      const horizontalOverlapStart = Math.max(existing.x, resultHighlight.x)
      const horizontalOverlapEnd = Math.min(existing.x + existing.width, resultHighlight.x + resultHighlight.width)
      const horizontalOverlapAmount = Math.max(0, horizontalOverlapEnd - horizontalOverlapStart)
      const hasHorizontalOverlap = horizontalOverlapAmount > 0
      
      // ✅ UNISCI SOLO se c'è sovrapposizione REALE sia verticale che orizzontale
      // E se la sovrapposizione è significativa (almeno 20% dell'area più piccola)
      const minHeight = Math.min(existing.height, resultHighlight.height)
      const minWidth = Math.min(existing.width, resultHighlight.width)
      
      const verticalOverlapPercentage = minHeight > 0 ? (verticalOverlapAmount / minHeight) * 100 : 0
      const horizontalOverlapPercentage = minWidth > 0 ? (horizontalOverlapAmount / minWidth) * 100 : 0
      
      // Unisci solo se c'è overlap significativo (>30% in entrambe le direzioni)
      const shouldMerge = hasVerticalOverlap && 
                          hasHorizontalOverlap && 
                          verticalOverlapPercentage > 30 && 
                          horizontalOverlapPercentage > 30
      
      if (shouldMerge) {
        // Calcola bounding box unificato che contiene entrambe le evidenziazioni
        const minX = Math.min(existing.x, resultHighlight.x)
        const minY = Math.min(existing.y, resultHighlight.y)
        const maxX = Math.max(existing.x + existing.width, resultHighlight.x + resultHighlight.width)
        const maxY = Math.max(existing.y + existing.height, resultHighlight.y + resultHighlight.height)
        
        // Crea evidenziazione unificata
        resultHighlight = {
          ...resultHighlight,
          id: existing.id, // Mantieni ID originale per coerenza
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          text: (existing.text + ' ' + resultHighlight.text).trim()
        }
        
        mergedIds.push(existing.id)
        hasMerged = true
        console.log('🔗 Evidenziazione unita (overlap:', verticalOverlapPercentage.toFixed(1) + '%v,', horizontalOverlapPercentage.toFixed(1) + '%h):', existing.id)
      } else {
        console.log('➕ Evidenziazione separata (overlap insufficiente:', verticalOverlapPercentage.toFixed(1) + '%v,', horizontalOverlapPercentage.toFixed(1) + '%h)')
      }
    }
    
    return { resultHighlight, mergedIds, hasMerged }
  }
  
  // Handlers partecipanti (solo notaio)
  const toggleParticipantAccess = (participantId) => {
    if (!isNotary) return
    
    console.log('👁️ Toggle accesso PDF - participantId:', participantId)
    console.log('   - sharedWith prima:', sharedWith)
    console.log('   - WebSocket readyState:', wsRef.current?.readyState)
    console.log('   - WebSocket OPEN:', WebSocket.OPEN)
    
    setSharedWith(prev => {
      const hadAccess = prev.includes(participantId)
      const newShared = hadAccess
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
      
      const newAccess = !hadAccess
      console.log('   - Nuovo accesso:', newAccess ? 'CONCESSO' : 'REVOCATO')
      console.log('   - sharedWith dopo:', newShared)
      
      // Notifica il partecipante del cambio di accesso
      broadcastAction({ 
        type: 'ACCESS_CHANGE', 
        participantId, 
        hasAccess: newAccess
      })
      
      return newShared
    })
  }
  
  // Broadcast azione a tutti i partecipanti
  const broadcastAction = (action) => {
    console.log('📡 Broadcast azione:', action.type)
    console.log('   - Dettagli:', action)
    console.log('   - WebSocket readyState:', wsRef.current?.readyState)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { 
        ...action, 
        userId: currentUser?.id, 
        userName: currentUser?.name || 'Utente',
        userRole: userRole,
        timestamp: Date.now() 
      }
      console.log('✅ Invio messaggio WebSocket:', message)
      wsRef.current.send(JSON.stringify(message))
      console.log('✅ Messaggio inviato con successo!')
    } else {
      console.error('❌ WebSocket NON disponibile!')
      console.error('   - readyState:', wsRef.current?.readyState)
      console.error('   - azione NON sincronizzata:', action)
    }
  }
  
  // Handler chiusura PDF (solo notaio può chiudere per tutti)
  const handleClose = () => {
    if (!isNotary) {
      console.log('⏭️ Cliente: non può chiudere il PDF autonomamente')
      return // Cliente NON può chiudere
    }
    
    console.log('❌ Notaio: chiusura PDF per tutti i partecipanti')
    
    // Invia messaggio a tutti i partecipanti per chiudere il PDF
    broadcastAction({ 
      type: 'CLOSE_PDF',
      documentId: document?.id
    })
    
    // Chiudi per il notaio stesso
    onClose()
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
    
    console.log('🖱️ MouseUp - selectedTool:', selectedTool)
    
    // Cattura selezione testo per evidenziazione
    if (selectedTool === 'highlight') {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      console.log('📝 Testo selezionato:', selectedText, '(lunghezza:', selectedText.length, ')')
      
      if (selectedText.length > 0) {
        try {
          // Ottieni la posizione del testo selezionato
          const range = selection.getRangeAt(0)
          
          // ✅ USA getClientRects() invece di getBoundingClientRect()
          // getClientRects() restituisce UN rettangolo per OGNI RIGA selezionata
          // Questo evita l'auto-estensione su selezioni multi-riga
          const rects = range.getClientRects()
          
          if (rects.length === 0) {
            console.warn('⚠️ Nessun rettangolo trovato per la selezione')
            selection.removeAllRanges()
            return
          }
          
          console.log('📐 Trovati', rects.length, 'rettangoli per la selezione')
          
          // Trova l'elemento della pagina PDF usando il primo rettangolo
          const firstRect = rects[0]
          let pageElement = window.document.elementFromPoint(
            firstRect.left + firstRect.width / 2, 
            firstRect.top + firstRect.height / 2
          )
          
          console.log('🔍 Elemento iniziale trovato:', pageElement?.className || pageElement?.tagName)
          
          // Trova il parent .pdf-page più vicino
          let depth = 0
          while (pageElement && depth < 15) {
            if (pageElement.classList && (
                pageElement.classList.contains('pdf-page') || 
                pageElement.classList.contains('pdf-page-left') || 
                pageElement.classList.contains('pdf-page-right')
            )) {
              break
            }
            pageElement = pageElement.parentElement
            depth++
          }
          
          if (!pageElement || depth >= 15) {
            console.warn('⚠️ Elemento pagina PDF non trovato')
            selection.removeAllRanges()
            return
          }
          
          console.log('📍 Pagina trovata:', pageElement.className)
          
          const pageRect = pageElement.getBoundingClientRect()
          
          // Determina il numero di pagina
          let pageNumber = currentPage
          if (viewMode === 'double' && pageElement.classList.contains('pdf-page-right')) {
            pageNumber = displayPage + 1
          } else if (viewMode === 'double' && pageElement.classList.contains('pdf-page-left')) {
            pageNumber = displayPage
          }
          
          // ✅ Crea UN'EVIDENZIAZIONE per OGNI RIGA selezionata
          const newHighlights = []
          const processedRects = [] // Per filtrare duplicati
          const groupId = Date.now() // ✅ ID gruppo per cancellare tutte le righe insieme
          
          for (let i = 0; i < rects.length; i++) {
            const rect = rects[i]
            
            // LOG dettagliato dei valori RAW
            console.log(`📏 Rettangolo ${i + 1} RAW:`, {
              left: rect.left.toFixed(2),
              top: rect.top.toFixed(2),
              width: rect.width.toFixed(2),
              height: rect.height.toFixed(2)
            })
            
            // Calcola posizione relativa per questa riga
            let x = ((rect.left - pageRect.left) / pageRect.width) * 100
            let y = ((rect.top - pageRect.top) / pageRect.height) * 100
            let width = (rect.width / pageRect.width) * 100
            let height = (rect.height / pageRect.height) * 100
            
            // Clamp tra 0 e 100
            x = Math.max(0, Math.min(100, x))
            y = Math.max(0, Math.min(100, y))
            
            // ✅ RIDUCI la larghezza per evitare auto-estensione del browser
            // Riduci del 3% per essere conservativi e evitare padding/margini
            width = width * 0.97
            
            // Assicurati che non superi i bordi
            if (x + width > 100) width = 100 - x
            if (y + height > 100) height = 100 - y
            
            // Salta rettangoli troppo piccoli (< 0.5%)
            if (width < 0.5 || height < 0.5) {
              console.log(`⏭️  Saltato rettangolo ${i + 1} troppo piccolo:`, { width, height })
              continue
            }
            
            // ✅ Filtra rettangoli duplicati (stessa posizione entro 1%)
            const isDuplicate = processedRects.some(processed => 
              Math.abs(processed.x - x) < 1 && 
              Math.abs(processed.y - y) < 1 &&
              Math.abs(processed.width - width) < 1
            )
            
            if (isDuplicate) {
              console.log(`⏭️  Saltato rettangolo ${i + 1} duplicato`)
              continue
            }
            
            processedRects.push({ x, y, width, height })
            
            // Crea evidenziazione per questa riga
            const highlight = {
              id: Date.now() + i, // ID unico per ogni riga
              groupId: groupId, // ✅ ID gruppo per cancellare tutte insieme
              type: 'highlight',
              page: pageNumber,
              text: selectedText, // Stesso testo per tutte le righe
              color: highlightColor,
              x,
              y,
              width,
              height,
              userId: currentUser?.id,
              userName: currentUser?.name || currentUser?.email || 'Utente',
              timestamp: Date.now()
            }
            
            newHighlights.push(highlight)
            console.log(`✅ Highlight riga ${i + 1}/${rects.length}:`, { x: x.toFixed(2), y: y.toFixed(2), width: width.toFixed(2), height: height.toFixed(2) })
          }
          
          if (newHighlights.length === 0) {
            console.warn('⚠️ Nessuna evidenziazione valida creata')
            selection.removeAllRanges()
            return
          }
          
          console.log('📊 Highlights prima:', highlights.length)
          
          // ✅ Aggiungi evidenziazioni con merge intelligente
          setHighlights(prev => {
            let updatedList = [...prev]
            
            // Per ogni nuova evidenziazione, controlla se si sovrappone a una esistente
            for (const newHighlight of newHighlights) {
              let merged = false
              
              // Trova evidenziazioni esistenti sulla stessa pagina con lo stesso colore
              const candidates = updatedList.filter(h => 
                h.page === newHighlight.page && 
                h.color === newHighlight.color
              )
              
              for (const existing of candidates) {
                // Calcola overlap verticale REALE
                const verticalOverlapStart = Math.max(existing.y, newHighlight.y)
                const verticalOverlapEnd = Math.min(existing.y + existing.height, newHighlight.y + newHighlight.height)
                const verticalOverlapAmount = Math.max(0, verticalOverlapEnd - verticalOverlapStart)
                
                // Calcola overlap orizzontale REALE
                const horizontalOverlapStart = Math.max(existing.x, newHighlight.x)
                const horizontalOverlapEnd = Math.min(existing.x + existing.width, newHighlight.x + newHighlight.width)
                const horizontalOverlapAmount = Math.max(0, horizontalOverlapEnd - horizontalOverlapStart)
                
                const minHeight = Math.min(existing.height, newHighlight.height)
                const minWidth = Math.min(existing.width, newHighlight.width)
                
                const verticalOverlapPercentage = minHeight > 0 ? (verticalOverlapAmount / minHeight) * 100 : 0
                const horizontalOverlapPercentage = minWidth > 0 ? (horizontalOverlapAmount / minWidth) * 100 : 0
                
                // ✅ UNISCI se c'è overlap significativo (>30% in entrambe le direzioni)
                if (verticalOverlapPercentage > 30 && horizontalOverlapPercentage > 30) {
                  // Calcola bounding box unificato
                  const minX = Math.min(existing.x, newHighlight.x)
                  const minY = Math.min(existing.y, newHighlight.y)
                  const maxX = Math.max(existing.x + existing.width, newHighlight.x + newHighlight.width)
                  const maxY = Math.max(existing.y + existing.height, newHighlight.y + newHighlight.height)
                  
                  // Aggiorna l'evidenziazione esistente invece di aggiungerne una nuova
                  const index = updatedList.indexOf(existing)
                  updatedList[index] = {
                    ...existing,
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    text: (existing.text + ' ' + newHighlight.text).trim()
                  }
                  
                  merged = true
                  console.log('🔗 Evidenziazione unita (overlap:', verticalOverlapPercentage.toFixed(1) + '%v,', horizontalOverlapPercentage.toFixed(1) + '%h)')
                  break
                }
              }
              
              // Se non è stata unita, aggiungila come nuova
              if (!merged) {
                updatedList.push(newHighlight)
              }
            }
            
            console.log('📊 Highlights dopo:', updatedList.length, `(+${newHighlights.length} elaborati)`)
            return updatedList
          })
          
          // Sincronizza TUTTE le evidenziazioni via WebSocket
          newHighlights.forEach(highlight => {
            broadcastAction({ 
              type: 'HIGHLIGHT_ADD', 
              highlight 
            })
          })
          
          console.log(`✨ ${newHighlights.length} evidenziazioni create sulla pagina`, pageNumber)
          
          // Deseleziona il testo
          selection.removeAllRanges()
        } catch (error) {
          console.error('❌ Errore creazione evidenziazione:', error)
          selection.removeAllRanges()
        }
      }
    }
    
    // ✏️ EDITING TESTO: Click su PDF per aprire input box
    if (selectedTool === 'textEdit' && isNotary) {
      const clickX = e.clientX
      const clickY = e.clientY
      
      console.log('✏️ Click per modifica testo a coordinate:', clickX, clickY)
      
      // Trova l'elemento cliccato
      let targetElement = window.document.elementFromPoint(clickX, clickY)
      
      // Trova il text span di react-pdf per catturare il testo originale
      let textSpan = targetElement
      let originalText = ''
      let depth = 0
      
      while (textSpan && depth < 10) {
        if (textSpan.tagName === 'SPAN' && textSpan.closest('.textLayer')) {
          originalText = textSpan.textContent || ''
          console.log('📄 Testo originale trovato:', originalText)
          break
        }
        textSpan = textSpan.parentElement
        depth++
      }
      
      // Trova la pagina PDF corrente
      let pageElement = targetElement
      depth = 0
      
      while (pageElement && depth < 10) {
        if (pageElement.classList && (
          pageElement.classList.contains('pdf-page') ||
          pageElement.classList.contains('pdf-page-left') ||
          pageElement.classList.contains('pdf-page-right')
        )) {
          break
        }
        pageElement = pageElement.parentElement
        depth++
      }
      
      if (!pageElement) {
        console.warn('⚠️ Impossibile trovare elemento pagina PDF')
        return
      }
      
      // Calcola coordinate relative alla pagina
      const pageRect = pageElement.getBoundingClientRect()
      const relativeX = ((clickX - pageRect.left) / pageRect.width) * 100
      const relativeY = ((clickY - pageRect.top) / pageRect.height) * 100
      
      console.log(`📍 Click su pagina ${currentPage} a (${relativeX.toFixed(1)}%, ${relativeY.toFixed(1)}%)`)
      
      // Apri input box per modifica
      setActiveTextEdit({
        page: currentPage,
        x: relativeX,
        y: relativeY,
        originalText: originalText,
        text: originalText // Inizializza con testo originale
      })
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
  
  // ✅ Funzione per abilitare/disabilitare firma (solo notaio)
  const toggleSignatureEnabled = () => {
    if (!isNotary) return
    
    const newState = !signatureEnabled
    setSignatureEnabled(newState)
    
    // Broadcast ai clienti
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SIGNATURE_ENABLED',
        enabled: newState,
        userId: currentUser?.id,
        userName: currentUser?.name || currentUser?.email || 'Notaio'
      }))
      console.log('📡 Firma', newState ? 'abilitata' : 'disabilitata', 'per i clienti')
    }
  }
  
  // ✅ Rendering condizionale basato su tipo file
  // Se NON è un PDF, usa i viewer specializzati
  if (fileType !== FileType.PDF) {
    return (
      <div className="pdf-viewer-overlay">
        <div className="pdf-viewer-container">
          {/* Header universale */}
          <div className="pdf-viewer-header">
            <div className="pdf-viewer-title">
              <FileText size={20} />
              <h3>{document?.document_type_name || fileTypeLabel}</h3>
            </div>
            
            {/* Badge con data e ora in tempo reale CENTRATO */}
            <span className="pdf-viewer-badge pdf-viewer-badge-center">
              {currentDateTime.toLocaleDateString('it-IT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {currentDateTime.toLocaleTimeString('it-IT')}
            </span>
            
            <div className="pdf-viewer-header-controls">
              {isNotary ? (
                <button 
                  className="pdf-viewer-btn pdf-viewer-btn-close"
                  onClick={handleClose}
                  title="Chiudi"
                >
                  <X size={20} />
                </button>
              ) : (
                /* ✅ Cliente: Controlli zoom indipendenti */
                <>
                  <button 
                    className="pdf-viewer-btn"
                    onClick={() => setZoomLevel(prev => Math.max(prev - 10, 50))}
                    disabled={zoomLevel <= 50}
                    title="Zoom out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  
                  <span className="pdf-zoom-indicator">{zoomLevel}%</span>
                  
                  <button 
                    className="pdf-viewer-btn"
                    onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
                    disabled={zoomLevel >= 200}
                    title="Zoom in"
                  >
                    <ZoomIn size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Viewer specifico per tipo file */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {fileType === FileType.IMAGE && (
              <ImageViewer 
                document={document}
                onClose={handleClose}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}
            
            {fileType === FileType.VIDEO && (
              <VideoViewer 
                document={document}
                onClose={handleClose}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}
            
            {fileType === FileType.AUDIO && (
              <AudioViewer 
                document={document}
                onClose={handleClose}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}
            
            {(fileType === FileType.OFFICE_WORD || 
              fileType === FileType.OFFICE_EXCEL || 
              fileType === FileType.OFFICE_POWERPOINT) && (
              <OfficeViewer 
                document={document}
                appointmentId={appointmentId}
                onClose={handleClose}
                userRole={userRole}
                currentUser={currentUser}
                fileType={fileType}
              />
            )}
            
            {fileType === FileType.UNKNOWN && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <FileText size={64} color="#6B7280" />
                <h3 style={{ fontFamily: 'Poppins', color: '#1F2937' }}>
                  Formato file non supportato
                </h3>
                <p style={{ fontFamily: 'Inter', color: '#6B7280' }}>
                  {document?.filename || 'Documento'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // ✅ Per i PDF, mantieni tutto il codice esistente
  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-container">
        {/* Header - Stile identico per notaio e cliente */}
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <FileText size={20} />
            <h3>{document?.document_type_name || 'Documento'}</h3>
          </div>
          
          {/* ✅ Badge con data e ora in tempo reale CENTRATO */}
          <span className="pdf-viewer-badge pdf-viewer-badge-center">
            {currentDateTime.toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {currentDateTime.toLocaleTimeString('it-IT')}
          </span>
          
          <div className="pdf-viewer-header-controls">
            {isNotary ? (
              <>
                <button 
                  className="pdf-viewer-btn"
                  onClick={() => setShowParticipants(!showParticipants)}
                  title="Gestisci partecipanti"
                >
                  <Users size={18} />
                </button>
                
                <button 
                  className="pdf-viewer-btn pdf-viewer-btn-close"
                  onClick={handleClose}
                  title="Chiudi"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              /* ✅ Cliente: Controlli zoom indipendenti */
              <>
                <button 
                  className="pdf-viewer-btn"
                  onClick={() => handleZoom(-10)}
                  disabled={zoomLevel <= 50}
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                
                <span className="pdf-zoom-indicator">{zoomLevel}%</span>
                
                <button 
                  className="pdf-viewer-btn"
                  onClick={() => handleZoom(10)}
                  disabled={zoomLevel >= 200}
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="pdf-viewer-main">
          {/* Sidebar Partecipanti - SOLO per notaio */}
          {isNotary && showParticipants && (
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
              {/* Toolbar - SOLO per notaio */}
              {isNotary && (
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
                              // ✅ Cambia colore e assicurati che evidenziatore sia attivo
                              setHighlightColor(color)
                              setSelectedTool('highlight')
                              console.log(`✨ Evidenziatore attivo - colore: ${name}`)
                              // ✅ Chiudi automaticamente il menu colori
                              setShowColorPicker(false)
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
                
                {/* Gomma per cancellare evidenziazioni */}
                <button 
                  className={`pdf-toolbar-btn ${selectedTool === 'eraser' ? 'active' : ''}`}
                  onClick={() => {
                    // ✅ Toggle: se già attiva, disattiva; altrimenti attiva
                    if (selectedTool === 'eraser') {
                      setSelectedTool('pointer')
                      console.log('🔴 Gomma disattivata')
                    } else {
                      setSelectedTool('eraser')
                      console.log('🧹 Gomma attivata')
                    }
                    setShowColorPicker(false)
                  }}
                  title="Cancella evidenziazione"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20H7L3 16c-1-1-1-2.5 0-3.5L10.5 5c1-1 2.5-1 3.5 0l6 6c1 1 1 2.5 0 3.5L16 19"/>
                    <path d="M12 12l-3 3"/>
                    <path d="M15 9l-3 3"/>
                  </svg>
                </button>
                
                {/* Rotazione pagina - Solo notaio */}
                {isNotary && (
                  <button 
                    className="pdf-toolbar-btn"
                    onClick={handleRotate}
                    title={`Ruota pagina (${rotation}°)`}
                  >
                    <RotateCw size={18} />
                  </button>
                )}
                
                {/* Tool modifica testo */}
                <button 
                  className={`pdf-toolbar-btn ${selectedTool === 'textEdit' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedTool === 'textEdit') {
                      setSelectedTool('pointer')
                    } else {
                      setSelectedTool('textEdit')
                      console.log('✏️ Modalità editing testo attivata - Clicca sul PDF per modificare')
                    }
                    setShowColorPicker(false)
                    setActiveTextEdit(null) // Chiudi eventuali input box aperti
                  }}
                  title="Modifica testo"
                >
                  <Type size={18} />
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
              )}
              
              {/* ✅ Pulsante firma per cliente - SOLO se abilitato dal notaio */}
              {!isNotary && signatureEnabled && (
                <div className="pdf-client-signature-bar">
                  <button 
                    className="pdf-toolbar-btn pdf-toolbar-btn-primary pdf-client-sign-btn"
                    onClick={handleSign}
                    title="Firma documento"
                  >
                    <PenTool size={20} />
                    <span>Firma Documento</span>
                  </button>
                </div>
              )}
            
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
                  : selectedTool === 'highlight' || selectedTool === 'textEdit'
                    ? 'text'  // ✅ Cursore testo per evidenziatore
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
                ) : !pdfFile ? (
                  /* ✅ Loading state mentre pdfFile si sta caricando */
                  (() => {
                    console.log('⏳ Rendering loading state - pdfFile è:', pdfFile)
                    return (
                      <div className="pdf-loading">
                        <div className="pdf-loading-spinner"></div>
                        <p>Caricamento documento...</p>
                      </div>
                    )
                  })()
                ) : (
                  (() => {
                    console.log('📄 Rendering Document - pdfFile è:', pdfFile)
                    return <Document
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
                      <div className="pdf-single-page-wrapper">
                        {/* Nuova pagina (sotto) - sempre visibile */}
                        <div className="pdf-page" style={{ position: 'relative', zIndex: 1 }}>
                          <div className="pdf-page-number">Pagina {currentPage} di {totalPages}</div>
                          <Page
                            pageNumber={currentPage}
                            scale={zoomLevel / 100}
                            rotate={rotation}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="pdf-page-render"
                          />
                          
                          {/* ✨ Fabric.js Canvas per editing interattivo */}
                          {isNotary && (
                            <FabricCanvas
                              pageNumber={currentPage}
                              width={595} // A4 width in points
                              height={842} // A4 height in points
                              scale={zoomLevel / 100}
                              selectedTool={selectedTool}
                              toolOptions={toolOptions}
                              isReadOnly={false}
                              initialObjects={fabricObjects[currentPage] || []}
                              onObjectAdded={(obj) => {
                                console.log('📝 Fabric - Oggetto aggiunto:', obj)
                                // Sincronizza via WebSocket
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_ADD',
                                  pageNumber: currentPage,
                                  object: obj
                                })
                              }}
                              onObjectModified={(obj) => {
                                console.log('✏️ Fabric - Oggetto modificato:', obj)
                                // Sincronizza via WebSocket
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_MODIFY',
                                  pageNumber: currentPage,
                                  object: obj
                                })
                              }}
                              onObjectRemoved={(obj) => {
                                console.log('🗑️ Fabric - Oggetto rimosso:', obj)
                                // Sincronizza via WebSocket
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_REMOVE',
                                  pageNumber: currentPage,
                                  objectId: obj.id
                                })
                              }}
                            />
                          )}
                          
                          {/* Input box per editing testo - DENTRO la pagina */}
                          {activeTextEdit && activeTextEdit.page === currentPage && (
                            <div
                              className="pdf-text-edit-input"
                              style={{
                                position: 'absolute',
                                left: activeTextEdit.x + '%',
                                top: activeTextEdit.y + '%',
                                zIndex: 1000
                              }}
                            >
                              <textarea
                                autoFocus
                                value={activeTextEdit.text}
                                onChange={(e) => setActiveTextEdit({ ...activeTextEdit, text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setActiveTextEdit(null)
                                  } else if (e.key === 'Enter' && e.ctrlKey) {
                                    // Salva con Ctrl+Enter
                                    const newEdit = {
                                      ...activeTextEdit,
                                      id: Date.now(),
                                      userId: currentUser?.id,
                                      userName: currentUser?.name || currentUser?.email || 'Notaio',
                                      timestamp: Date.now()
                                    }
                                    setTextEdits(prev => [...prev, newEdit])
                                    broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                    setActiveTextEdit(null)
                                    console.log('✅ Modifica testo salvata')
                                  }
                                }}
                                style={{
                                  width: '300px',
                                  minHeight: '60px',
                                  padding: '8px',
                                  fontSize: '14px',
                                  border: '2px solid #2196F3',
                                  borderRadius: '4px',
                                  resize: 'both',
                                  fontFamily: 'Arial, sans-serif'
                                }}
                                placeholder="Modifica il testo..."
                              />
                              <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => {
                                    const newEdit = {
                                      ...activeTextEdit,
                                      id: Date.now(),
                                      userId: currentUser?.id,
                                      userName: currentUser?.name || currentUser?.email || 'Notaio',
                                      timestamp: Date.now()
                                    }
                                    setTextEdits(prev => [...prev, newEdit])
                                    broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                    setActiveTextEdit(null)
                                    console.log('✅ Modifica testo salvata')
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Salva (Ctrl+Enter)
                                </button>
                                <button
                                  onClick={() => setActiveTextEdit(null)}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#ccc',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Annulla (Esc)
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Testi modificati salvati */}
                          {textEdits
                            .filter(edit => edit.page === currentPage)
                            .map(edit => (
                              <div
                                key={edit.id}
                                className="pdf-text-edit-overlay"
                                style={{
                                  position: 'absolute',
                                  left: edit.x + '%',
                                  top: edit.y + '%',
                                  fontSize: '14px',
                                  color: '#000',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  zIndex: 998,
                                  maxWidth: '300px',
                                  wordWrap: 'break-word'
                                }}
                                title={`${edit.userName}: "${edit.originalText}" → "${edit.text}"`}
                              >
                                {edit.text}
                              </div>
                            ))
                          }
                          
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
                                  pointerEvents: selectedTool === 'eraser' ? 'auto' : 'none',
                                  zIndex: 999,
                                  mixBlendMode: 'multiply',
                                  borderRadius: '2px',
                                  cursor: selectedTool === 'eraser' ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPjxwYXRoIGQ9Ik0yNSAyNkg5TDQgMjFDMi41IDE5LjUgMi41IDE3IDQgMTUuNUwxMy41IDZDMTUgNC41IDE3LjUgNC41IDE5IDZMMjYgMTNDMjcuNSAxNC41IDI3LjUgMTcgMjYgMTguNUwyMSAyNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE2IDE2TDEyIDIwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9nPjxkZWZzPjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+PGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+PGZlT2Zmc2V0IGR5PSIyIi8+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMSIvPjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiIHJlc3VsdD0ic2hhcGUiLz48L2ZpbHRlcj48L2RlZnM+PC9zdmc+") 16 16, crosshair' : 'default'
                                }}
                                title={selectedTool === 'eraser' ? 'Clicca per cancellare' : `${highlight.userName}: "${highlight.text}"`}
                                onClick={(e) => {
                                  if (selectedTool === 'eraser' && isNotary) {
                                    e.stopPropagation()
                                    // ✅ Rimuovi TUTTE le evidenziazioni dello stesso gruppo (tutte le righe)
                                    const groupToRemove = highlight.groupId
                                    setHighlights(prev => prev.filter(h => h.groupId !== groupToRemove))
                                    // Sincronizza via WebSocket (rimuovi gruppo intero)
                                    broadcastAction({ 
                                      type: 'HIGHLIGHT_REMOVE_GROUP', 
                                      groupId: groupToRemove 
                                    })
                                    console.log('🗑️ Gruppo evidenziazioni rimosso:', groupToRemove)
                                  }
                                }}
                              />
                            ))
                          }
                          
                          {/* ✅ Overlay NON PIÙ NECESSARIO - Il testo si modifica direttamente */}
                          {false && !isFlipping && (
                            <>
                              {/* Copri il testo originale con un rettangolo bianco */}
                              <div 
                                style={{ 
                                  position: 'absolute',
                                  left: activeTextEdit.x + '%',
                                  top: activeTextEdit.y + '%',
                                  width: activeTextEdit.width + '%',
                                  height: activeTextEdit.height + '%',
                                  backgroundColor: '#ffffff',
                                  zIndex: 999,
                                  pointerEvents: 'none'
                                }}
                              />
                              
                              {/* Editor testo */}
                              <div 
                                className="pdf-text-edit-overlay"
                                style={{ 
                                  position: 'absolute',
                                  left: activeTextEdit.x + '%',
                                  top: (activeTextEdit.y - 1) + '%', // Leggermente sopra
                                  zIndex: 1000,
                                  minWidth: Math.max(activeTextEdit.width * 1.5, 200) + 'px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                  border: '2px solid #2196F3',
                                  borderRadius: '4px',
                                  padding: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                              >
                              <textarea
                                autoFocus
                                placeholder="Modifica il testo..."
                                value={activeTextEdit.text}
                                onChange={(e) => {
                                  setActiveTextEdit(prev => ({
                                    ...prev,
                                    text: e.target.value
                                  }))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    // Annulla editing
                                    setActiveTextEdit(null)
                                  } else if (e.key === 'Enter' && e.ctrlKey) {
                                    // Salva (Ctrl+Enter)
                                    const edit = { ...activeTextEdit }
                                    setTextEdits(prev => [...prev, edit])
                                    // Sincronizza via WebSocket
                                    broadcastAction({ 
                                      type: 'TEXT_EDIT_ADD', 
                                      textEdit: edit 
                                    })
                                    console.log('✅ Modifica testo salvata:', edit)
                                    setActiveTextEdit(null)
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  border: 'none',
                                  outline: 'none',
                                  fontFamily: 'Arial, sans-serif',
                                  fontSize: activeTextEdit.fontSize + 'px',
                                  color: activeTextEdit.color,
                                  resize: 'both',
                                  backgroundColor: 'transparent'
                                }}
                              />
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginTop: '8px',
                                justifyContent: 'flex-end'
                              }}>
                                <button
                                  onClick={() => setActiveTextEdit(null)}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Annulla
                                </button>
                                <button
                                  onClick={() => {
                                    const edit = { ...activeTextEdit }
                                    setTextEdits(prev => [...prev, edit])
                                    // Sincronizza via WebSocket
                                    broadcastAction({ 
                                      type: 'TEXT_EDIT_ADD', 
                                      textEdit: edit 
                                    })
                                    console.log('✅ Modifica testo salvata:', edit)
                                    setActiveTextEdit(null)
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    border: 'none',
                                    borderRadius: '3px',
                                    backgroundColor: '#2196F3',
                                    color: '#fff',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Salva
                                </button>
                              </div>
                            </div>
                            </>
                          )}
                          
                          {/* Render di tutte le modifiche testo salvate */}
                          {!isFlipping && textEdits
                            .filter(edit => edit.page === currentPage)
                            .map(edit => (
                              <React.Fragment key={edit.id}>
                                {/* Copri il testo originale */}
                                <div 
                                  style={{ 
                                    position: 'absolute',
                                    left: edit.x + '%',
                                    top: edit.y + '%',
                                    width: (edit.width || 20) + '%',
                                    height: (edit.height || 2) + '%',
                                    backgroundColor: '#ffffff',
                                    zIndex: 997,
                                    pointerEvents: 'none'
                                  }}
                                />
                                
                                {/* Mostra il testo modificato CON GLI STILI ORIGINALI */}
                                <div 
                                  className="pdf-text-edit-display"
                                  style={{ 
                                    position: 'absolute',
                                    left: edit.x + '%', 
                                    top: edit.y + '%',
                                    // ✅ USA gli stili originali del PDF
                                    fontFamily: edit.fontFamily || 'Arial, sans-serif',
                                    fontSize: edit.fontSize || '14px',
                                    color: edit.color || '#000000',
                                    fontWeight: edit.fontWeight || 'normal',
                                    fontStyle: edit.fontStyle || 'normal',
                                    lineHeight: edit.lineHeight || 'normal',
                                    letterSpacing: edit.letterSpacing || 'normal',
                                    zIndex: 998,
                                    pointerEvents: 'none',
                                    whiteSpace: 'pre-wrap',
                                    maxWidth: '300px',
                                    padding: '0 2px'
                                  }}
                                  title={`${edit.userName}: "${edit.originalText}" → "${edit.text}"`}
                                >
                                  {edit.text}
                                </div>
                              </React.Fragment>
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
                              scale={zoomLevel / 100}
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
                      <div className="pdf-double-page-wrapper" style={{ position: 'relative' }}>
                        {/* Pagine "sotto" - pre-caricate, visibili solo durante flip */}
                        {underPages.left && underPages.right && (
                          <div style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 0, 
                            zIndex: 1,
                            display: 'flex',
                            gap: 0,
                            pointerEvents: 'none',
                            opacity: 1
                          }}>
                            <div className="pdf-page pdf-page-left">
                              <div className="pdf-page-number">Pagina {underPages.left}</div>
                              <Page
                                pageNumber={underPages.left}
                                scale={zoomLevel / 100}
                                rotate={rotation}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="pdf-page-render"
                              />
                            </div>
                            <div className="pdf-page pdf-page-right">
                              <div className="pdf-page-number">Pagina {underPages.right}</div>
                              <Page
                                pageNumber={underPages.right}
                                scale={zoomLevel / 100}
                                rotate={rotation}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="pdf-page-render"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Pagina sinistra */}
                        <div className={`pdf-page pdf-page-left ${isFlipping && flipDirection === 'prev' ? 'flipping-page' : ''}`} style={{ 
                          position: 'relative', 
                          zIndex: 5
                        }}>
                          <div className="pdf-page-number">Pagina {displayPage}</div>
                          <Page
                            pageNumber={displayPage}
                            scale={zoomLevel / 100}
                            rotate={rotation}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="pdf-page-render"
                          />
                          
                          {/* ✨ Fabric.js Canvas - Pagina sinistra */}
                          {isNotary && (
                            <FabricCanvas
                              pageNumber={displayPage}
                              width={420} // A4 half width for double page
                              height={595} // A4 height
                              scale={zoomLevel / 100}
                              selectedTool={selectedTool}
                              toolOptions={toolOptions}
                              isReadOnly={false}
                              initialObjects={fabricObjects[displayPage] || []}
                              onObjectAdded={(obj) => {
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_ADD',
                                  pageNumber: displayPage,
                                  object: obj
                                })
                              }}
                              onObjectModified={(obj) => {
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_MODIFY',
                                  pageNumber: displayPage,
                                  object: obj
                                })
                              }}
                              onObjectRemoved={(obj) => {
                                broadcastAction({
                                  type: 'FABRIC_OBJECT_REMOVE',
                                  pageNumber: displayPage,
                                  objectId: obj.id
                                })
                              }}
                            />
                          )}
                          
                          {/* Input box per editing testo - Pagina sinistra */}
                          {activeTextEdit && activeTextEdit.page === displayPage && (
                            <div
                              className="pdf-text-edit-input"
                              style={{
                                position: 'absolute',
                                left: activeTextEdit.x + '%',
                                top: activeTextEdit.y + '%',
                                zIndex: 1000
                              }}
                            >
                              <textarea
                                autoFocus
                                value={activeTextEdit.text}
                                onChange={(e) => setActiveTextEdit({ ...activeTextEdit, text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setActiveTextEdit(null)
                                  } else if (e.key === 'Enter' && e.ctrlKey) {
                                    const newEdit = {
                                      ...activeTextEdit,
                                      id: Date.now(),
                                      userId: currentUser?.id,
                                      userName: currentUser?.name || currentUser?.email || 'Notaio',
                                      timestamp: Date.now()
                                    }
                                    setTextEdits(prev => [...prev, newEdit])
                                    broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                    setActiveTextEdit(null)
                                    console.log('✅ Modifica testo salvata')
                                  }
                                }}
                                style={{
                                  width: '300px',
                                  minHeight: '60px',
                                  padding: '8px',
                                  fontSize: '14px',
                                  border: '2px solid #2196F3',
                                  borderRadius: '4px',
                                  resize: 'both',
                                  fontFamily: 'Arial, sans-serif'
                                }}
                                placeholder="Modifica il testo..."
                              />
                              <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => {
                                    const newEdit = {
                                      ...activeTextEdit,
                                      id: Date.now(),
                                      userId: currentUser?.id,
                                      userName: currentUser?.name || currentUser?.email || 'Notaio',
                                      timestamp: Date.now()
                                    }
                                    setTextEdits(prev => [...prev, newEdit])
                                    broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                    setActiveTextEdit(null)
                                    console.log('✅ Modifica testo salvata')
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Salva
                                </button>
                                <button
                                  onClick={() => setActiveTextEdit(null)}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#ccc',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Annulla
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Testi modificati salvati - Pagina sinistra */}
                          {textEdits
                            .filter(edit => edit.page === displayPage)
                            .map(edit => (
                              <div
                                key={edit.id}
                                className="pdf-text-edit-overlay"
                                style={{
                                  position: 'absolute',
                                  left: edit.x + '%',
                                  top: edit.y + '%',
                                  fontSize: '14px',
                                  color: '#000',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  zIndex: 998,
                                  maxWidth: '300px',
                                  wordWrap: 'break-word'
                                }}
                                title={`${edit.userName}: "${edit.originalText}" → "${edit.text}"`}
                              >
                                {edit.text}
                              </div>
                            ))
                          }
                          
                          {/* Evidenziazioni overlay - Pagina sinistra */}
                          {!isFlipping && (() => {
                            const pageHighlights = highlights.filter(h => h.page === displayPage)
                            console.log(`🎨 Rendering ${pageHighlights.length} highlights per pagina ${displayPage}`, pageHighlights)
                            return pageHighlights.map(highlight => (
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
                                  pointerEvents: selectedTool === 'eraser' ? 'auto' : 'none',
                                  zIndex: 999,
                                  mixBlendMode: 'multiply',
                                  borderRadius: '2px',
                                  cursor: selectedTool === 'eraser' ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPjxwYXRoIGQ9Ik0yNSAyNkg5TDQgMjFDMi41IDE5LjUgMi41IDE3IDQgMTUuNUwxMy41IDZDMTUgNC41IDE3LjUgNC41IDE5IDZMMjYgMTNDMjcuNSAxNC41IDI3LjUgMTcgMjYgMTguNUwyMSAyNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE2IDE2TDEyIDIwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9nPjxkZWZzPjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+PGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+PGZlT2Zmc2V0IGR5PSIyIi8+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMSIvPjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiIHJlc3VsdD0ic2hhcGUiLz48L2ZpbHRlcj48L2RlZnM+PC9zdmc+") 16 16, crosshair' : 'default'
                                }}
                                title={selectedTool === 'eraser' ? 'Clicca per cancellare' : `${highlight.userName}: "${highlight.text}"`}
                                onClick={(e) => {
                                  if (selectedTool === 'eraser' && isNotary) {
                                    e.stopPropagation()
                                    // ✅ Rimuovi TUTTE le evidenziazioni dello stesso gruppo (tutte le righe)
                                    const groupToRemove = highlight.groupId
                                    setHighlights(prev => prev.filter(h => h.groupId !== groupToRemove))
                                    // Sincronizza via WebSocket (rimuovi gruppo intero)
                                    broadcastAction({ 
                                      type: 'HIGHLIGHT_REMOVE_GROUP', 
                                      groupId: groupToRemove 
                                    })
                                    console.log('🗑️ Gruppo evidenziazioni rimosso:', groupToRemove)
                                  }
                                }}
                              />
                            ))
                          })()}
                        </div>
                        
                        {/* Pagina destra */}
                        {displayPage < totalPages && (
                          <div className={`pdf-page pdf-page-right ${isFlipping && flipDirection === 'next' ? 'flipping-page' : ''}`} style={{ 
                            position: 'relative', 
                            zIndex: 5
                          }}>
                            <div className="pdf-page-number">Pagina {displayPage + 1}</div>
                            <Page
                              pageNumber={displayPage + 1}
                              scale={zoomLevel / 100}
                              rotate={rotation}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="pdf-page-render"
                            />
                            
                            {/* ✨ Fabric.js Canvas - Pagina destra */}
                            {isNotary && (
                              <FabricCanvas
                                pageNumber={displayPage + 1}
                                width={420} // A4 half width for double page
                                height={595} // A4 height
                                scale={zoomLevel / 100}
                                selectedTool={selectedTool}
                                toolOptions={toolOptions}
                                isReadOnly={false}
                                initialObjects={fabricObjects[displayPage + 1] || []}
                                onObjectAdded={(obj) => {
                                  broadcastAction({
                                    type: 'FABRIC_OBJECT_ADD',
                                    pageNumber: displayPage + 1,
                                    object: obj
                                  })
                                }}
                                onObjectModified={(obj) => {
                                  broadcastAction({
                                    type: 'FABRIC_OBJECT_MODIFY',
                                    pageNumber: displayPage + 1,
                                    object: obj
                                  })
                                }}
                                onObjectRemoved={(obj) => {
                                  broadcastAction({
                                    type: 'FABRIC_OBJECT_REMOVE',
                                    pageNumber: displayPage + 1,
                                    objectId: obj.id
                                  })
                                }}
                              />
                            )}
                            
                            {/* Input box per editing testo - Pagina destra */}
                            {activeTextEdit && activeTextEdit.page === displayPage + 1 && (
                              <div
                                className="pdf-text-edit-input"
                                style={{
                                  position: 'absolute',
                                  left: activeTextEdit.x + '%',
                                  top: activeTextEdit.y + '%',
                                  zIndex: 1000
                                }}
                              >
                                <textarea
                                  autoFocus
                                  value={activeTextEdit.text}
                                  onChange={(e) => setActiveTextEdit({ ...activeTextEdit, text: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setActiveTextEdit(null)
                                    } else if (e.key === 'Enter' && e.ctrlKey) {
                                      const newEdit = {
                                        ...activeTextEdit,
                                        id: Date.now(),
                                        userId: currentUser?.id,
                                        userName: currentUser?.name || currentUser?.email || 'Notaio',
                                        timestamp: Date.now()
                                      }
                                      setTextEdits(prev => [...prev, newEdit])
                                      broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                      setActiveTextEdit(null)
                                      console.log('✅ Modifica testo salvata')
                                    }
                                  }}
                                  style={{
                                    width: '300px',
                                    minHeight: '60px',
                                    padding: '8px',
                                    fontSize: '14px',
                                    border: '2px solid #2196F3',
                                    borderRadius: '4px',
                                    resize: 'both',
                                    fontFamily: 'Arial, sans-serif'
                                  }}
                                  placeholder="Modifica il testo..."
                                />
                                <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => {
                                      const newEdit = {
                                        ...activeTextEdit,
                                        id: Date.now(),
                                        userId: currentUser?.id,
                                        userName: currentUser?.name || currentUser?.email || 'Notaio',
                                        timestamp: Date.now()
                                      }
                                      setTextEdits(prev => [...prev, newEdit])
                                      broadcastAction({ type: 'TEXT_EDIT_ADD', textEdit: newEdit })
                                      setActiveTextEdit(null)
                                      console.log('✅ Modifica testo salvata')
                                    }}
                                    style={{
                                      padding: '4px 12px',
                                      background: '#2196F3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Salva
                                  </button>
                                  <button
                                    onClick={() => setActiveTextEdit(null)}
                                    style={{
                                      padding: '4px 12px',
                                      background: '#ccc',
                                      color: '#333',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Annulla
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Testi modificati salvati - Pagina destra */}
                            {textEdits
                              .filter(edit => edit.page === displayPage + 1)
                              .map(edit => (
                                <div
                                  key={edit.id}
                                  className="pdf-text-edit-overlay"
                                  style={{
                                    position: 'absolute',
                                    left: edit.x + '%',
                                    top: edit.y + '%',
                                    fontSize: '14px',
                                    color: '#000',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    padding: '2px 4px',
                                    borderRadius: '2px',
                                    zIndex: 998,
                                    maxWidth: '300px',
                                    wordWrap: 'break-word'
                                  }}
                                  title={`${edit.userName}: "${edit.originalText}" → "${edit.text}"`}
                                >
                                  {edit.text}
                                </div>
                              ))
                            }
                            
                            {/* Evidenziazioni overlay - Pagina destra */}
                            {!isFlipping && (() => {
                              const pageHighlights = highlights.filter(h => h.page === displayPage + 1)
                              console.log(`🎨 Rendering ${pageHighlights.length} highlights per pagina ${displayPage + 1}`, pageHighlights)
                              return pageHighlights.map(highlight => (
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
                                    pointerEvents: selectedTool === 'eraser' ? 'auto' : 'none',
                                    zIndex: 999,
                                    mixBlendMode: 'multiply',
                                    borderRadius: '2px',
                                    cursor: selectedTool === 'eraser' ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPjxwYXRoIGQ9Ik0yNSAyNkg5TDQgMjFDMi41IDE5LjUgMi41IDE3IDQgMTUuNUwxMy41IDZDMTUgNC41IDE3LjUgNC41IDE5IDZMMjYgMTNDMjcuNSAxNC41IDI3LjUgMTcgMjYgMTguNUwyMSAyNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE2IDE2TDEyIDIwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9nPjxkZWZzPjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+PGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+PGZlT2Zmc2V0IGR5PSIyIi8+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMSIvPjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiLz48ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18wXzEiIHJlc3VsdD0ic2hhcGUiLz48L2ZpbHRlcj48L2RlZnM+PC9zdmc+") 16 16, crosshair' : 'default'
                                  }}
                                  title={selectedTool === 'eraser' ? 'Clicca per cancellare' : `${highlight.userName}: "${highlight.text}"`}
                                  onClick={(e) => {
                                    if (selectedTool === 'eraser' && isNotary) {
                                      e.stopPropagation()
                                      // Rimuovi l'evidenziazione
                                      setHighlights(prev => prev.filter(h => h.id !== highlight.id))
                                      // Sincronizza via WebSocket
                                      broadcastAction({ 
                                        type: 'HIGHLIGHT_REMOVE', 
                                        highlightId: highlight.id 
                                      })
                                      console.log('🗑️ Evidenziazione rimossa:', highlight.id)
                                    }
                                  }}
                                />
                              ))
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </Document>
                  })()
                )}
              </div>
            </div>
            </div> {/* Chiusura pdf-content-wrapper */}
          
          {/* Sidebar Strumenti (a destra, solo icone) - SOLO per notaio */}
          {isNotary && (
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
          </div>
          )}
          {/* Chiusura pdf-tools-sidebar */}
          
          {/* Barra ricerca (slide in dall'alto quando attiva) - SOLO per notaio */}
          {isNotary && showSearch && (
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

// ✅ Memoizza il componente per evitare re-render quando le props non cambiano
// ✅ DEBUG: funzione di confronto personalizzata per capire quale prop cambia
export default React.memo(CollaborativePDFViewer, (prevProps, nextProps) => {
  const changedProps = []
  
  if (prevProps.document !== nextProps.document) {
    changedProps.push('document')
    console.log('🔄 PROP CHANGED: document', {prev: prevProps.document?.id, next: nextProps.document?.id})
  }
  if (prevProps.appointmentId !== nextProps.appointmentId) {
    changedProps.push('appointmentId')
    console.log('🔄 PROP CHANGED: appointmentId', {prev: prevProps.appointmentId, next: nextProps.appointmentId})
  }
  if (prevProps.onClose !== nextProps.onClose) {
    changedProps.push('onClose')
    console.log('🔄 PROP CHANGED: onClose (funzione cambiata)')
  }
  if (prevProps.userRole !== nextProps.userRole) {
    changedProps.push('userRole')
    console.log('🔄 PROP CHANGED: userRole', {prev: prevProps.userRole, next: nextProps.userRole})
  }
  if (prevProps.participants !== nextProps.participants) {
    changedProps.push('participants')
    console.log('🔄 PROP CHANGED: participants', {prev: prevProps.participants, next: nextProps.participants})
  }
  if (prevProps.currentUser !== nextProps.currentUser) {
    changedProps.push('currentUser')
    console.log('🔄 PROP CHANGED: currentUser', {prev: prevProps.currentUser?.id, next: nextProps.currentUser?.id})
  }
  
  if (changedProps.length > 0) {
    console.log('❌ CollaborativePDFViewer RE-RENDER perché props cambiate:', changedProps)
    return false // Re-render
  } else {
    console.log('✅ CollaborativePDFViewer SKIP re-render (props identiche)')
    return true // Skip re-render
  }
})

