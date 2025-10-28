import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Maximize2, Minus, Video, VideoOff, Mic, MicOff, Phone, Monitor, MessageSquare, Users, Clock, LogIn, Edit, Trash2, FileText, Lock, Unlock, Share2, PenTool, Archive, Mail, Folder, ChevronDown, ChevronRight, Upload, CheckCircle, XCircle, UserMinus, AlertTriangle, Send } from 'lucide-react'
import { useAppointmentRoom } from '../contexts/AppointmentRoomContext'
import authService from '../services/authService'
import ConfirmExitAppointmentModal from './ConfirmExitAppointmentModal'
import AcceptGuestModal from './AcceptGuestModal'
import CollaborativePDFViewer from './CollaborativePDFViewer'
import ConfirmModal from './ConfirmModal'
import LibreOfficeViewer from './viewers/LibreOfficeViewer'
import { ICON_MAP, getTipologieAtti } from '../config/tipologieAttiConfig'
import { detectFileType, FileType, isOfficeDocument } from '../utils/fileTypeDetector'
import './AppointmentRoom.css'

// ✅ Componente Timer separato e memoizzato per evitare re-render di AppointmentRoom
const CallTimer = React.memo(({ connectionStatus }) => {
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [connectionStatus])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="video-timer">
      <Clock size={14} />
      <span>{formatDuration(callDuration)}</span>
    </div>
  )
})

function AppointmentRoom() {
  const { activeAppointment, isMinimized, isFloating, exitAppointment, minimizeAppointment, toggleFloating } = useAppointmentRoom()
  const [connectionStatus, setConnectionStatus] = useState('waiting') // 'waiting', 'connected'
  const [showExitModal, setShowExitModal] = useState(false)
  const [showAcceptGuestModal, setShowAcceptGuestModal] = useState(false)
  const [isClientAccepted, setIsClientAccepted] = useState(false) // Traccia se il cliente è stato accettato
  const [isClientOnline, setIsClientOnline] = useState(false) // ✅ Traccia se il cliente è effettivamente connesso in video
  const [isClientWaiting, setIsClientWaiting] = useState(false) // ✅ Traccia se il cliente è in sala d'attesa (connesso ma non accettato)
  
  // Estrai appointmentId e dati
  const appointmentData = activeAppointment?.rawData || activeAppointment
  const appointmentId = activeAppointment?.id || appointmentData?.id
  
  // Stati controlli partecipante (per notaio)
  const [isClientCameraForced, setIsClientCameraForced] = useState(false) // Camera sempre attiva
  const [isClientMicForced, setIsClientMicForced] = useState(false) // Microfono sempre attivo
  
  // Stati lettore PDF collaborativo
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  
  // Stati lettore Office (Word, Excel, PowerPoint) - SOLO NOTAIO
  const [showOfficeViewer, setShowOfficeViewer] = useState(false)
  const [selectedOfficeDocument, setSelectedOfficeDocument] = useState(null)
  
  // WebSocket per sincronizzazione generale video call
  const wsVideoCallRef = useRef(null)
  
  // Stati controlli video
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [mediaStream, setMediaStream] = useState(null)
  
  // Documenti appuntamento
  const [documenti, setDocumenti] = useState([])
  const [templateInfo, setTemplateInfo] = useState(null)
  const [protocolloInfo, setProtocolloInfo] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState(['cliente', 'studio']) // ✅ Cartelle espanse di default (2 cartelle principali)
  const [uploadingStudioDoc, setUploadingStudioDoc] = useState(false)
  
  // Ref per input file upload (Documenti di Studio)
  const studioFileInputRef = useRef(null)
  
  // ✅ Modali custom per upload/delete documenti studio
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [notificationModal, setNotificationModal] = useState({ show: false, type: 'success', title: '', message: '' })
  
  // Stati modale rimozione utente dalla video
  const [showRemoveUserConfirm, setShowRemoveUserConfirm] = useState(false)
  
  // Ref per video element
  const videoRef = useRef(null)
  
  // Stati per drag and drop
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 1400, height: 1100 })
  
  // Refs per gestire drag e resize
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const resizeDataRef = useRef({ direction: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startPosX: 0, startPosY: 0 })
  const rafIdRef = useRef(null)
  
  const floatingRef = useRef(null)

  useEffect(() => {
    if (activeAppointment) {
      // 🔑 LEGGI IL RUOLO DALLA SESSIONE CORRENTE (JWT Token / localStorage)
      // NON dall'appointment (che non contiene userRole!)
      const userRole = authService.getUserRole()
      
      console.log('🎯 AppointmentRoom - Ruolo dalla SESSIONE CORRENTE:', userRole)
      console.log('📊 AppointmentRoom - Appointment:', activeAppointment.id)
      
      // REGOLA FONDAMENTALE:
      // - Notaio/Admin → Video chiamata DIRETTA (possono accettare ospiti)
      // - Cliente/Partner → CONTROLLA se già accettato, altrimenti SALA D'ATTESA
      
      if (userRole === 'notaio' || userRole === 'notary' || userRole === 'admin') {
        console.log('✅ Notaio/Admin → Entra direttamente nella video chiamata')
        setConnectionStatus('connected')
        // ✅ Attiva IMMEDIATAMENTE camera e microfono per il notaio
        setIsCameraOn(true)
        setIsMicOn(true)
        console.log('📹 Camera e microfono attivati IMMEDIATAMENTE per notaio/admin')
        
        // ⚡ AVVIA LO STREAM IMMEDIATAMENTE per il notaio (stessa ottimizzazione del cliente)
        const startStreamImmediately = async () => {
          try {
            console.log('🎥🎥🎥 [NOTAIO] AVVIO IMMEDIATO dello stream (senza aspettare re-render)')
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: true
            })
            console.log('✅✅✅ [NOTAIO] Stream ottenuto IMMEDIATAMENTE:', stream)
            setMediaStream(stream)
            
            // ⚡ Attendi che videoRef sia disponibile con retry
            let retries = 0
            const maxRetries = 10
            
            const assignStreamToVideo = () => {
              if (videoRef.current) {
                console.log('✅ [NOTAIO] videoRef disponibile, assegno stream')
                videoRef.current.srcObject = stream
                videoRef.current.play().then(() => {
                  console.log('✅✅✅ [NOTAIO] Video avviato IMMEDIATAMENTE')
                }).catch((playError) => {
                  console.warn('⚠️ [NOTAIO] Errore play (normale):', playError)
                })
              } else if (retries < maxRetries) {
                retries++
                console.log(`⏳ [NOTAIO] videoRef non ancora disponibile, retry ${retries}/${maxRetries}`)
                requestAnimationFrame(assignStreamToVideo)
              } else {
                console.log('⚠️ [NOTAIO] videoRef non disponibile dopo max retries, lo stream sarà assegnato dal useEffect')
              }
            }
            
            assignStreamToVideo()
          } catch (error) {
            console.error('❌ [NOTAIO] Errore avvio stream immediato:', error)
            // L'useEffect normale gestirà il retry
          }
        }
        
        startStreamImmediately()
      } else if (userRole === 'cliente' || userRole === 'client' || userRole === 'partner') {
        // ✅ LOGICA MIGLIORATA: Mantiene lo stato del cliente quando già connesso
        // 
        // COMPORTAMENTO CORRETTO:
        // 1. Al primo accesso: cliente entra in sala d'attesa (connectionStatus !== 'connected')
        // 2. Notaio accetta: cliente passa a 'connected' tramite messaggio WebSocket
        // 3. Chiusura viewer: activeAppointment cambia, ma cliente mantiene stato 'connected'
        // 4. Rimozione manuale: notaio clicca "Rimuovi" → messaggio BLOCK_CLIENT → cliente torna 'waiting'
        //
        // ❌ PROBLEMA RISOLTO: Prima, ogni cambio di activeAppointment (es. chiusura viewer)
        //    causava setConnectionStatus('waiting'), riportando erroneamente il cliente in sala d'attesa
        if (connectionStatus !== 'connected') {
          console.log('👤 Cliente → Sala d\'attesa (attende accettazione notaio)')
          setConnectionStatus('waiting')
        } else {
          console.log('👤 Cliente → GIÀ CONNESSO, mantiene stato video call (non torna in sala d\'attesa)')
        }
      } else {
        // Fallback: ruoli sconosciuti vanno in sala d'attesa per sicurezza
        console.warn('⚠️ Ruolo sconosciuto:', userRole, '→ Sala d\'attesa (fallback sicuro)')
        setConnectionStatus('waiting')
      }
    }
  }, [activeAppointment, connectionStatus])
  
  // ❌ RIMOSSO: Polling check-acceptance non più necessario
  // Il cliente ora parte sempre dalla sala d'attesa e viene accettato manualmente dal notaio tramite WebSocket
  
  // ✅ RIMOSSO: Camera e microfono ora si attivano IMMEDIATAMENTE quando si imposta connectionStatus='connected'
  // Non serve più un useEffect separato che reagisce a connectionStatus, eliminando il delay di rendering
  
  // ✅ REGOLA FISSA: Cliente SEMPRE in sala d'attesa ad ogni accesso
  // Non controlliamo più accettazioni precedenti - il notaio deve accettare manualmente ogni volta
  // isClientAccepted rimane false finché il notaio non clicca "Accetta" nella sessione corrente
  
  // Carica documenti appuntamento (solo per notaio)
  useEffect(() => {
    const fetchDocumenti = async () => {
      const userRole = authService.getUserRole()
      const appointmentData = activeAppointment?.rawData || activeAppointment
      const appointmentId = activeAppointment?.id || appointmentData?.id
      
      // Solo il notaio carica i documenti
      if ((userRole === 'notaio' || userRole === 'notary' || userRole === 'admin') && appointmentId && connectionStatus === 'connected') {
        try {
          const token = localStorage.getItem('access_token')
          const response = await fetch(`http://localhost:8000/api/appointments/documenti-appuntamento/appuntamento/${appointmentId}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log(`📄 Caricati ${data.length} documenti per appuntamento ${appointmentId}`)
            setDocumenti(data)
          } else {
            console.error('❌ Errore caricamento documenti:', response.status)
          }
        } catch (error) {
          console.error('❌ Errore caricamento documenti:', error)
        }
      }
    }
    
    fetchDocumenti()
  }, [activeAppointment, connectionStatus])
  
  // Carica info template e protocollo per la tipologia atto
  useEffect(() => {
    const fetchTemplateAndProtocollo = async () => {
      const appointmentData = activeAppointment?.rawData || activeAppointment
      const tipologiaCode = appointmentData?.tipologia_atto_code || appointmentData?.appointment_type
      const appointmentId = appointmentData?.id
      
      console.log('🔍 fetchTemplateAndProtocollo - appointmentData:', appointmentData)
      console.log('🔍 fetchTemplateAndProtocollo - tipologiaCode:', tipologiaCode)
      console.log('🔍 fetchTemplateAndProtocollo - appointmentId:', appointmentId)
      console.log('🔍 fetchTemplateAndProtocollo - connectionStatus:', connectionStatus)
      
      if (tipologiaCode && appointmentId && connectionStatus === 'connected') {
        try {
          // Carica template
          const templateService = (await import('../services/templateService')).default
          console.log('🔍 Richiesta template per:', tipologiaCode)
          const templateResult = await templateService.getTemplateByActType(tipologiaCode)
          
          if (templateResult.success) {
            console.log('✅ Template caricato con successo:', templateResult.data)
            setTemplateInfo(templateResult.data)
          } else {
            console.log('ℹ️ Template non trovato per:', tipologiaCode)
          }
          
          // Carica o crea protocollo
          const protocolloService = (await import('../services/protocolloService')).default
          console.log('📋 Richiesta protocollo per appuntamento:', appointmentId)
          const protocolloResult = await protocolloService.getOrCreateProtocollo(appointmentId)
          
          if (protocolloResult.success) {
            console.log('✅ Protocollo ottenuto:', protocolloResult.data.numero_protocollo)
            setProtocolloInfo(protocolloResult.data)
          } else {
            console.warn('⚠️ Errore caricamento/creazione protocollo:', protocolloResult.error)
          }
        } catch (error) {
          console.error('❌ Errore caricamento template/protocollo:', error)
        }
      } else {
        console.log('⏭️ Skip caricamento - tipologiaCode:', tipologiaCode, 'appointmentId:', appointmentId, 'connectionStatus:', connectionStatus)
      }
    }
    
    fetchTemplateAndProtocollo()
  }, [activeAppointment, connectionStatus])
  
  // Gestione espansione cartelle
  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => 
      prev.includes(folderName)
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
    )
  }
  
  // Organizza documenti per categoria (2 cartelle di default)
  const groupDocumentsByCategory = (docs) => {
    const categories = {
      cliente: { name: 'Documenti Cliente', docs: [] },
      studio: { name: 'Documenti di Studio', docs: [] }
    }
    
    docs.forEach(doc => {
      const docName = (doc.document_type_name || '').toLowerCase()
      
      // ✅ Documenti di Studio (template del notaio e documenti generati dal notaio)
      // Questi NON concorrono al conteggio totale dei documenti da caricare del cliente
      if (docName.includes('template') || 
          docName.includes('atto notarile') ||
          doc.required_from === 'notaio' ||
          doc.document_type?.required_from === 'notaio') {
        categories.studio.docs.push(doc)
      }
      // ✅ Documenti Cliente (tutti i documenti richiesti al cliente)
      else {
        categories.cliente.docs.push(doc)
      }
    })
    
    return categories
  }
  
  // Gestione stream video/audio
  useEffect(() => {
    let stream = null
    let isActive = true // Flag per evitare race conditions
    
    const startMedia = async () => {
      try {
        if (connectionStatus === 'connected' && (isCameraOn || isMicOn)) {
          console.log('🎥 Richiesta accesso media - Camera:', isCameraOn, 'Mic:', isMicOn)
          
          // ✅ PULISCI lo stream precedente PRIMA di avviare uno nuovo
          if (mediaStream) {
            console.log('🧹 Pulisco stream precedente prima di riavviare')
            mediaStream.getTracks().forEach(track => track.stop())
            setMediaStream(null)
            // Piccolo delay per assicurarsi che il browser rilasci le risorse
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: isCameraOn ? { width: 1280, height: 720 } : false,
            audio: isMicOn
          })
          
          // Verifica che il componente sia ancora montato
          if (!isActive) {
            console.log('⚠️ Componente smontato durante getUserMedia, fermo stream')
            stream.getTracks().forEach(track => track.stop())
            return
          }
          
          console.log('✅ Stream ottenuto:', stream)
          setMediaStream(stream)
          
          // Attendi un frame per assicurarsi che lo stato sia aggiornato
          await new Promise(resolve => requestAnimationFrame(resolve))
          
          if (videoRef.current && isCameraOn) {
            console.log('📹 Assegno stream al video element')
            videoRef.current.srcObject = stream
            // Forza il play (alcuni browser lo richiedono)
            try {
              await videoRef.current.play()
              console.log('✅ Video play avviato')
            } catch (playError) {
              console.warn('⚠️ Errore play (normale se già in play):', playError)
            }
          }
        } else if (mediaStream) {
          // Ferma lo stream se entrambi sono spenti
          console.log('🛑 Fermo stream')
          mediaStream.getTracks().forEach(track => track.stop())
          setMediaStream(null)
          if (videoRef.current) {
            videoRef.current.srcObject = null
          }
        }
      } catch (error) {
        console.error('❌ Errore accesso media:', error)
        alert('Impossibile accedere alla webcam/microfono. Verifica i permessi del browser.')
      }
    }
    
    startMedia()
    
    return () => {
      console.log('🧹 Cleanup useEffect mediaStream')
      isActive = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isCameraOn, isMicOn, connectionStatus])
  
  // ✅ Reset completo quando si MONTA il componente (cliente rientra)
  useEffect(() => {
    console.log('🔄 AppointmentRoom montato - Reset iniziale')
    // Reset stati media al mount
    return () => {
      console.log('🧹 AppointmentRoom smontato - Cleanup finale')
      // Cleanup finale quando il componente si smonta completamente
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // Cleanup quando si chiude la room
  useEffect(() => {
    return () => {
      if (mediaStream) {
        console.log('🧹 Cleanup stream per cambio stato')
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaStream])
  
  // Gestione camera
  const toggleCamera = async () => {
    console.log('📹 Toggle camera - Stato attuale:', isCameraOn)
    
    if (!isCameraOn) {
      setIsCameraOn(true)
    } else {
      setIsCameraOn(false)
      // Ferma solo il track video
      if (mediaStream) {
        const videoTrack = mediaStream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.stop()
        }
      }
    }
  }
  
  // Gestione microfono e casse (audio in entrata e uscita)
  const toggleMic = () => {
    console.log('🎤 Toggle microfono/casse - Stato attuale:', isMicOn)
    
    if (!isMicOn) {
      // Abilita microfono (output) e casse (input)
      setIsMicOn(true)
      console.log('✅ Audio abilitato - Microfono ON, Casse ON')
      
      // Abilita il track audio se già presente
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = true
        }
      }
    } else {
      // Disabilita microfono (output) e casse (input)
      setIsMicOn(false)
      console.log('🔇 Audio disabilitato - Microfono OFF, Casse OFF')
      
      // Disabilita il track audio
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = false
        }
      }
    }
  }
  
  // Gestione chiusura chiamata
  const handleHangup = () => {
    console.log('📞 Chiusura chiamata')
    
    // Ferma tutti i media
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }
    
    // Mostra modale conferma
    setShowExitModal(true)
  }
  
  // Handler per accettare cliente dalla sala d'attesa (NOTAIO)
  const handleAcceptGuest = () => {
    console.log('📋 Notaio apre modale conferma accettazione cliente')
    setShowAcceptGuestModal(true)
  }
  
  // Conferma accettazione cliente
  const confirmAcceptGuest = async () => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    const appointmentId = activeAppointment?.id || appointmentData?.id
    
    console.log('✅ Notaio conferma accettazione cliente dalla sala d\'attesa')
    console.log('📊 ActiveAppointment:', activeAppointment)
    console.log('🆔 AppointmentID:', appointmentId)
    console.log('🔌 WebSocket stato:', wsVideoCallRef.current?.readyState, '(1=OPEN)')
    
    // ❌ Verifica ID valido
    if (!appointmentId) {
      console.error('❌ Nessun appointmentId valido')
      alert('Errore: ID appuntamento non valido')
      return
    }
    
    try {
      // Chiamata API Django per accettare il cliente
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/accept-client/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Errore accettazione cliente:', errorData)
        alert(`Errore: ${errorData.error || 'Impossibile accettare il cliente'}`)
        return
      }
      
      const data = await response.json()
      console.log('✅ Cliente accettato tramite API:', data)
      
      // ✅ Aggiorna lo stato locale
      setIsClientAccepted(true)
      setIsClientWaiting(false) // ✅ Non più in sala d'attesa
      setIsClientOnline(true) // ✅ Ora è online in video
      
      // ✅ Invia messaggio WebSocket per notificare il cliente
      if (wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: 'CLIENT_ACCEPTED',
          appointmentId,
          timestamp: Date.now(),
          userId: authService.getUser()?.id
        }
        console.log('📡 Invio messaggio CLIENT_ACCEPTED via WebSocket:', message)
        wsVideoCallRef.current.send(JSON.stringify(message))
        console.log('✅ Messaggio CLIENT_ACCEPTED inviato con successo')
      } else {
        console.error('❌ WebSocket non disponibile! ReadyState:', wsVideoCallRef.current?.readyState)
      }
      
      // ✅ Chiudi la modale
      setShowAcceptGuestModal(false)
      console.log('✅ Modale accettazione chiusa')
      
    } catch (error) {
      console.error('❌ Errore chiamata API:', error)
      alert('Errore di connessione. Il cliente potrebbe non ricevere la notifica.')
      // ✅ Chiudi la modale anche in caso di errore
      setShowAcceptGuestModal(false)
    }
  }
  
  // Handler per bloccare cliente (richiede nuova accettazione)
  const handleBlockClient = async () => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    const appointmentId = activeAppointment?.id || appointmentData?.id
    
    // ❌ Verifica ID valido
    if (!appointmentId) {
      console.error('❌ Nessun appointmentId valido')
      alert('Errore: ID appuntamento non valido')
      return
    }
    
    if (!confirm('Vuoi bloccare il cliente? Dovrà essere riaccettato per entrare nuovamente.')) {
      return
    }
    
    console.log('🚫 Notaio blocca il cliente')
    console.log('🆔 AppointmentID:', appointmentId)
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/block-client/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Errore blocco cliente:', errorData)
        alert(`Errore: ${errorData.error || 'Impossibile bloccare il cliente'}`)
        return
      }
      
      const data = await response.json()
      console.log('✅ Cliente bloccato tramite API:', data)
      
      // ✅ Aggiorna lo stato locale
      setIsClientAccepted(false)
      
      // Rimuovi localStorage
      const storageKey = 'client_accepted_' + appointmentId
      localStorage.removeItem(storageKey)
      sessionStorage.removeItem(storageKey)
      
      alert('Cliente bloccato. Dovrà essere riaccettato per entrare.')
      
    } catch (error) {
      console.error('❌ Errore chiamata API:', error)
      alert('Errore di connessione.')
    }
  }
  
  // Handler per forzare camera sempre attiva (notaio)
  const handleToggleForceCamera = () => {
    setIsClientCameraForced(!isClientCameraForced)
    console.log(`📹 Camera cliente ${!isClientCameraForced ? 'FORZATA' : 'LIBERA'}`)
    // TODO: Implementare API per comunicare al client che camera è forzata
    // Il client non potrà disattivarla
  }
  
  // Handler per forzare microfono sempre attivo (notaio)
  const handleToggleForceMic = () => {
    setIsClientMicForced(!isClientMicForced)
    console.log(`🎤 Microfono cliente ${!isClientMicForced ? 'FORZATO' : 'LIBERO'}`)
    // TODO: Implementare API per comunicare al client che microfono è forzato
    // Il client non potrà disattivarlo
  }

  // Handlers per mouse move e mouse up usando useCallback con RAF
  const handleMouseMove = useCallback((e) => {
    // Cancella il RAF precedente se esiste
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // Usa requestAnimationFrame per rendering fluido
    rafIdRef.current = requestAnimationFrame(() => {
      if (isDraggingRef.current && floatingRef.current) {
        const newX = e.clientX - dragOffsetRef.current.x
        const newY = e.clientY - dragOffsetRef.current.y

        // Aggiorna immediatamente il DOM per fluidità
        floatingRef.current.style.left = `${newX}px`
        floatingRef.current.style.top = `${newY}px`

        // Aggiorna lo stato con throttle
        setPosition({ x: newX, y: newY })
      }
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current) {
      console.log('✅ Resize terminato')
    }
    
    // Cancella RAF se in corso
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    
    isDraggingRef.current = false
    isResizingRef.current = false
  }, [])

  // Aggiungi/rimuovi listeners globali con capture
  useEffect(() => {
    const options = { capture: true, passive: false }
    window.addEventListener('mousemove', handleMouseMove, options)
    window.addEventListener('mouseup', handleMouseUp, options)
    
    console.log('✅ Event listeners aggiunti')
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove, options)
      window.removeEventListener('mouseup', handleMouseUp, options)
      console.log('🗑️ Event listeners rimossi')
    }
  }, [handleMouseMove, handleMouseUp])

  // WebSocket sincronizzazione - Inizializza quando appointment è disponibile
  useEffect(() => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    if (!appointmentData?.id) {
      console.log('⚠️ WebSocket video call: nessun appointment ID, skip')
      return
    }
    
    const userRole = authService.getUserRole()
    const currentUser = authService.getUser()
    const notaryName = appointmentData.notaio_nome || appointmentData.notary_name || 'Notaio'
    const clientName = appointmentData.client_name || 
                       appointmentData.cliente_nome || 
                       appointmentData.clientName ||
                       activeAppointment.clientName || 
                       'Cliente'
    
    const wsUrl = `ws://localhost:8000/ws/pdf/${appointmentData.id}/`
    console.log('🔌 [VIDEO CALL WS] Inizializzo per:', {
      appointmentId: appointmentData.id,
      userRole,
      userId: currentUser?.id,
      userName: userRole === 'notaio' ? notaryName : clientName,
      wsUrl
    })
    
    try {
      wsVideoCallRef.current = new WebSocket(wsUrl)
      
      wsVideoCallRef.current.onopen = () => {
        console.log('✅ [VIDEO CALL WS] CONNESSO - Invio JOIN_CALL')
        wsVideoCallRef.current.send(JSON.stringify({
          type: 'JOIN_CALL',
          userId: currentUser?.id,
          userName: userRole === 'notaio' ? notaryName : clientName,
          userRole: userRole
        }))
      }
      
      wsVideoCallRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 [VIDEO CALL WS] Messaggio ricevuto:', data, 'userRole:', userRole)
          
          // Gestisci messaggi in base al tipo
          switch (data.type) {
            case 'OPEN_PDF':
              console.log('📄 [VIDEO CALL WS] OPEN_PDF ricevuto')
              console.log('   - userRole:', userRole)
              console.log('   - document:', data.document)
              console.log('   - isNotaio?', userRole === 'notaio')
              console.log('   - isAdmin?', userRole === 'admin')
              console.log('   - isClient?', userRole !== 'notaio' && userRole !== 'admin')
              
              // Solo il cliente riceve e apre il PDF automaticamente
              if (userRole !== 'notaio' && userRole !== 'admin') {
                console.log('✅ [VIDEO CALL WS] Cliente: APRO PDF viewer automaticamente!')
                console.log('   - setSelectedDocument:', data.document)
                console.log('   - setShowPDFViewer: true')
                setSelectedDocument(data.document)
                setShowPDFViewer(true)
              } else {
                console.log('⏭️ [VIDEO CALL WS] Notaio/Admin: ignoro OPEN_PDF (l\'ho già aperto io)')
              }
              break
              
            case 'CLOSE_PDF':
              console.log('❌ [VIDEO CALL WS] CLOSE_PDF ricevuto, userRole:', userRole)
              // Tutti chiudono il PDF
              if (userRole !== 'notaio' && userRole !== 'admin') {
                console.log('✅ [VIDEO CALL WS] Cliente: CHIUDO PDF viewer automaticamente!')
                setShowPDFViewer(false)
                setSelectedDocument(null)
              } else {
                console.log('⏭️ [VIDEO CALL WS] Notaio: ignoro CLOSE_PDF (l\'ho già chiuso io)')
              }
              break
              
            // ❌ OFFICE VIEWER DISABILITATO
            // case 'OPEN_OFFICE':
            // case 'CLOSE_OFFICE':
            
            // ✅ Traccia connessione/disconnessione cliente
            case 'USER_JOINED':
              console.log('👤 [VIDEO CALL WS] USER_JOINED:', data.userName, '- Role:', data.userRole)
              // Se è il cliente che si connette, aggiorna stato
              if (data.userRole === 'cliente' || data.userRole === 'client') {
                console.log('✅ Cliente entrato in SALA D\'ATTESA')
                setIsClientWaiting(true) // ✅ Cliente in attesa di essere accettato
                // isClientOnline sarà true solo dopo accettazione
              }
              break
              
            case 'USER_LEFT':
              console.log('👋 [VIDEO CALL WS] USER_LEFT ricevuto!')
              console.log('   userName:', data.userName)
              console.log('   userRole:', data.userRole)
              console.log('   userId:', data.userId)
              console.log('   Stati PRIMA del reset:')
              console.log('     - isClientWaiting:', isClientWaiting)
              console.log('     - isClientOnline:', isClientOnline)
              console.log('     - isClientAccepted:', isClientAccepted)
              
              // Se è il cliente che si disconnette, aggiorna stato
              if (data.userRole === 'cliente' || data.userRole === 'client') {
                console.log('✅ Identificato come CLIENTE → Reset stati...')
                setIsClientWaiting(false)  // ✅ Non più in attesa
                setIsClientOnline(false)   // ✅ Non più online
                setIsClientAccepted(false) // ✅ Reset anche l'accettazione
                
                console.log('✅ Stati aggiornati:')
                console.log('   → isClientWaiting: false')
                console.log('   → isClientOnline: false')
                console.log('   → isClientAccepted: false')
                console.log('   → Placeholder dovrebbe apparire!')
              } else {
                console.log('⚠️ NON identificato come cliente (userRole:', data.userRole, ') → Stati NON aggiornati')
              }
              break
              
            case 'CLIENT_ACCEPTED':
              console.log('✅ [VIDEO CALL WS] CLIENT_ACCEPTED ricevuto')
              // Se sei il cliente e vieni accettato, entra nella video
              if (userRole === 'cliente' || userRole === 'client') {
                console.log('✅ Sei stato accettato nella videochiamata!')
                setConnectionStatus('connected')
                setIsCameraOn(true)
                setIsMicOn(true)
                console.log('📹 Camera e microfono attivati')
              }
              break
              
            case 'BLOCK_CLIENT':
              console.log('🚫 [VIDEO CALL WS] BLOCK_CLIENT ricevuto')
              // Se sei il cliente e vieni bloccato, torna in sala d'attesa
              if (userRole === 'cliente' || userRole === 'client') {
                console.log('❌ Sei stato rimosso dalla videochiamata dal notaio')
                
                // ✅ Cambia lo stato di connessione del cliente a 'waiting'
                setConnectionStatus('waiting')
                
                // ✅ Ferma camera e microfono
                setIsCameraOn(false)
                setIsMicOn(false)
                
                // ✅ Mostra notifica personalizzata
                setNotificationModal({
                  show: true,
                  type: 'warning',
                  title: 'Sei stato disconnesso',
                  message: 'Sei stato rimosso dalla videochiamata dal notaio. Sei stato riportato in sala d\'attesa.'
                })
                
                // Chiudi automaticamente dopo 5 secondi
                setTimeout(() => {
                  setNotificationModal({ show: false, type: 'success', title: '', message: '' })
                }, 5000)
              }
              break
              
            default:
              console.log('ℹ️ [VIDEO CALL WS] Tipo messaggio:', data.type, '(potrebbe essere gestito dai viewer)')
              break
          }
        } catch (error) {
          console.error('❌ [VIDEO CALL WS] Errore parsing messaggio:', error)
        }
      }
      
      wsVideoCallRef.current.onerror = (error) => {
        console.error('❌ [VIDEO CALL WS] ERROR:', error)
      }
      
      wsVideoCallRef.current.onclose = (event) => {
        console.log('🔌 [VIDEO CALL WS] CHIUSO - Code:', event.code, 'Reason:', event.reason)
      }
    } catch (error) {
      console.error('❌ [VIDEO CALL WS] Errore creazione WebSocket:', error)
    }
    
    return () => {
      if (wsVideoCallRef.current) {
        console.log('🧹 [VIDEO CALL WS] Cleanup - chiudo WebSocket')
        wsVideoCallRef.current.close()
      }
    }
  }, [activeAppointment, setSelectedDocument, setShowPDFViewer])

  // Handlers per drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.appointment-room-controls')) return
    
    isDraggingRef.current = true
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  // ⚠️ NON fare early return qui - viola le Rules of Hooks!
  // Tutti gli hooks devono essere chiamati prima di qualsiasi return condizionale

  // appointmentData e appointmentId già dichiarati in alto (righe 19-20)
  const appointmentType = activeAppointment?.appointmentType || appointmentData?.tipologia_atto_nome || appointmentData?.appointment_type || 'Appuntamento'
  const appointmentDate = activeAppointment?.date || appointmentData?.date || ''
  const appointmentTime = activeAppointment?.time || appointmentData?.time || ''
  
  // 🔑 RECUPERA IL RUOLO E NOME DALLA SESSIONE CORRENTE (JWT Token / localStorage)
  const userRole = authService.getUserRole()
  const currentUser = authService.getUser()
  
  // Se l'utente è un notaio, usa il suo nome dalla sessione (nel notary_profile)
  const notaryName = (userRole === 'notaio' || userRole === 'notary' || userRole === 'admin')
    ? (currentUser?.notary_profile?.studio_name || 'Notaio')
    : (activeAppointment?.notaryName || appointmentData?.notaio_nome || 'Notaio')
  
  // NOME CLIENTE: usa SEMPRE il nome dall'appointment (come nelle mini card)
  // Il backend lo popola da richiedente.cliente.nome + richiedente.cliente.cognome
  const clientName = appointmentData?.client_name || 
                     appointmentData?.cliente_nome || 
                     appointmentData?.clientName || 
                     activeAppointment?.clientName || 
                     'Cliente'
  
  // ✅ Genera avatar con iniziali dal nome
  const getInitials = (name) => {
    if (!name || name === 'Cliente') return 'CL'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  // ✅ Genera colore avatar basato sul nome (sempre lo stesso per lo stesso nome)
  const getAvatarColor = (name) => {
    if (!name) return '#4FADFF'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#4FADFF', // Blu
      '#10B981', // Verde
      '#F59E0B', // Arancione
      '#EF4444', // Rosso
      '#8B5CF6', // Viola
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#F97316'  // Arancione scuro
    ]
    return colors[Math.abs(hash) % colors.length]
  }
  
  const clientInitials = getInitials(clientName)
  const clientAvatarColor = getAvatarColor(clientName)
  const clientAvatarUrl = appointmentData?.client_avatar_url || appointmentData?.cliente_avatar
  
  const notaryInitials = getInitials(notaryName)
  const notaryAvatarColor = getAvatarColor(notaryName)
  const notaryAvatarUrl = currentUser?.notary_profile?.avatar || appointmentData?.notaio_avatar
  
  // ✅ DEBUG: traccia render di AppointmentRoom
  console.log('🔄🔄🔄 AppointmentRoom RENDER - Timestamp:', new Date().getTime())
  console.log('📊 AppointmentRoom - appointmentData:', appointmentData)
  console.log('👤 Current user dalla sessione:', currentUser)
  console.log('🔍 appointmentData.client_name:', appointmentData?.client_name)
  console.log('🔍 appointmentData.cliente_nome:', appointmentData?.cliente_nome)
  console.log('🔍 appointmentData.clientName:', appointmentData?.clientName)
  console.log('👤 Notaio nome:', notaryName)
  console.log('👤 Cliente nome finale:', clientName)
  console.log('🎭 User role SESSIONE CORRENTE:', userRole)
  console.log('📍 Connection status:', connectionStatus)
  console.log('📄 showPDFViewer:', showPDFViewer)
  console.log('📄 selectedDocument:', selectedDocument?.id)

  // ✅ Memoizza l'array participants per evitare re-render infiniti
  // ✅ USA SOLO LE PROPRIETÀ SPECIFICHE come dipendenze, non gli oggetti interi
  const participants = useMemo(() => {
    if (!appointmentData || !currentUser) return []
    
    const participants = []
    const currentUserId = currentUser?.id
    
    // Aggiungi notaio (se non è l'utente corrente)
    const notaryId = appointmentData.notaio_id || appointmentData.notaio || currentUser?.id
    if (notaryId && notaryId !== currentUserId) {
      participants.push({ id: notaryId, name: notaryName, role: 'notaio' })
    }
    
    // Aggiungi cliente (se non è l'utente corrente)
    const clientId = appointmentData.client_id || 
                    appointmentData.cliente_id || 
                    appointmentData.richiedente?.cliente ||
                    appointmentData.richiedente_id ||
                    appointmentData.client
    
    if (clientId && clientId !== currentUserId) {
      participants.push({ id: clientId, name: clientName, role: 'cliente' })
    }
    
    return participants
  }, [
    appointmentData?.notaio_id,
    appointmentData?.notaio, 
    appointmentData?.client_id,
    appointmentData?.cliente_id,
    appointmentData?.richiedente_id,
    appointmentData?.richiedente?.cliente,
    appointmentData?.client,
    notaryName,
    clientName,
    currentUser?.id
  ])

  const handleClose = () => {
    setShowExitModal(true)
  }

  const handleConfirmExit = () => {
    exitAppointment()
  }

  // ✅ Memoizza currentUser per evitare re-render di CollaborativePDFViewer
  const memoizedCurrentUser = useMemo(() => authService.getUser(), [])

  // ✅ Memoizza onClose handler per evitare re-render di CollaborativePDFViewer
  const handlePDFClose = useCallback(() => {
    console.log('🚪 Chiusura PDF viewer')
    setShowPDFViewer(false)
    setSelectedDocument(null)
    
    // Se è il notaio, invia CLOSE_PDF al cliente
    if ((userRole === 'notaio' || userRole === 'admin') && wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
      wsVideoCallRef.current.send(JSON.stringify({
        type: 'CLOSE_PDF',
        userId: authService.getUser()?.id,
        userName: notaryName
      }))
      console.log('📡 Messaggio CLOSE_PDF inviato al cliente')
    }
  }, [userRole, notaryName])

  // ✅ Handler per chiudere Office Viewer (SOLO NOTAIO - non condiviso)
  const handleOfficeClose = useCallback(() => {
    console.log('🚪 Chiusura Office viewer (SOLO NOTAIO)')
    setShowOfficeViewer(false)
    setSelectedOfficeDocument(null)
  }, [])

  // ✅ Handler per upload documenti di studio (SOLO NOTAIO)
  const handleStudioUpload = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const appointmentId = activeAppointment?.id || appointmentData?.id
    if (!appointmentId) {
      console.error('❌ ID appuntamento mancante per upload studio')
      return
    }

    console.log('📤 Caricamento documento di studio:', file.name)
    setUploadingStudioDoc(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_name', file.name)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await fetch(
        `${apiUrl}/appointments/documenti-appuntamento/appuntamento/${appointmentId}/upload-studio/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il caricamento')
      }

      const result = await response.json()
      console.log('✅ Documento di studio caricato:', result)

      // ✅ Ricarica i documenti per mostrare il nuovo upload
      const docsResponse = await fetch(
        `${apiUrl}/appointments/documenti-appuntamento/appuntamento/${appointmentId}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocumenti(Array.isArray(docsData) ? docsData : docsData?.data || [])
      }

      // Reset input file
      event.target.value = ''
      
      // ✅ Mostra notifica di successo
      setNotificationModal({
        show: true,
        type: 'success',
        message: `Documento "${file.name}" caricato con successo`
      })
      
      // Chiudi automaticamente dopo 3 secondi
      setTimeout(() => {
        setNotificationModal({ show: false, type: 'success', title: '', message: '' })
      }, 3000)
    } catch (error) {
      console.error('❌ Errore upload documento di studio:', error)
      
      // ✅ Mostra notifica di errore
      setNotificationModal({
        show: true,
        type: 'error',
        message: `Errore durante il caricamento: ${error.message}`
      })
    } finally {
      setUploadingStudioDoc(false)
    }
  }, [activeAppointment, appointmentData])

  // ✅ Handler per aprire modale conferma eliminazione
  const openDeleteConfirm = useCallback((docId, docName) => {
    setDocumentToDelete({ id: docId, name: docName })
    setShowDeleteConfirm(true)
  }, [])

  // ✅ Handler per eliminare documento di studio (SOLO NOTAIO)
  const handleDeleteStudioDoc = useCallback(async () => {
    if (!documentToDelete) return

    console.log('🗑️ Eliminazione documento:', documentToDelete.id, documentToDelete.name)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await fetch(
        `${apiUrl}/appointments/documenti-appuntamento/${documentToDelete.id}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'eliminazione')
      }

      console.log('✅ Documento eliminato con successo')

      // ✅ Ricarica i documenti per aggiornare la lista
      const appointmentId = activeAppointment?.id || appointmentData?.id
      const docsResponse = await fetch(
        `${apiUrl}/appointments/documenti-appuntamento/appuntamento/${appointmentId}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocumenti(Array.isArray(docsData) ? docsData : docsData?.data || [])
      }
      
      // ✅ Mostra notifica di successo
      setNotificationModal({
        show: true,
        type: 'success',
        message: `Documento "${documentToDelete.name}" eliminato con successo`
      })
      
      // Chiudi automaticamente dopo 3 secondi
      setTimeout(() => {
        setNotificationModal({ show: false, type: 'success', title: '', message: '' })
      }, 3000)
    } catch (error) {
      console.error('❌ Errore eliminazione documento:', error)
      
      // ✅ Mostra notifica di errore
      setNotificationModal({
        show: true,
        type: 'error',
        message: `Errore durante l'eliminazione: ${error.message}`
      })
    }
  }, [activeAppointment, appointmentData, documentToDelete])

  // ✅ Handler per rimuovere utente dalla video e riportarlo in sala d'attesa
  const handleRemoveUserFromVideo = useCallback(() => {
    console.log('🚪 Rimozione cliente dalla video:', clientName)
    
    // ✅ Aggiorna SOLO gli stati relativi al cliente
    setIsClientAccepted(false)
    setIsClientOnline(false)
    setIsClientWaiting(true) // ✅ Cliente torna in sala d'attesa
    
    // ❌ NON modificare connectionStatus - quello è dello stato del NOTAIO!
    // Il notaio rimane connesso, solo il cliente viene rimosso
    
    // Invia messaggio WebSocket per disconnettere il cliente
    if (wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
      wsVideoCallRef.current.send(JSON.stringify({
        type: 'BLOCK_CLIENT',
        clientId: appointmentData?.client_id || appointmentData?.cliente_id,
        userId: authService.getUser()?.id
      }))
    }
    
    // ✅ Chiudi la modale
    setShowRemoveUserConfirm(false)
    
    console.log('✅ Cliente rimosso dalla video e riportato in sala d\'attesa')
  }, [clientName, appointmentData])

  // ✅ ORA possiamo fare il check condizionale DOPO aver chiamato tutti gli hooks
  if (!activeAppointment) {
    return null
  }

  // ✅ Se minimizzato, nascondi con CSS invece di smontare il componente
  // Questo mantiene attivo lo stream video e gli stati
  const appointmentRoomStyle = isMinimized ? { display: 'none' } : {}

  return (
    <div 
      ref={floatingRef}
      className={`appointment-room ${isFloating ? 'floating' : 'fullscreen'}`}
      style={isFloating ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        ...appointmentRoomStyle
      } : appointmentRoomStyle}
    >
      {/* Background animato */}
      <div className="appointment-room-background">
        <div className="appointment-shape appointment-shape-1"></div>
        <div className="appointment-shape appointment-shape-2"></div>
        <div className="appointment-shape appointment-shape-3"></div>
      </div>


      {/* Header con controlli */}
              {connectionStatus === 'connected' ? (
                /* Header completo con tutti i controlli quando connesso */
                <div
                  className="appointment-room-header"
                  onMouseDown={isFloating ? handleMouseDown : undefined}
                  style={{ cursor: isFloating && !isDraggingRef.current ? 'move' : 'default' }}
                >
                  <div className="appointment-room-title">
                    {appointmentType} - {notaryName}
                  </div>
                  
                  <div className="appointment-room-controls">
                    <button
                      className="appointment-control-btn"
                      onClick={toggleFloating}
                      title={isFloating ? "Espandi a schermo intero" : "Riduci a finestra"}
                    >
                      <Maximize2 size={20} />
                    </button>
                    <button
                      className="appointment-control-btn appointment-control-btn-minimize"
                      onClick={minimizeAppointment}
                      title="Metti in background"
                    >
                      <Minus size={20} />
                    </button>
                    <button
                      className="appointment-control-btn appointment-control-btn-close"
                      onClick={handleClose}
                      title="Chiudi"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
      ) : connectionStatus === 'waiting' ? (
        /* Header minimale sala d'attesa */
        <div className="appointment-room-header-minimal">
          <button
            className="appointment-control-btn appointment-control-btn-close"
            onClick={handleClose}
            title="Chiudi"
          >
            <X size={24} />
          </button>
        </div>
      ) : null}

      {/* Contenuto principale */}
      <div className="appointment-room-content">
        {connectionStatus === 'waiting' ? (
          /* SALA D'ATTESA - Vista semplificata per CLIENTE */
          <div className="appointment-waiting">
            {/* Animazione sala d'attesa */}
            <div className="waiting-animation">
              <div className="waiting-circle waiting-circle-1"></div>
              <div className="waiting-circle waiting-circle-2"></div>
              <div className="waiting-circle waiting-circle-3"></div>
            </div>

            <h2 className="waiting-title">
              Sei in sala d'attesa
            </h2>

            <p className="waiting-subtitle">
              Il notaio ti farà entrare a breve...
            </p>

            {/* Card info appuntamento compatta */}
            <div className="waiting-info-card">
              <div className="waiting-info-row">
                <span className="waiting-info-label">Notaio:</span>
                <span className="waiting-info-value">{notaryName}</span>
              </div>
              <div className="waiting-info-row">
                <span className="waiting-info-label">Atto:</span>
                <span className="waiting-info-value">{appointmentType}</span>
              </div>
              <div className="waiting-info-row">
                <span className="waiting-info-label">Quando:</span>
                <span className="waiting-info-value">
                  {appointmentDate} {appointmentTime && `· ${appointmentTime}`}
                </span>
              </div>
            </div>

            <div className="waiting-tip">
              <p>💡 Assicurati che la tua webcam e il microfono siano funzionanti</p>
            </div>
          </div>
        ) : (
          /* VIDEO CHIAMATA - Vista diversa per NOTAIO vs CLIENTE/PARTNER */
          <div className="appointment-connected">
            {(userRole === 'cliente' || userRole === 'client' || userRole === 'partner') ? (
              /* LAYOUT CLIENTE/PARTNER: Video a schermo intero + Chat a scomparsa */
              <div className="video-call-layout video-call-layout-client">
                {/* Card video a schermo intero */}
                <div className={`video-client-main ${showChat ? 'chat-open' : ''}`}>
                  <div className="video-card video-card-client">
                    {/* Timer in alto a sinistra */}
                    <CallTimer connectionStatus={connectionStatus} />
                    
                    {/* Video feed - Cliente vede: il proprio video + video del notaio */}
                    <div className="video-feed">
                      <div className="video-participants-grid">
                        {/* Video del NOTAIO (principale) */}
                        <div className="video-participant-box">
                          {/* TODO: Stream WebRTC reale del notaio */}
                          <div className="video-participant-placeholder">
                            <div 
                              className="video-participant-avatar notary-avatar"
                              style={{
                                backgroundColor: notaryAvatarUrl ? 'transparent' : notaryAvatarColor,
                                backgroundImage: notaryAvatarUrl ? `url(${notaryAvatarUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '28px'
                              }}
                              title={notaryName}
                            >
                              {notaryAvatarUrl ? null : notaryInitials}
                            </div>
                            <p className="video-participant-name">{notaryName}</p>
                            <p className="video-participant-status">
                              Connesso
                            </p>
                          </div>
                          <div className="video-participant-label">
                            <Users size={12} />
                            <span>{notaryName}</span>
                            {isMicOn && (
                              <span className="audio-enabled-badge" title="Audio attivo">🔊</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Video del CLIENTE stesso */}
                        <div className="video-participant-box">
                          {isCameraOn && mediaStream ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted={true}
                                className="video-participant-stream"
                              />
                              <div className="video-participant-label">
                                <Users size={12} />
                                <span>Tu ({clientName})</span>
                                {isMicOn && (
                                  <Mic size={10} className="video-mic-indicator" />
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="video-participant-placeholder">
                              <div className="video-participant-avatar">
                                <Users size={48} />
                              </div>
                              <p className="video-participant-name">Tu ({clientName})</p>
                              <p className="video-participant-status">
                                {isCameraOn ? 'Connessione...' : 'Camera spenta'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Controlli video */}
                    <div className="video-controls">
                      <button 
                        className={`video-control-btn ${!isCameraOn ? 'disabled' : ''}`}
                        onClick={toggleCamera}
                        title={isCameraOn ? 'Disattiva camera' : 'Attiva camera'}
                      >
                        {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </button>
                      
                      <button 
                        className={`video-control-btn ${!isMicOn ? 'disabled' : ''}`}
                        onClick={toggleMic}
                        title={isMicOn ? 'Disattiva microfono' : 'Attiva microfono'}
                      >
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      
                      <button 
                        className="video-control-btn hangup"
                        onClick={handleHangup}
                        title="Termina chiamata"
                      >
                        <Phone size={20} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        title={isScreenSharing ? 'Interrompi condivisione' : 'Condividi schermo'}
                      >
                        <Monitor size={18} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${showChat ? 'active' : ''}`}
                        onClick={() => setShowChat(!showChat)}
                        title={showChat ? 'Chiudi chat' : 'Apri chat'}
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Chat sidebar a scomparsa (slide da destra) */}
                <div className={`video-chat-sidebar video-chat-sidebar-client ${showChat ? 'open' : ''}`}>
                  <div className="chat-header">
                    <MessageSquare size={18} />
                    <span>Chat</span>
                    <button className="chat-close-btn" onClick={() => setShowChat(false)} title="Chiudi chat">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="chat-messages">
                    <div className="chat-placeholder">
                      <MessageSquare size={48} />
                      <p>
                        Nessun messaggio
                      </p>
                    </div>
                  </div>
                  <div className="chat-input">
                    <input type="text" placeholder="Scrivi un messaggio..." />
                    <button className="chat-send-btn">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LAYOUT NOTAIO: Grid 2 righe x 3 colonne */
              <div className="video-call-layout-notary">
                {/* Prima riga: Contenitore Video Grid + Chat */}
                <div className="notary-top-row">
                  {/* Contenitore Video Grid Dinamico (1-4 video) */}
                  <div className="video-grid-container">
                    {/* Timer in alto a sinistra */}
                    <CallTimer connectionStatus={connectionStatus} />
                    
                    {/* Grid video dinamica - ✅ Mostra 1 video se cliente offline, 2 se online */}
                    <div className={`video-grid video-grid-${isClientOnline ? 2 : 1}`}>
                      {/* Video del notaio (sempre visibile, schermo pieno se cliente non connesso) */}
                      <div className="video-grid-item">
                        {isCameraOn && mediaStream ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted={true}
                              className="video-stream"
                            />
                            <div className="video-label">
                              <Users size={12} />
                              <span>Tu ({notaryName})</span>
                              {isMicOn && (
                                <Mic size={10} className="video-mic-indicator" />
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="video-placeholder">
                            <div 
                              className="video-avatar notary-avatar"
                              style={{
                                backgroundColor: notaryAvatarUrl ? 'transparent' : notaryAvatarColor,
                                backgroundImage: notaryAvatarUrl ? `url(${notaryAvatarUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '24px'
                              }}
                              title={notaryName}
                            >
                              {notaryAvatarUrl ? null : notaryInitials}
                            </div>
                            <p className="video-name">Tu ({notaryName})</p>
                            <p className="video-status">
                              {isCameraOn ? 'Connessione...' : 'Camera spenta'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* ✅ Video cliente: SOLO se accettato E online */}
                      {isClientAccepted && isClientOnline && clientName && clientName !== 'Cliente' && (
                        <div className="video-grid-item">
                          <div className="video-placeholder">
                            <div 
                              className="video-avatar"
                              style={{
                                backgroundColor: clientAvatarUrl ? 'transparent' : clientAvatarColor,
                                backgroundImage: clientAvatarUrl ? `url(${clientAvatarUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '16px'
                              }}
                              title={clientName}
                            >
                              {clientAvatarUrl ? null : clientInitials}
                            </div>
                            <p className="video-name">{clientName}</p>
                            <p className="video-status">Connesso</p>
                          </div>
                          <div className="video-label">
                            <Users size={12} />
                            <span>{clientName}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* TODO: Aggiungi qui partecipanti 3 e 4 quando implementi WebRTC */}
                    </div>
                    
                    {/* Mini-cards per partecipanti oltre i 4 */}
                    {/* TODO: Mostrare quando ci sono più di 4 partecipanti */}
                    {false && ( // Placeholder - attivare quando ci sono più di 4 partecipanti
                      <div className="video-mini-cards">
                        {/* Esempio mini-card per partecipante 5+ */}
                        <div className="video-mini-card">
                          <div className="video-placeholder">
                            <div className="video-avatar">
                              <Users size={20} />
                            </div>
                            <p className="video-name">Partecipante 5</p>
                          </div>
                          <div className="video-label">
                            <Users size={10} />
                            <span>P5</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Controlli video */}
                    <div className="video-controls">
                      <button 
                        className={`video-control-btn ${!isCameraOn ? 'disabled' : ''}`}
                        onClick={toggleCamera}
                        title={isCameraOn ? 'Disattiva camera' : 'Attiva camera'}
                      >
                        {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </button>
                      
                      <button 
                        className={`video-control-btn ${!isMicOn ? 'disabled' : ''}`}
                        onClick={toggleMic}
                        title={isMicOn ? 'Disattiva microfono' : 'Attiva microfono'}
                      >
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      
                      <button 
                        className="video-control-btn hangup"
                        onClick={handleHangup}
                        title="Termina chiamata"
                      >
                        <Phone size={20} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        title={isScreenSharing ? 'Interrompi condivisione' : 'Condividi schermo'}
                      >
                        <Monitor size={18} />
                      </button>
                    </div>
                    
                    {/* Icona fullscreen in alto a destra */}
                    <button className="video-fullscreen-btn" title="Schermo intero">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                
                {/* Card Chat */}
                <div className="video-chat-sidebar-notary">
                  <div className="card-header">
                    <MessageSquare size={18} />
                    <h3>Chat</h3>
                  </div>
                  <div className="chat-messages">
                    <div className="chat-placeholder">
                      <MessageSquare size={48} />
                      <p>
                        Nessun messaggio
                      </p>
                    </div>
                  </div>
                  <div className="chat-input">
                    <input type="text" placeholder="Scrivi un messaggio..." />
                    <button className="chat-send-btn">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Seconda riga: Documenti + Prossimi Appuntamenti + Partecipanti */}
              <div className="notary-bottom-row">
                  {/* Card Documenti Atto */}
                  <div className="documents-card">
                    <div className="card-header">
                      <FileText size={18} />
                      <h3>
                        {appointmentData?.tipologia_atto_nome || 'Atto'} 
                        {protocolloInfo?.numero_protocollo && ` - N. Protocollo ${protocolloInfo.numero_protocollo}`}
                        {appointmentData?.start_time && (() => {
                          const date = new Date(appointmentData.start_time)
                          const dateStr = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                          return ` - ${dateStr} ${timeStr}`
                        })()}
                      </h3>
                    </div>
                    <div className="documents-content-wrapper">
                      {/* SEZIONE 1: BOX AZZURRO - Template Atto (SOLO PDF GENERATO) */}
                      {(() => {
                        // ✅ Mostra nel BOX AZZURRO solo se il template è un PDF (generato da "CREA ATTO")
                        // Il documento Word rimane in "Documenti di Studio" per modifiche
                        if (!templateInfo) {
                          console.log('📦 BOX AZZURRO: templateInfo è null/undefined')
                          return null
                        }
                        
                        const filePath = templateInfo.file_url || templateInfo.template_url || templateInfo.template_file
                        console.log('📦 BOX AZZURRO - Template Info:', {
                          file_url: templateInfo.file_url,
                          template_url: templateInfo.template_url,
                          template_file: templateInfo.template_file,
                          filePath_usato: filePath
                        })
                        
                        const isPDF = filePath && (
                          filePath.toLowerCase().endsWith('.pdf') ||
                          filePath.toLowerCase().includes('.pdf')
                        )
                        
                        console.log('📦 BOX AZZURRO - Check PDF:', {
                          filePath,
                          isPDF,
                          toLowerCase: filePath?.toLowerCase(),
                          endsWith_pdf: filePath?.toLowerCase().endsWith('.pdf'),
                          includes_pdf: filePath?.toLowerCase().includes('.pdf')
                        })
                        
                        // ✅ BOX AZZURRO: Mostra SOLO PDF generato, NON il Word
                        if (!isPDF) {
                          console.log('❌ BOX AZZURRO NASCOSTO - Template Word (visibile in "Documenti di Studio"):', filePath)
                          return null
                        }
                        
                        console.log('✅ BOX AZZURRO VISIBILE - Template PDF:', filePath)
                        
                        return (
                          <div className="template-document-section">
                            <div 
                              className="template-document-item"
                              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                
                                console.log('\n========================================')
                                console.log('🎯 CLICK PDF TEMPLATE DAL BOX AZZURRO')
                                console.log('========================================')
                                console.log('📄 File Path:', filePath)
                                console.log('📋 Template Info:', templateInfo)
                                console.log('📌 Stato viewer PRIMA del click:')
                                console.log('   showPDFViewer:', showPDFViewer)
                                console.log('   showOfficeViewer:', showOfficeViewer)
                                console.log('   selectedDocument:', selectedDocument)
                                console.log('   selectedOfficeDocument:', selectedOfficeDocument)
                                
                                const docWithAppointment = {
                                  id: templateInfo.id,
                                  document_id: templateInfo.id,
                                  file_path: filePath,  // ✅ file_path reale determina il viewer
                                  filename: templateInfo.original_filename || templateInfo.act_type_name || 'Template',
                                  document_type_name: templateInfo.act_type_name,
                                  appuntamento_id: activeAppointment?.id || appointmentData?.id,
                                  appointment_id: activeAppointment?.id || appointmentData?.id,
                                  isTemplate: true
                                }
                                
                                console.log('📄 Documento preparato:', docWithAppointment)
                                console.log('🔒 Chiudo Office Viewer...')
                                
                                // ✅ CHIUDI ESPLICITAMENTE l'Office viewer
                                setShowOfficeViewer(false)
                                setSelectedOfficeDocument(null)
                                
                                console.log('📂 Apro PDF Viewer...')
                                
                                // ✅ APRI il PDF viewer
                                setSelectedDocument(docWithAppointment)
                                setShowPDFViewer(true)
                                
                                // ✅ CONDIVISIONE CON CLIENTE: Invia messaggio WebSocket OPEN_PDF
                                // Solo se il notaio apre il PDF dal BOX AZZURRO
                                if (userRole === 'notaio' || userRole === 'admin') {
                                  console.log('📡 BOX AZZURRO: Invio OPEN_PDF al cliente...')
                                  
                                  const sendOpenPdfMessage = () => {
                                    if (wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
                                      const message = {
                                        type: 'OPEN_PDF',
                                        document: docWithAppointment,
                                        userId: authService.getUser()?.id,
                                        userName: notaryName,
                                        userRole: userRole
                                      }
                                      console.log('📡 Invio messaggio OPEN_PDF (BOX AZZURRO):', message)
                                      wsVideoCallRef.current.send(JSON.stringify(message))
                                      console.log('✅ Messaggio OPEN_PDF inviato con successo')
                                    } else {
                                      console.error('❌ WebSocket non connesso! readyState:', wsVideoCallRef.current?.readyState)
                                      console.error('   Tentativo di riconnessione...')
                                      
                                      // Riconnetti WebSocket
                                      const wsUrl = `ws://localhost:8000/ws/pdf/${activeAppointment?.id || appointmentData?.id}/`
                                      const newWs = new WebSocket(wsUrl)
                                      
                                      newWs.onopen = () => {
                                        console.log('✅ [VIDEO CALL WS] Riconnesso!')
                                        wsVideoCallRef.current = newWs
                                        
                                        // Invia JOIN_CALL
                                        newWs.send(JSON.stringify({
                                          type: 'JOIN_CALL',
                                          userId: authService.getUser()?.id,
                                          userName: notaryName,
                                          userRole: userRole
                                        }))
                                        
                                        // Invia OPEN_PDF
                                        newWs.send(JSON.stringify({
                                          type: 'OPEN_PDF',
                                          document: docWithAppointment,
                                          userId: authService.getUser()?.id,
                                          userName: notaryName,
                                          userRole: userRole
                                        }))
                                        console.log('✅ Messaggio OPEN_PDF inviato dopo riconnessione')
                                      }
                                      
                                      newWs.onerror = (error) => {
                                        console.error('❌ Errore riconnessione WebSocket:', error)
                                      }
                                      
                                      newWs.onmessage = (event) => {
                                        try {
                                          const data = JSON.parse(event.data)
                                          console.log('📨 [VIDEO CALL WS] Messaggio ricevuto:', data, 'userRole:', userRole)
                                          
                                          switch (data.type) {
                                            case 'OPEN_PDF':
                                              if (userRole !== 'notaio' && userRole !== 'admin') {
                                                console.log('✅ [VIDEO CALL WS] Cliente: APRO PDF viewer automaticamente!')
                                                setSelectedDocument(data.document)
                                                setShowPDFViewer(true)
                                              }
                                              break
                                              
                                            case 'CLOSE_PDF':
                                              if (userRole !== 'notaio' && userRole !== 'admin') {
                                                setShowPDFViewer(false)
                                                setSelectedDocument(null)
                                              }
                                              break
                                              
                                            default:
                                              console.log('ℹ️ [VIDEO CALL WS] Tipo messaggio:', data.type)
                                          }
                                        } catch (error) {
                                          console.error('❌ [VIDEO CALL WS] Errore parsing messaggio:', error)
                                        }
                                      }
                                      
                                      newWs.onclose = (event) => {
                                        console.log('🔌 [VIDEO CALL WS] CHIUSO - Code:', event.code, 'Reason:', event.reason)
                                      }
                                    }
                                  }
                                  
                                  sendOpenPdfMessage()
                                }
                                
                                console.log('✅ Comandi inviati:')
                                console.log('   setShowOfficeViewer(false)')
                                console.log('   setSelectedOfficeDocument(null)')
                                console.log('   setSelectedDocument(docWithAppointment)')
                                console.log('   setShowPDFViewer(true)')
                                console.log('   + WebSocket OPEN_PDF (se notaio)')
                                console.log('========================================\n')
                              }}
                              title="Clicca per visualizzare il PDF dell'atto"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <div className="template-icon-wrapper">
                                  {(() => {
                                    const appointmentData = activeAppointment?.rawData || activeAppointment
                                    const tipologiaCode = appointmentData?.tipologia_atto_code || appointmentData?.appointment_type
                                    
                                    // Cerca l'icona dalla configurazione frontend
                                    const tipologieAtti = getTipologieAtti()
                                    const tipologiaAtto = tipologieAtti.find(t => 
                                      t.code.toLowerCase().includes(tipologiaCode?.toLowerCase()) || 
                                      tipologiaCode?.toLowerCase().includes(t.id.toLowerCase())
                                    )
                                    
                                    const iconName = tipologiaAtto?.iconName || appointmentData?.tipologia_atto_icon || 'FileText'
                                    const IconComponent = ICON_MAP[iconName] || FileText
                                    return <IconComponent size={20} />
                                  })()}
                                </div>
                                <div className="template-info">
                                  <strong>{templateInfo.act_type_name} (PDF)</strong>
                                  <span className="template-client-name">{appointmentData?.client_name || 'Cliente'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                      
                      {/* SEZIONE 2: Documenti Cliente (Cartelle Espandibili) */}
                      <div className="client-documents-section">
                        {documenti.length > 0 ? (
                          (() => {
                            const categories = groupDocumentsByCategory(documenti)
                            return Object.entries(categories).map(([key, category]) => {
                              if (category.docs.length === 0) return null
                              const isExpanded = expandedFolders.includes(key)
                              
                              return (
                                <div key={key} className="document-folder">
                                  <div 
                                    className="folder-header"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                  >
                                    <div 
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }}
                                      onClick={() => toggleFolder(key)}
                                    >
                                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      <Folder size={16} />
                                      <span>{category.name}</span>
                                    </div>
                                    
                                    {/* ✅ Pulsante Upload solo per "Documenti di Studio" */}
                                    {key === 'studio' && userRole === 'notaio' && (
                                      <button
                                        className="studio-upload-btn"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          studioFileInputRef.current?.click()
                                        }}
                                        disabled={uploadingStudioDoc}
                                        title="Carica documento di studio"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: uploadingStudioDoc ? 'wait' : 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'var(--primary-color, #0066cc)',
                                          opacity: uploadingStudioDoc ? 0.5 : 1
                                        }}
                                      >
                                        <Upload size={18} />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="folder-content">
                                      {category.docs.map((doc) => (
                          <div 
                            key={doc.id} 
                            className="document-item document-item-clickable"
                            onClick={() => {
                              if (doc.file_path) {
                                // ✅ REGOLA FISSA: detectFileType usa file_path reale
                                // Solo doc/docx/xls/xlsx/ppt/pptx → LibreOffice Collabora
                                // Tutto il resto (PDF, immagini, etc.) → Nostro viewer o download
                                const fileType = detectFileType(doc)
                                const isOffice = isOfficeDocument(fileType)
                                
                                console.log('📄 Click documento:', doc.document_type_name)
                                console.log('   file_path:', doc.file_path)
                                console.log('   fileType:', fileType, '| isOffice:', isOffice)
                                
                                if (isOffice) {
                                  // ✅ Documenti Office → LibreOffice Collabora
                                  console.log('→ Apro con LibreOffice Collabora')
                                  setSelectedOfficeDocument(doc)
                                  setShowOfficeViewer(true)
                                } else {
                                  // ✅ PDF/Immagini → Nostro viewer (in nuova tab per ora)
                                  console.log('→ Apro con nostro viewer/browser')
                                  window.open(doc.file_path, '_blank')
                                }
                              } else {
                                console.warn('File non disponibile per:', doc.document_type_name)
                              }
                            }}
                            title="Clicca per visualizzare il documento"
                          >
                            <div className="document-info">
                              <FileText size={14} className="document-icon" />
                              <div className="document-details">
                                <span className="document-name">{doc.document_type_name || doc.document_type?.name || 'Documento'}</span>
                                {/* ✅ Data e ora ultimo aggiornamento */}
                                {doc.updated_at && (
                                  <span className="document-date">
                                    {new Date(doc.updated_at).toLocaleString('it-IT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Icone azioni documento */}
                            <div className="document-actions">
                              {/* ✅ LOGICA DIVERSA per cartella Studio vs Cliente */}
                              {key === 'studio' ? (
                                /* 🗑️ Solo icona cestino per "Documenti di Studio" (escluso template) */
                                (() => {
                                  const docName = (doc.document_type_name || '').toLowerCase()
                                  const isTemplate = docName.includes('template') || docName.includes('atto notarile')
                                  
                                  // ❌ Template NON si può eliminare (versioning specifico)
                                  if (isTemplate) return null
                                  
                                  // ✅ Altri documenti possono essere eliminati
                                  return (
                                    <button 
                                      className="document-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDeleteConfirm(doc.id, doc.document_type_name || 'Documento')
                                      }}
                                      title="Elimina documento"
                                      style={{ color: '#dc3545' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )
                                })()
                              ) : (
                                /* 📤 Icone complete per "Documenti Cliente" */
                                <>
                                  {/* ✅ Pulsante Condividi - SOLO per PDF e immagini, NON per Office */}
                                  {(() => {
                                    const fileType = detectFileType(doc)
                                    const isOffice = isOfficeDocument(fileType)
                                    if (isOffice) return null // ❌ NON mostrare condividi per Office
                                    
                                    return (
                                  <button 
                                    className="document-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      console.log('📤 Condividi PDF in realtime:', doc.document_type_name)
                                  
                                  // Aggiungi appointment_id al documento per WebSocket
                                  const docWithAppointment = {
                                    ...doc,
                                    appuntamento_id: activeAppointment?.id || appointmentData?.id,
                                    appointment_id: activeAppointment?.id || appointmentData?.id
                                  }
                                  console.log('📄 Documento con appointment_id:', docWithAppointment)
                                  
                                  // ✅ CONDIVISIONE SOLO PDF - Office escluso
                                  console.log('📄 Apertura PDF viewer condiviso per:', doc.document_type_name)
                                  setSelectedDocument(docWithAppointment)
                                  setShowPDFViewer(true)
                                  
                                  // Invia messaggio WebSocket per aprire il PDF anche per il cliente
                                  const sendOpenPdfMessage = () => {
                                      if (wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
                                        const message = {
                                          type: 'OPEN_PDF',
                                          document: docWithAppointment,
                                          userId: authService.getUser()?.id,
                                          userName: notaryName,
                                          userRole: userRole
                                        }
                                        console.log('📡 Invio messaggio OPEN_PDF:', message)
                                        wsVideoCallRef.current.send(JSON.stringify(message))
                                        console.log('✅ Messaggio OPEN_PDF inviato con successo')
                                      } else {
                                      console.error('❌ WebSocket non connesso! readyState:', wsVideoCallRef.current?.readyState)
                                      console.error('   Tentativo di riconnessione...')
                                      
                                      // Riconnetti WebSocket
                                      const wsUrl = `ws://localhost:8000/ws/pdf/${activeAppointment?.id || appointmentData?.id}/`
                                      const newWs = new WebSocket(wsUrl)
                                      
                                      newWs.onopen = () => {
                                        console.log('✅ [VIDEO CALL WS] Riconnesso!')
                                        wsVideoCallRef.current = newWs
                                        
                                        // Invia JOIN_CALL
                                        newWs.send(JSON.stringify({
                                          type: 'JOIN_CALL',
                                          userId: authService.getUser()?.id,
                                          userName: notaryName,
                                          userRole: userRole
                                        }))
                                        
                                        // Invia OPEN_PDF
                                        newWs.send(JSON.stringify({
                                          type: 'OPEN_PDF',
                                          document: docWithAppointment,
                                          userId: authService.getUser()?.id,
                                          userName: notaryName,
                                          userRole: userRole
                                        }))
                                        console.log('✅ Messaggio OPEN_PDF inviato dopo riconnessione')
                                      }
                                      
                                      newWs.onerror = (error) => {
                                        console.error('❌ Errore riconnessione WebSocket:', error)
                                      }
                                      
                                      newWs.onmessage = (event) => {
                                        try {
                                          const data = JSON.parse(event.data)
                                          console.log('📨 [VIDEO CALL WS] Messaggio ricevuto:', data, 'userRole:', userRole)
                                          
                                          switch (data.type) {
                                            case 'OPEN_PDF':
                                              if (userRole !== 'notaio' && userRole !== 'admin') {
                                                console.log('✅ [VIDEO CALL WS] Cliente: APRO PDF viewer automaticamente!')
                                                setSelectedDocument(data.document)
                                                setShowPDFViewer(true)
                                              }
                                              break
                                              
                                            case 'CLOSE_PDF':
                                              if (userRole !== 'notaio' && userRole !== 'admin') {
                                                setShowPDFViewer(false)
                                                setSelectedDocument(null)
                                              }
                                              break
                                              
                                            default:
                                              console.log('ℹ️ [VIDEO CALL WS] Tipo messaggio:', data.type)
                                          }
                                        } catch (error) {
                                          console.error('❌ [VIDEO CALL WS] Errore parsing messaggio:', error)
                                        }
                                      }
                                      
                                      newWs.onclose = (event) => {
                                        console.log('🔌 [VIDEO CALL WS] CHIUSO - Code:', event.code, 'Reason:', event.reason)
                                      }
                                    }
                                  }
                                  
                                  sendOpenPdfMessage()
                                }}
                                title="Condividi PDF in realtime"
                              >
                                <Share2 size={14} />
                              </button>
                                )
                              })()}
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('✍️ Firma documento:', doc.document_type_name)
                                  // TODO: Implementare firma digitale
                                }}
                                title="Firma documento"
                              >
                                <PenTool size={14} />
                              </button>
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📦 Conservazione:', doc.document_type_name)
                                  // TODO: Implementare conservazione sostitutiva
                                }}
                                title="Conservazione sostitutiva"
                              >
                                <Archive size={14} />
                              </button>
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📧 Invia via PEC:', doc.document_type_name)
                                  // TODO: Implementare invio PEC
                                }}
                                title="Invia via PEC"
                              >
                                <Mail size={14} />
                              </button>
                                </>
                              )}
                            </div>
                          </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          })()
                        ) : (
                          <p className="documents-empty">Nessun documento caricato</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Prossimi Appuntamenti */}
                  <div className="next-meeting-card">
                  <div className="card-header">
                    <Clock size={18} />
                    <h3>Prossimi Appuntamenti</h3>
                  </div>
                  <div className="next-meeting-list">
                    {/* TODO: Questi saranno sostituiti con dati reali dal backend */}
                    {/* Appuntamento 1 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Compravendita Immobiliare</div>
                        <div className="next-meeting-client">Mario Rossi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Oggi - 16:30</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 2 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Testamento</div>
                        <div className="next-meeting-client">Laura Bianchi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Oggi - 18:00</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 3 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Procura</div>
                        <div className="next-meeting-client">Giuseppe Verdi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Domani - 10:00</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 4 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Donazione</div>
                        <div className="next-meeting-client">Anna Ferrari</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>26 Ott - 14:30</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Partecipanti */}
                <div className="meeting-room-card">
                    <div className="card-header">
                      <Users size={18} />
                      <h3>Partecipanti</h3>
                    </div>
                    <div className="meeting-room-list">
                      {/* ✅ Mostra partecipante SOLO se è in attesa o già connesso */}
                      {(() => {
                        console.log('🎨 Rendering lista partecipanti:')
                        console.log('   isClientWaiting:', isClientWaiting)
                        console.log('   isClientAccepted:', isClientAccepted)
                        console.log('   → Mostra:', (isClientWaiting || isClientAccepted) ? 'CLIENTE' : 'PLACEHOLDER')
                        return (isClientWaiting || isClientAccepted)
                      })() ? (
                        <div className="participant-waiting-item">
                          <div className="participant-waiting-info">
                            <div 
                              className="participant-waiting-avatar"
                              style={{
                                backgroundColor: clientAvatarUrl ? 'transparent' : clientAvatarColor,
                                backgroundImage: clientAvatarUrl ? `url(${clientAvatarUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '50%',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '11px'
                              }}
                              title={clientName}
                            >
                              {clientAvatarUrl ? null : clientInitials}
                            </div>
                            <span className="participant-waiting-name">
                              {clientName}
                            </span>
                          </div>
                          
                          {/* ✅ CONTROLLI SEMPRE VISIBILI quando partecipante è presente */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* ✅ Badge stato - Solo se in sala d'attesa */}
                            {!isClientAccepted && (
                              <div className="waiting-badge">
                                <Clock size={10} />
                                <span>Sala d'Attesa</span>
                              </div>
                            )}
                            
                            {/* ✅ Pulsante Accetta - Solo quando cliente è connesso in sala d'attesa */}
                            <div className="participant-waiting-actions">
                              {!isClientAccepted && isClientWaiting && (
                                <button className="accept-guest-btn" onClick={handleAcceptGuest}>
                                  Accetta
                                </button>
                              )}
                            </div>
                            
                            {/* ✅ Controlli icone: SOLO quando cliente è online in video */}
                            {isClientAccepted && isClientOnline && (
                              <div className="participant-control-actions">
                              {/* Rimuovi - Riporta alla sala d'attesa */}
                              <button 
                                className="participant-control-btn participant-control-btn-block"
                                onClick={() => setShowRemoveUserConfirm(true)}
                                title="Rimuovi dalla video (torna in sala d'attesa)"
                              >
                                <UserMinus size={14} />
                              </button>
                              
                              {/* Forza Video */}
                              <button 
                                className={`participant-control-btn ${isClientCameraForced ? 'active' : ''}`}
                                onClick={handleToggleForceCamera}
                                title={isClientCameraForced ? 'Camera forzata sempre ON' : 'Forza camera sempre ON'}
                              >
                                {isClientCameraForced ? <Video size={14} /> : <VideoOff size={14} />}
                              </button>
                              
                              {/* Forza Audio */}
                              <button 
                                className={`participant-control-btn ${isClientMicForced ? 'active' : ''}`}
                                onClick={handleToggleForceMic}
                                title={isClientMicForced ? 'Microfono forzato sempre ON' : 'Forza microfono sempre ON'}
                              >
                                {isClientMicForced ? <Mic size={14} /> : <MicOff size={14} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      ) : (
                        /* ✅ Placeholder elegante quando nessuno è in sala d'attesa */
                        <div className="participant-placeholder">
                          <Users size={48} />
                          <p>
                            Nessun partecipante in sala d'attesa
                          </p>
                        </div>
                      )}
                      
                      {/* Slot vuoti per altri partecipanti */}
                      <div className="participant-empty-slot"></div>
                      <div className="participant-empty-slot"></div>
                      <div className="participant-empty-slot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      

      {/* Modale conferma uscita */}
      {showExitModal && (
        <ConfirmExitAppointmentModal
          onClose={() => setShowExitModal(false)}
          onConfirm={handleConfirmExit}
        />
      )}
      
      {/* Modale conferma accettazione ospite */}
      {showAcceptGuestModal && (
        <AcceptGuestModal
          clientName={clientName}
          onClose={() => setShowAcceptGuestModal(false)}
          onConfirm={confirmAcceptGuest}
        />
      )}
      
      {/* Lettore PDF Collaborativo */}
      {(() => {
        const shouldShowPDFViewer = showPDFViewer && selectedDocument
        console.log('🖥️ Render PDF Viewer:', shouldShowPDFViewer, { showPDFViewer, hasSelectedDocument: !!selectedDocument })
        
        if (shouldShowPDFViewer) {
          return (
            <CollaborativePDFViewer
              document={selectedDocument}
              appointmentId={appointmentId}
              onClose={handlePDFClose}
              userRole={userRole}
              participants={participants}
              currentUser={memoizedCurrentUser}
            />
          )
        }
        return null
      })()}
      
      {/* Lettore Office (Word, Excel, PowerPoint) - SOLO NOTAIO */}
      {(() => {
        const shouldShowOfficeViewer = showOfficeViewer && selectedOfficeDocument
        console.log('🖥️ Render Office Viewer:', shouldShowOfficeViewer, { showOfficeViewer, hasSelectedOfficeDocument: !!selectedOfficeDocument })
        
        if (!shouldShowOfficeViewer) return null
        
        return (
        <div className="pdf-viewer-overlay">
          <div className="pdf-viewer-container">
            {/* Header identico al PDF viewer */}
            <div className="pdf-viewer-header">
              <div className="pdf-viewer-title">
                {(() => {
                  // Trova icona dall'atto come nel template
                  const appointmentData = activeAppointment?.rawData || activeAppointment
                  const tipologiaCode = appointmentData?.tipologia_atto_code || appointmentData?.appointment_type
                  
                  const tipologieAtti = getTipologieAtti()
                  const tipologiaAtto = tipologieAtti.find(t => 
                    t.code.toLowerCase().includes(tipologiaCode?.toLowerCase()) || 
                    tipologiaCode?.toLowerCase().includes(t.id.toLowerCase())
                  )
                  
                  const iconName = tipologiaAtto?.iconName || appointmentData?.tipologia_atto_icon || 'FileText'
                  const IconComponent = ICON_MAP[iconName] || FileText
                  return <IconComponent size={20} />
                })()}
                <h3>{appointmentData?.tipologia_atto_nome || (activeAppointment?.rawData || activeAppointment)?.tipologia_atto_nome || 'Documento'}</h3>
              </div>
              
              <div className="pdf-viewer-header-controls">
                <button 
                  className="pdf-viewer-btn"
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    console.log('🎯 Click su CREA ATTO')
                    console.log('📋 Dati disponibili:', {
                      selectedOfficeDocument,
                      appointmentId,
                      hasAuthToken: !!authService.getAccessToken()
                    })
                    
                    try {
                      console.log('🔄 Conversione Word → PDF in corso...')
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                      const token = authService.getAccessToken()
                      
                      if (!token) {
                        throw new Error('Token di autenticazione non disponibile')
                      }
                      
                      if (!selectedOfficeDocument?.id) {
                        throw new Error('ID documento non disponibile')
                      }
                      
                      if (!appointmentId) {
                        throw new Error('ID appuntamento non disponibile')
                      }
                      
                      const requestBody = {
                        document_id: selectedOfficeDocument.id,
                        appointment_id: appointmentId
                      }
                      
                      console.log('📤 Invio richiesta a:', `${apiUrl}/acts/convert-template-to-pdf/`)
                      console.log('📤 Body:', requestBody)
                      
                      const response = await fetch(`${apiUrl}/acts/convert-template-to-pdf/`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(requestBody)
                      })
                      
                      console.log('📥 Risposta status:', response.status)
                      
                      const data = await response.json()
                      console.log('📥 Risposta data:', data)
                      
                      if (response.status === 501) {
                        alert('⚠️ ' + (data.message || 'Funzionalità in sviluppo'))
                        return
                      }
                      
                      if (!response.ok) {
                        throw new Error(data.error || `Errore conversione PDF (${response.status})`)
                      }
                      
                      console.log('✅ PDF creato con successo:', data)
                      
                      // Chiudi viewer
                      handleOfficeClose()
                      
                      // Forza ricaricamento della pagina per mostrare il PDF nel BOX AZZURRO
                      alert('✅ PDF creato nel BOX AZZURRO! Ricarico la pagina...')
                      window.location.reload()
                    } catch (error) {
                      console.error('❌ Errore completo:', error)
                      alert('❌ Errore: ' + error.message)
                    }
                  }}
                  title="Converti in PDF e salva come atto"
                  style={{
                    background: '#10b981',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileText size={18} />
                  CREA ATTO
                </button>
                
                <button 
                  className="pdf-viewer-btn pdf-viewer-btn-close"
                  onClick={handleOfficeClose}
                  title="Chiudi"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <LibreOfficeViewer
                documentId={selectedOfficeDocument.id}
                documentPath={selectedOfficeDocument.file_path}
                appointmentId={appointmentId}
                editable={userRole === 'notaio' || userRole === 'admin'}
                wsConnection={wsVideoCallRef.current}
                userRole={userRole}
              />
            </div>
          </div>
        </div>
        )
      })()}

      {/* ✅ Input file nascosto per upload documenti di studio */}
      <input
        ref={studioFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleStudioUpload}
      />

      {/* ✅ Modale conferma eliminazione documento */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDocumentToDelete(null)
        }}
        onConfirm={handleDeleteStudioDoc}
        type="delete"
        title="Conferma Eliminazione"
        message="Sei sicuro di voler eliminare questo documento? L'operazione non può essere annullata."
        itemName={documentToDelete?.name}
        itemLabel="Documento"
        confirmText="Elimina"
        cancelText="Annulla"
      />

      {/* ✅ Modale conferma rimozione utente dalla video */}
      <ConfirmModal
        isOpen={showRemoveUserConfirm}
        onClose={() => setShowRemoveUserConfirm(false)}
        onConfirm={handleRemoveUserFromVideo}
        type="warning"
        title="Rimuovi dalla Videochiamata"
        message="Vuoi rimuovere questo partecipante dalla chiamata e riportarlo in sala d'attesa?"
        itemName={clientName}
        itemLabel="Partecipante"
        confirmText="Rimuovi"
        cancelText="Annulla"
      />

      {/* ✅ Modale notifica compatta (successo/errore) */}
      {notificationModal.show && (
        <div className="confirm-modal-overlay" onClick={() => setNotificationModal({ show: false, type: 'success', title: '', message: '' })}>
          <div className="confirm-modal confirm-modal-compact" onClick={(e) => e.stopPropagation()}>
            {/* Header con icona */}
            <div className="confirm-modal-header">
              <button 
                className="modal-close-btn" 
                onClick={() => setNotificationModal({ show: false, type: 'success', title: '', message: '' })}
              >
                <X size={16} />
              </button>
              
              <div className={`modal-icon-container ${
                notificationModal.type === 'success' ? 'success' : 
                notificationModal.type === 'warning' ? 'warning' : 
                'delete'
              }`}>
                {notificationModal.type === 'success' ? (
                  <CheckCircle size={32} strokeWidth={2} />
                ) : notificationModal.type === 'warning' ? (
                  <AlertTriangle size={32} strokeWidth={2} />
                ) : (
                  <XCircle size={32} strokeWidth={2} />
                )}
              </div>
              
              <h3 className="confirm-modal-title">
                {notificationModal.title || (notificationModal.type === 'success' ? 'Operazione Completata' : 'Errore')}
              </h3>
            </div>
            
            {/* Body */}
            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{notificationModal.message}</p>
            </div>
            
            {/* Footer */}
            <div className="confirm-modal-footer">
              <button 
                className={
                  notificationModal.type === 'success' ? 'btn-success' : 
                  notificationModal.type === 'warning' ? 'btn-warning' : 
                  'btn-danger-strong'
                }
                onClick={() => setNotificationModal({ show: false, type: 'success', title: '', message: '' })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentRoom
